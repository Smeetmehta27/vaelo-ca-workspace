import { signup } from '../actions'
import Link from 'next/link'
import { VaeloMark } from '@/components/ui/vaelo-mark'
import { createClient } from '@/lib/supabase/server'

export default async function SignupPage({
  searchParams,
}: {
  searchParams: { message?: string, invite?: string }
}) {
  const inviteToken = searchParams.invite

  let inviteDetails = null
  let inviteError = false

  if (inviteToken) {
    const supabase = createClient()
    const { data, error } = await supabase.rpc('get_invite_details_by_token', { token: inviteToken })
    
    if (error || !data || data.length === 0 || !data[0].valid) {
      inviteError = true
    } else {
      inviteDetails = data[0]
    }
  }

  const submitAction = async (formData: FormData) => {
    'use server'
    await signup(formData, inviteToken)
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-paper py-12 px-4">
      <div className="w-full max-w-md bg-paper p-8 rounded-lg shadow-sm border border-stone-line flex flex-col items-center">
        <div className="mb-6">
          <VaeloMark size={48} frame={false} variant="accent" stacked />
        </div>
        
        {inviteDetails ? (
          <div className="text-center mb-6">
            <h1 className="text-xl font-medium text-ink mb-2">Join {inviteDetails.firm_name}</h1>
            <p className="text-sm text-ink-soft">
              You&apos;ve been invited to join the firm as a <span className="font-medium text-ink capitalize">{inviteDetails.role}</span>.
            </p>
          </div>
        ) : (
          <h1 className="text-2xl font-serif text-ink mb-6 text-center">Create an Account</h1>
        )}

        {inviteError && (
          <div className="w-full mb-6 flex items-start gap-2 bg-paper-dim border border-ink text-ink p-3 rounded-xl text-sm">
            <span className="font-mono mt-0.5" aria-hidden="true">!</span>
            <p>This invite link is invalid or has expired. You can still sign up for a new account below.</p>
          </div>
        )}

        <form className="flex flex-col gap-5 w-full">
          <div>
            <label className="block text-sm font-medium text-ink-soft mb-1" htmlFor="email">Email address</label>
            <input 
              id="email" 
              name="email" 
              type="email" 
              required 
              defaultValue={inviteDetails?.email || ''}
              readOnly={!!inviteDetails}
              className={`w-full px-4 py-2.5 border border-stone-line rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-bronze focus:border-bronze sm:text-sm ${inviteDetails ? 'bg-paper-dim text-ink-soft cursor-not-allowed' : 'bg-paper text-ink'}`} 
              placeholder="you@example.com" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-soft mb-1" htmlFor="password">Password</label>
            <input 
              id="password" 
              name="password" 
              type="password" 
              required 
              className="w-full px-4 py-2.5 border border-stone-line bg-paper rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-bronze focus:border-bronze sm:text-sm text-ink" 
            />
          </div>
          {searchParams?.message && (
            <div className="flex items-start gap-2 bg-paper-dim border border-ink text-ink p-3 rounded-xl text-sm">
              <span className="font-mono mt-0.5" aria-hidden="true">!</span>
              <p>{searchParams.message}</p>
            </div>
          )}
          <button formAction={submitAction} className="w-full bg-bronze text-paper py-2.5 px-4 rounded-xl shadow-sm hover:bg-bronze-deep focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-bronze transition-colors sm:text-sm font-medium">
            Sign Up
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-ink-soft">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-bronze hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
