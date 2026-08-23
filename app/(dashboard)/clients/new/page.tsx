import { createClientAction } from '../actions'
import Link from 'next/link'

export default function NewClientPage() {
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
