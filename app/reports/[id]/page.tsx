import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { mapV1ToV2Projections } from '@/lib/pipelines/cma-legacy-mapper'
import { mapCMAReportSchedules } from '@/lib/report-mappers/cma-mapper'
import { mapFeasibilityReport } from '@/lib/report-mappers/feasibility-mapper'
import { mapFinancialHealthReport } from '@/lib/report-mappers/financial-health-mapper'
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
    ? (myTeamMembership.role === 'owner' || myTeamMembership.role === 'partner')
    : false

  // Prepare available figures for dropdown
  let availableFigures: { id: string, displayLabel: string, formula: string, inputs: Record<string, number>, value: number }[] = []
  
  if (report.report_type === 'cma') {
    const schedules = mapCMAReportSchedules(cmaHistorical as any, cmaProjections);
    schedules.forEach(schedule => {
      schedule.rows.forEach(row => {
        if (row.isHeader || !row.projectedValues) return;
        // The prompt says to skip header/subtotal rows with no AuditedValue, we just check if value has formula/inputs
        row.projectedValues.forEach((val, idx) => {
          if (val && typeof val === 'object' && 'formula' in val && 'inputs' in val) {
            const colName = schedule.columns[idx + 1] || `Year ${idx + 1}`;
            availableFigures.push({
              id: `${schedule.scheduleTitle}__${row.label}__${idx}`,
              displayLabel: `${schedule.scheduleTitle} — ${row.label} (${colName})`,
              formula: val.formula,
              inputs: val.inputs,
              value: val.value
            });
          }
        });
      });
    });
  } else if (report.report_type === 'feasibility' || report.report_type === 'financial_health') {
    let schedules: any[] = [];
    if (report.report_type === 'feasibility') {
      schedules = mapFeasibilityReport(report.output_data as any).schedules;
    } else {
      schedules = mapFinancialHealthReport(report.output_data as any).schedules;
    }

    schedules.forEach(schedule => {
      schedule.rows.forEach((row: any, rIdx: number) => {
        if (row.isHeader) return;
        const fields = ['value', 'historical', 'year1', 'year2', 'year3'];
        fields.forEach(field => {
          const val = row[field];
          if (val && typeof val === 'object' && 'formula' in val && 'inputs' in val) {
            let colName = field;
            if (field === 'value') colName = schedule.columns[0] || 'Value';
            else if (field === 'historical') colName = 'Historical';
            else if (field === 'year1') colName = 'Year 1';
            else if (field === 'year2') colName = 'Year 2';
            else if (field === 'year3') colName = 'Year 3';
            
            availableFigures.push({
              id: `${schedule.scheduleTitle}__${row.label}__${field}__${rIdx}`,
              displayLabel: `${schedule.scheduleTitle} — ${row.label} (${colName})`,
              formula: val.formula,
              inputs: val.inputs,
              value: val.value
            });
          }
        });
      });
    });
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
        clientId={client.id}
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
