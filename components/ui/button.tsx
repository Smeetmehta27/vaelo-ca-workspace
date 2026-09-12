export function Button({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`px-4 py-2 bg-bronze text-white rounded-md shadow-sm hover:bg-bronze-deep focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-bronze transition-colors sm:text-sm font-medium ${props.className || ''}`}
    >
      {children}
    </button>
  )
}
