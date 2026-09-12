import Link from 'next/link'
import { VaeloMark } from '@/components/ui/vaelo-mark'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper text-center px-4">
      <div className="mb-6">
        <VaeloMark size={96} frame={true} variant="mono" />
      </div>
      <p className="mt-4 text-lg text-ink-soft max-w-xl mb-8">
        A professional, deterministic financial and legal workspace designed exclusively for Chartered Accountants.
      </p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="rounded-md bg-bronze px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-bronze-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronze transition-colors"
        >
          Sign In
        </Link>
        <Link
          href="/signup"
          className="rounded-md bg-paper px-6 py-2.5 text-sm font-semibold text-ink shadow-sm ring-1 ring-inset ring-stone-line hover:bg-paper-dim transition-colors"
        >
          Create Account
        </Link>
      </div>
    </div>
  )
}
