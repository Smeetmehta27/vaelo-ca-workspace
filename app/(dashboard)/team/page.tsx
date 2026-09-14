import { getTeamRoster } from '@/lib/actions/team-actions'
import { getBaseUrl } from '@/lib/server-utils'
import { TeamInviteForm } from './TeamInviteForm'

export default async function TeamPage() {
  const { actingRole, roster, pendingInvites } = await getTeamRoster()
  const origin = getBaseUrl()

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Team Roster</h1>
        <p className="text-ink-soft mt-1">
          Manage your firm&apos;s team members and invites.
        </p>
      </div>

      <div className="bg-paper border border-stone-line rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-line">
          <h2 className="text-lg font-medium text-ink">Active Members</h2>
        </div>
        <div className="divide-y divide-stone-line">
          {roster.map((member) => (
            <div key={member.user_id} className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-ink">{member.name}</p>
                <p className="text-sm text-ink-soft">{member.email}</p>
              </div>
              <div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono uppercase tracking-wider bg-stone-light text-ink-soft border border-stone-line">
                  {member.role}
                </span>
              </div>
            </div>
          ))}
          {roster.length === 0 && (
            <div className="px-6 py-4 text-ink-soft text-sm">No active team members.</div>
          )}
        </div>
      </div>

      {pendingInvites.length > 0 && (
        <div className="bg-paper border border-stone-line rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-line">
            <h2 className="text-lg font-medium text-ink">Pending Invites</h2>
          </div>
          <div className="divide-y divide-stone-line">
            {pendingInvites.map((invite, idx) => (
              <div key={idx} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-ink">{invite.email}</p>
                  <p className="text-sm text-ink-soft">
                    Expires: {new Date(invite.expires_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono uppercase tracking-wider bg-stone-light text-ink-soft border border-stone-line">
                    {invite.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {actingRole !== 'staff' && (
        <TeamInviteForm origin={origin} />
      )}
    </div>
  )
}
