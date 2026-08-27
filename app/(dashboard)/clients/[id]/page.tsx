import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createCMAReportAction } from './cma-actions'
import { createFeasibilityReportAction } from './feasibility-actions'
import { createFinancialHealthReportAction } from './financial-health-actions'
import { mapV1ToV2Projections } from '@/lib/pipelines/cma-legacy-mapper'
import { CMAReportViewer } from '@/components/cma-report-viewer'
import { FeasibilityReportViewer } from '@/components/feasibility-report-viewer'
import { FinancialHealthViewer } from '@/components/financial-health-viewer'
import { CMAForm } from '@/components/forms/cma-form'
import { FeasibilityForm } from '@/components/forms/feasibility-form'
import { FinancialHealthForm } from '@/components/forms/financial-health-form'

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

  // Bind server actions with client id
  const generateCMAWithId = createCMAReportAction.bind(null, client.id)
  const generateFeasibilityWithId = createFeasibilityReportAction.bind(null, client.id)
  const generateHealthWithId = createFinancialHealthReportAction.bind(null, client.id)

  const tabs = [
    { id: 'cma', label: 'CMA Report' },
    { id: 'feasibility', label: 'Deal Feasibility' },
    { id: 'health', label: 'Financial Health' },
  ]

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8">
      <div className="flex justify-between items-start">
        <div>
          <Link href="/clients" className="text-sm font-medium text-slate-600 hover:text-slate-900 mb-2 inline-block">&larr; Back to Clients</Link>
          <h2 className="text-3xl font-medium text-gray-900">{client.company_name}</h2>
          <p className="text-gray-500 mt-1">{client.entity_type || 'Entity type not specified'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={`/clients/${client.id}?tab=${tab.id}`}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${currentTab === tab.id
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Latest Report Viewer */}
      {latestReport ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Latest {tabs.find(t => t.id === currentTab)?.label}</h3>
              <p className="text-sm text-gray-500">Generated on {new Date(latestReport.created_at).toLocaleString()}</p>
            </div>
            <span className="text-xs px-2 py-1 rounded-full uppercase font-bold tracking-wider bg-gray-200 text-gray-800">
              {latestReport.status}
            </span>
          </div>
          <div className="p-6 relative">
            {currentTab === 'cma' && <CMAReportViewer historical={cmaHistorical} projections={cmaProjections} reportData={fullCmaData} />}
            {currentTab === 'feasibility' && <FeasibilityReportViewer result={latestReport.output_data} />}
            {currentTab === 'health' && <FinancialHealthViewer result={latestReport.output_data} />}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500 shadow-sm">
          No {tabs.find(t => t.id === currentTab)?.label} generated yet. Fill out the form below to run the pipeline.
        </div>
      )}

      {/* Generation Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-12">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">Generate New {tabs.find(t => t.id === currentTab)?.label}</h3>
          <p className="text-sm text-gray-500">Enter assumptions below to run the deterministic calculation pipeline.</p>
        </div>
        <div className="p-6">
          {currentTab === 'cma' && <CMAForm action={generateCMAWithId} />}
          {currentTab === 'feasibility' && <FeasibilityForm action={generateFeasibilityWithId} defaultClientName={client.company_name} />}
          {currentTab === 'health' && <FinancialHealthForm action={generateHealthWithId} defaultClientName={client.company_name} />}
        </div>
      </div>
    </div>
  )
}
