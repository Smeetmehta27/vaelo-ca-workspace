import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Client, ClientFinancials, Report } from '@/lib/types'

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  
  const { data: client, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !client) {
    notFound()
  }

  const { data: financials } = await supabase
    .from('client_financials')
    .select('*')
    .eq('client_id', params.id)
    .order('financial_year', { ascending: false })

  const { data: reports } = await supabase
    .from('reports')
    .select('*')
    .eq('client_id', params.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8">
      <div className="flex justify-between items-start">
        <div>
          <Link href="/clients" className="text-sm font-medium text-slate-600 hover:text-slate-900 mb-2 inline-block">&larr; Back to Clients</Link>
          <h2 className="text-3xl font-medium text-gray-900">{client.company_name}</h2>
          <p className="text-gray-500 mt-1">{client.entity_type || 'Entity type not specified'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900">Financial Data</h3>
            <button className="text-sm font-medium text-slate-600 hover:text-slate-900 bg-white border border-gray-300 px-3 py-1.5 rounded shadow-sm">
              Upload Data
            </button>
          </div>
          <div className="p-6">
            {financials && financials.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {financials.map((fin: ClientFinancials) => (
                  <li key={fin.id} className="py-3 flex justify-between items-center">
                    <span className="font-medium text-gray-900">FY {fin.financial_year}</span>
                    <span className="text-sm text-gray-500">Data ingested</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No financial data uploaded yet.</p>
                <p className="text-sm mt-1">Upload trial balances or ledgers to power the report pipelines.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900">Generated Reports</h3>
            <button className="text-sm font-medium text-slate-600 hover:text-slate-900 bg-white border border-gray-300 px-3 py-1.5 rounded shadow-sm">
              New Report
            </button>
          </div>
          <div className="p-6">
            {reports && reports.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {reports.map((report: Report) => (
                  <li key={report.id} className="py-3 flex justify-between items-center">
                    <span className="font-medium text-gray-900 uppercase">{report.report_type}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      report.status === 'finalized' ? 'bg-green-100 text-green-800' :
                      report.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {report.status}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No reports generated yet.</p>
                <p className="text-sm mt-1">Upload financial data first to run a report pipeline.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
