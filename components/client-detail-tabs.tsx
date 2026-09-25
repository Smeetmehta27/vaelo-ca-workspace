import Link from 'next/link'

export const TABS = [
  { id: 'cma', label: 'CMA Report' },
  { id: 'feasibility', label: 'Deal Feasibility' },
  { id: 'health', label: 'Financial Health' },
  { id: 'documents', label: 'Documents' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'notes', label: 'Client Notes' },
]

export function ClientDetailTabs({
  clientId,
  currentTab,
}: {
  clientId: string
  currentTab: string
}) {
  return (
    <div className="border-b border-stone-line">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {TABS.map((tab) => {
          const href =
            tab.id === 'documents' || tab.id === 'timeline'
              ? `/clients/${clientId}/${tab.id}`
              : `/clients/${clientId}?tab=${tab.id}`

          return (
            <Link
              key={tab.id}
              href={href}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${currentTab === tab.id
                  ? 'border-ink text-ink'
                  : 'border-transparent text-ink-soft hover:text-ink hover:border-stone'
                }
              `}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
