'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export async function createInvite(email: string, role: 'partner' | 'staff') {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')
  
  if (role !== 'partner' && role !== 'staff') {
    throw new Error('Invalid role')
  }

  // 1. Get acting user's firm context
  const { data: teamMember, error: tmError } = await supabase
    .from('team_members')
    .select('firm_id, role')
    .eq('user_id', user.id)
    .single()

  if (tmError || !teamMember) {
    throw new Error('User is not associated with a firm')
  }

  // 2. Authorize action
  if (teamMember.role === 'staff') {
    throw new Error('Staff members cannot create invites')
  }

  // 3. Insert invite
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const { data: invite, error: inviteError } = await supabase
    .from('team_invites')
    .insert({
      firm_id: teamMember.firm_id,
      invited_by: user.id,
      expires_at: expiresAt.toISOString(),
      role,
      email,
    })
    .select('access_token')
    .single()

  if (inviteError || !invite) {
    throw new Error('Failed to create invite')
  }

  return invite.access_token
}

export async function getTeamRoster() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  // 1. Get firm context
  const { data: teamMember, error: tmError } = await supabase
    .from('team_members')
    .select('firm_id, role')
    .eq('user_id', user.id)
    .single()

  if (tmError || !teamMember) {
    throw new Error('User is not associated with a firm')
  }

  // 2. Fetch all team members and their ca_profiles
  const { data: roster, error: rosterError } = await supabase
    .from('team_members')
    .select(`
      user_id,
      role,
      ca_profiles(name)
    `)
    .eq('firm_id', teamMember.firm_id)

  if (rosterError || !roster) {
    throw new Error('Failed to load roster')
  }

  // 3. Fetch pending invites
  const { data: pendingInvites, error: invitesError } = await supabase
    .from('team_invites')
    .select('email, role, expires_at')
    .eq('firm_id', teamMember.firm_id)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())

  if (invitesError) {
    throw new Error('Failed to load invites')
  }

  // 4. Look up emails via Supabase Admin Client
  // Since there's no public view for auth.users, we use the admin client
  // and map over the user_ids to fetch emails safely server-side.
  const adminClient = createServiceRoleClient()

  const enrichedRoster = await Promise.all(roster.map(async (member) => {
    let email = 'Unknown'
    try {
      const { data } = await adminClient.auth.admin.getUserById(member.user_id)
      if (data.user?.email) email = data.user.email
    } catch {
      // Ignore
    }
    
    // Type casting to handle the joined profile
    const profile = member.ca_profiles as unknown as { name: string } | null
    return {
      user_id: member.user_id,
      role: member.role,
      name: profile?.name || 'Unnamed',
      email
    }
  }))

  return {
    actingRole: teamMember.role,
    roster: enrichedRoster,
    pendingInvites: pendingInvites || []
  }
}
