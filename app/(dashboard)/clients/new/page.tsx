import { createClientAction } from '../actions'
import Link from 'next/link'
import { getTeamRoster } from '@/lib/actions/team-actions'

export default async function NewClientPage() {
  const { roster } = await getTeamRoster()
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/clients" className="text-sm font-medium text-slate-600 hover:text-slate-900 mb-4 inline-block">&larr; Back to Clients</Link>
        <h2 className="text-2xl font-medium text-gray-900">Add New Client</h2>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <form action={createClientAction} className="flex flex-col gap-6">
          <div>
            <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
            <input 
              type="text" 
              id="company_name" 
              name="company_name" 
              required 
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 sm:text-sm" 
              placeholder="e.g. Acme Corp"
            />
          </div>

          <div>
            <label htmlFor="assigned_to" className="block text-sm font-medium text-gray-700 mb-1">Assigned Team Member</label>
            <select 
              id="assigned_to" 
              name="assigned_to" 
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 sm:text-sm bg-white"
            >
              <option value="">Default (Me)</option>
              {roster.map(tm => (
                <option key={tm.id} value={tm.id}>{tm.name} ({tm.role})</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">Who will be the primary handler for this client.</p>
          </div>

          <div>
            <label htmlFor="entity_type" className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
            <select 
              id="entity_type" 
              name="entity_type" 
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 sm:text-sm bg-white"
            >
              <option value="">Select an entity type...</option>
              <option value="Private Limited Company">Private Limited Company</option>
              <option value="Public Limited Company">Public Limited Company</option>
              <option value="LLP">Limited Liability Partnership (LLP)</option>
              <option value="Partnership">Partnership</option>
              <option value="Proprietorship">Proprietorship</option>
              <option value="Trust">Trust / NGO</option>
            </select>
          </div>

          <div>
            <label htmlFor="gstin" className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
            <input type="text" id="gstin" name="gstin" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm" placeholder="e.g. 22AAAAA0000A1Z5" />
          </div>

          <div>
            <label htmlFor="pan" className="block text-sm font-medium text-gray-700 mb-1">PAN</label>
            <input type="text" id="pan" name="pan" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm" placeholder="e.g. ABCDE1234F" />
          </div>

          <div>
            <label htmlFor="filing_frequency" className="block text-sm font-medium text-gray-700 mb-1">Filing Frequency</label>
            <select id="filing_frequency" name="filing_frequency" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm bg-white">
              <option value="">Select frequency...</option>
              <option value="Monthly">Monthly</option>
              <option value="QRMP">QRMP</option>
            </select>
          </div>

          <div>
            <label htmlFor="registration_date" className="block text-sm font-medium text-gray-700 mb-1">Registration Date</label>
            <input type="date" id="registration_date" name="registration_date" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm" />
          </div>

          <div>
            <label htmlFor="primary_contact_name" className="block text-sm font-medium text-gray-700 mb-1">Primary Contact Name</label>
            <input type="text" id="primary_contact_name" name="primary_contact_name" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm" placeholder="e.g. John Doe" />
          </div>

          <div>
            <label htmlFor="primary_contact_phone" className="block text-sm font-medium text-gray-700 mb-1">Primary Contact Phone</label>
            <input type="text" id="primary_contact_phone" name="primary_contact_phone" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm" placeholder="e.g. +91 9876543210" />
          </div>

          <div>
            <label htmlFor="primary_contact_email" className="block text-sm font-medium text-gray-700 mb-1">Primary Contact Email</label>
            <input type="email" id="primary_contact_email" name="primary_contact_email" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm" placeholder="e.g. contact@example.com" />
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
            <Link 
              href="/clients"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
            >
              Cancel
            </Link>
            <button 
              type="submit" 
              className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-md shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
            >
              Save Client
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
