import { login } from '../actions'
import Link from 'next/link'
import { VaeloMark } from '@/components/ui/vaelo-mark'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { message: string }
}) {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-paper">
      <div className="w-full max-w-md bg-paper p-8 rounded-lg shadow-sm border border-stone-line flex flex-col items-center">
        <div className="mb-6">
          <VaeloMark size={48} frame={false} variant="accent" stacked />
        </div>
        <h1 className="text-2xl font-serif text-ink mb-6 text-center">Sign In</h1>
        <form className="flex flex-col gap-5 w-full">
          <div>
            <label className="block text-sm font-medium text-ink-soft mb-1" htmlFor="email">Email address</label>
            <input id="email" name="email" type="email" required className="w-full px-4 py-2.5 border border-stone-line bg-paper rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-bronze focus:border-bronze sm:text-sm" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-soft mb-1" htmlFor="password">Password</label>
            <input id="password" name="password" type="password" required className="w-full px-4 py-2.5 border border-stone-line bg-paper rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-bronze focus:border-bronze sm:text-sm" />
          </div>
          {searchParams?.message && (
            <div className="flex items-start gap-2 bg-paper-dim border border-ink text-ink p-3 rounded-xl text-sm">
              <span className="font-mono mt-0.5" aria-hidden="true">!</span>
              <p>{searchParams.message}</p>
            </div>
          )}
          <button formAction={login} className="w-full bg-bronze text-paper py-2.5 px-4 rounded-xl shadow-sm hover:bg-bronze-deep focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-bronze transition-colors sm:text-sm font-medium">Log In</button>
        </form>
        <p className="mt-6 text-center text-sm text-ink-soft">
            Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-medium text-bronze hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
