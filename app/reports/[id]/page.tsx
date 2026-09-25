import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { mapV1ToV2Projections } from '@/lib/pipelines/cma-legacy-mapper'
import { CMAReportViewer } from '@/components/cma-report-viewer'
import { FeasibilityReportViewer } from '@/components/feasibility-report-viewer'
import { FinancialHealthViewer } from '@/components/financial-health-viewer'
import { ReportReviewActions } from '@/components/report-review-actions'
import { getTeamRoster } from '@/lib/actions/team-actions'

export default async function ReportReviewPage({
  params
}: {
  params: { id: string }
}) {
  const supabase = createClient()
  
  // RLS is enforced on reports and clients.
  // We join clients to get client details.
  const { data: report, error } = await supabase
    .from('reports')
    .select(`
      *,
      clients(id, company_name, assigned_to)
    `)
    .eq('id', params.id)
    .single()

  if (error || !report) {
    notFound()
  }

  const client = Array.isArray(report.clients) ? report.clients[0] : report.clients
  if (!client) {
    notFound()
  }

  // Fetch comments
  const { data: commentsData } = await supabase
    .from('report_comments')
    .select('*')
    .eq('report_id', params.id)
    .order('created_at', { ascending: true })
    
  const comments = commentsData || []

  // Resolve author emails
  const adminClient = createServiceRoleClient()
  const { data: usersData } = await adminClient.auth.admin.listUsers()
  
  const commentsWithEmails = comments.map(comment => {
    const user = usersData?.users.find(u => u.id === comment.author_id)
    return {
      ...comment,
      author_email: user?.email || 'Unknown User'
    }
  })

  // Parse report data correctly
  let cmaHistorical = null;
  let cmaProjections = [];
  let fullCmaData = null;
  
  if (report.report_type === 'cma') {
    fullCmaData = report.output_data;
    if (Array.isArray(report.output_data)) {
      cmaProjections = mapV1ToV2Projections(report.output_data as any);
    } else if (report.output_data) {
      const outData = report.output_data as any
      cmaHistorical = outData.historical || null;
      if (outData.baseCase) {
        cmaProjections = outData.baseCase.projections || [];
      } else {
        cmaProjections = outData.projections || [];
        cmaProjections = mapV1ToV2Projections(cmaProjections);
      }
    }
  }

  // Determine reviewer access
  const { roster } = await getTeamRoster()
  const { data: { user } } = await supabase.auth.getUser()
  const myTeamMembership = roster.find(tm => tm.user_id === user?.id)
  
  const isReviewer = myTeamMembership 
    ? (myTeamMembership.role === 'owner' || myTeamMembership.role === 'partner' || client.assigned_to === myTeamMembership.id)
    : false

  // Prepare available figures for dropdown
  let availableFigures: string[] = []
  if (report.report_type === 'cma') {
    availableFigures = ['Revenue', 'Cost of Sales', 'Gross Profit', 'EBITDA', 'Net Profit', 'Total Assets', 'Total Liabilities']
  } else if (report.report_type === 'feasibility') {
    availableFigures = ['Project Cost', 'Funding', 'NPV', 'IRR', 'Payback Period', 'DSCR']
  } else if (report.report_type === 'financial_health') {
    availableFigures = ['Current Ratio', 'Quick Ratio', 'Debt to Equity', 'Interest Coverage', 'Operating Margin']
  }

  const preparer = roster.find(tm => tm.id === client.assigned_to)

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8 py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-start">
        <div>
          <Link href="/review" className="text-sm font-medium text-ink-soft hover:text-ink mb-2 inline-block">&larr; Back to Review Queue</Link>
          <h2 className="text-3xl font-serif font-medium text-ink">{client.company_name} - {report.report_type.toUpperCase()}</h2>
          <p className="text-ink-soft mt-1">Generated on {formatDate(report.created_at)}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="px-3 py-1 text-xs font-mono uppercase tracking-wider bg-paper border border-stone-line rounded-full text-ink">
            {report.status}
          </span>
          {preparer && (
            <div className="text-xs text-ink-soft mt-2 text-right">
              Prepared by: <span className="font-medium text-ink">{preparer.name}</span>
            </div>
          )}
        </div>
      </div>

      <ReportReviewActions 
        reportId={report.id}
        currentStatus={report.status}
        comments={commentsWithEmails}
        isReviewer={isReviewer}
        availableFigures={availableFigures}
      />

      <div className="bg-paper-dim rounded-card border border-stone-line">
        <div className="px-6 py-4 border-b border-stone-line">
          <h3 className="text-lg font-serif font-medium text-ink">Report Details</h3>
        </div>
        <div className="p-6 relative">
          {report.report_type === 'cma' && <CMAReportViewer clientId={client.id} historical={cmaHistorical} projections={cmaProjections} reportData={fullCmaData as any} />}
          {report.report_type === 'feasibility' && <FeasibilityReportViewer clientId={client.id} result={report.output_data as any} />}
          {report.report_type === 'financial_health' && <FinancialHealthViewer clientId={client.id} result={report.output_data as any} />}
        </div>
      </div>
    </div>
  )
}
