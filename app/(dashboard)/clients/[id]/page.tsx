import { formatDate } from '@/lib/utils'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createCMAReportAction } from './cma-actions'
import { createFeasibilityReportAction } from './feasibility-actions'
import { createFinancialHealthReportAction } from './financial-health-actions'
import { reassignClientAction } from '../actions'
import { getTeamRoster } from '@/lib/actions/team-actions'
import { mapV1ToV2Projections } from '@/lib/pipelines/cma-legacy-mapper'
import { CMAReportViewer } from '@/components/cma-report-viewer'
import { FeasibilityReportViewer } from '@/components/feasibility-report-viewer'
import { FinancialHealthViewer } from '@/components/financial-health-viewer'
import { CMAForm } from '@/components/forms/cma-form'
import { FeasibilityForm } from '@/components/forms/feasibility-form'
import { FinancialHealthForm } from '@/components/forms/financial-health-form'
import { InvoicePrompt } from '@/components/invoice-prompt'
import { ClientNotesEditor } from '@/components/client-notes-editor'

export default async function ClientDetailPage({ 
  params, 
  searchParams 
}: { 
  params: { id: string }, 
  searchParams: { tab?: string } 
}) {
  const supabase = createClient()
  const currentTab = searchParams.tab || 'cma'
  
  const { data: client, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !client) {
    notFound()
  }

  const { roster } = await getTeamRoster()

  // Fetch reports for the selected tab only to save bandwidth
  const { data: reports } = await supabase
    .from('reports')
    .select('*')
    .eq('client_id', params.id)
    .eq('report_type', currentTab === 'health' ? 'financial_health' : currentTab)
    .order('created_at', { ascending: false })

  const latestReport = reports && reports.length > 0 ? reports[0] : null;

  let cmaHistorical = null;
  let cmaProjections = [];
  let fullCmaData = null;
  if (latestReport && currentTab === 'cma') {
    fullCmaData = latestReport.output_data;
    if (Array.isArray(latestReport.output_data)) {
      cmaProjections = mapV1ToV2Projections(latestReport.output_data);
    } else if (latestReport.output_data) {
      cmaHistorical = latestReport.output_data.historical || null;
      // Handle V1 format (projections) vs V2 format (baseCase.projections)
      if (latestReport.output_data.baseCase) {
        cmaProjections = latestReport.output_data.baseCase.projections || [];
      } else {
        cmaProjections = latestReport.output_data.projections || [];
        cmaProjections = mapV1ToV2Projections(cmaProjections);
      }
    }
  }

  // Check if an invoice exists for the latest report if it's finalized
  let hasInvoice = false;
  if (latestReport && latestReport.status === 'finalized') {
    const { data: invoice } = await supabase
      .from('invoices')
      .select('id')
      .eq('report_id', latestReport.id)
      .maybeSingle();
    hasInvoice = !!invoice;
  }

  // Bind server actions with client id
  const generateCMAWithId = createCMAReportAction.bind(null, client.id)
  const generateFeasibilityWithId = createFeasibilityReportAction.bind(null, client.id)
  const generateHealthWithId = createFinancialHealthReportAction.bind(null, client.id)

  let clientNote = null
  let updaterName = null
  if (currentTab === 'notes') {
    const { data: note, error: noteError } = await supabase
      .from('client_notes')
      .select('content, updated_at, team_members(user_id)')
      .eq('client_id', params.id)
      .maybeSingle()
      
    if (noteError) {
      console.error('Failed to fetch client notes:', noteError)
    }
    clientNote = note

    if (note?.team_members?.user_id) {
      const adminClient = createServiceRoleClient()
      try {
        const { data } = await adminClient.auth.admin.getUserById(note.team_members.user_id)
        if (data.user?.email) updaterName = data.user.email
      } catch (e) {
        // ignore
      }
    }
  }

  // Fetch latest client financials for pre-filling forms
  const { data: latestFinancials } = await supabase
    .from('client_financials')
    .select('raw_data')
    .eq('client_id', params.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  const defaultFinancials = latestFinancials?.raw_data || null;

  const tabs = [
    { id: 'cma', label: 'CMA Report' },
    { id: 'feasibility', label: 'Deal Feasibility' },
    { id: 'health', label: 'Financial Health' },
    { id: 'documents', label: 'Documents' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'notes', label: 'Client Notes' },
  ]

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8">
      <div className="flex justify-between items-start">
        <div>
          <Link href="/clients" className="text-sm font-medium text-ink-soft hover:text-ink mb-2 inline-block">&larr; Back to Clients</Link>
          <h2 className="text-3xl font-serif font-medium text-ink">{client.company_name}</h2>
          <p className="text-ink-soft mt-1">{client.entity_type || 'Entity type not specified'}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <label className="text-[10px] uppercase font-mono tracking-wide text-ink-soft">Assigned To</label>
          <form action={reassignClientAction} className="flex items-center gap-2">
            <input type="hidden" name="client_id" value={client.id} />
            <select 
              name="assigned_to" 
              defaultValue={client.assigned_to || ''}
              className="text-xs bg-paper border border-stone-line rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-bronze"
            >
              <option value="" disabled>Select Staff</option>
              {roster.map(tm => (
                <option key={tm.id} value={tm.id}>{tm.name} ({tm.role})</option>
              ))}
            </select>
            <button type="submit" className="text-[10px] uppercase font-mono bg-stone-line/50 hover:bg-stone-line/80 px-2 py-1 rounded transition-colors">Save</button>
          </form>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-stone-line">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={tab.id === 'documents' || tab.id === 'timeline' ? `/clients/${client.id}/${tab.id}` : `/clients/${client.id}?tab=${tab.id}`}
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
          ))}
        </nav>
      </div>

      {/* Notes Tab Content */}
      {currentTab === 'notes' && (
        <ClientNotesEditor
          clientId={client.id}
          initialContent={clientNote?.content || ''}
          updatedAt={clientNote?.updated_at || null}
          updatedByName={updaterName}
        />
      )}

      {/* Invoice Prompt for Finalized Reports */}
      {currentTab !== 'notes' && latestReport && latestReport.status === 'finalized' && !hasInvoice && (
        <InvoicePrompt reportId={latestReport.id} clientId={client.id} />
      )}

      {/* Latest Report Viewer */}
      {currentTab !== 'notes' && (latestReport ? (
        <div className="bg-paper-dim rounded-card border border-stone-line">
          <div className="px-6 py-4 border-b border-stone-line flex justify-between items-center">
            <div>
              <h3 className="text-lg font-serif font-medium text-ink">Latest {tabs.find(t => t.id === currentTab)?.label}</h3>
              <p className="text-sm font-mono text-ink-soft mt-1">Generated on {formatDate(latestReport.created_at)}</p>
            </div>
            <span className="text-xs px-3 py-1 rounded-full font-mono uppercase tracking-wider border border-stone-line bg-paper text-ink">
              {latestReport.status}
            </span>
          </div>
          <div className="p-6 relative">
            {currentTab === 'cma' && <CMAReportViewer clientId={params.id} historical={cmaHistorical} projections={cmaProjections} reportData={fullCmaData} />}
            {currentTab === 'feasibility' && <FeasibilityReportViewer clientId={params.id} result={latestReport.output_data} />}
            {currentTab === 'health' && <FinancialHealthViewer clientId={params.id} result={latestReport.output_data} />}
          </div>
        </div>
      ) : (
        <div className="bg-paper-dim rounded-card border border-stone-line p-8 text-center text-ink-soft">
          No {tabs.find(t => t.id === currentTab)?.label} generated yet. Fill out the form below to run the pipeline.
        </div>
      ))}

      {/* Generation Form */}
      {currentTab !== 'notes' && (
        <div className="bg-paper-dim rounded-card border border-stone-line overflow-hidden mb-12">
          <div className="px-6 py-4 border-b border-stone-line">
            <h3 className="text-lg font-serif font-medium text-ink">Generate New {tabs.find(t => t.id === currentTab)?.label}</h3>
            <p className="text-sm text-ink-soft mt-1">Enter assumptions below to run the deterministic calculation pipeline.</p>
          </div>
          <div className="p-6">
            {currentTab === 'cma' && <CMAForm action={generateCMAWithId} defaultFinancials={defaultFinancials} />}
            {currentTab === 'feasibility' && <FeasibilityForm action={generateFeasibilityWithId} defaultClientName={client.company_name} defaultFinancials={defaultFinancials} />}
            {currentTab === 'health' && <FinancialHealthForm action={generateHealthWithId} defaultClientName={client.company_name} defaultFinancials={defaultFinancials} />}
          </div>
        </div>
      )}
    </div>
  )
}
