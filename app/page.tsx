import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 text-center px-4">
      <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl mb-4">
        Vaelo CA Workspace
      </h1>
      <p className="mt-4 text-lg text-gray-600 max-w-xl mb-8">
        A professional, deterministic financial and legal workspace designed exclusively for Chartered Accountants.
      </p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="rounded-md bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 transition-colors"
        >
          Sign In
        </Link>
        <Link
          href="/signup"
          className="rounded-md bg-white px-6 py-2.5 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
        >
          Create Account
        </Link>
      </div>
    </div>
  )
}
