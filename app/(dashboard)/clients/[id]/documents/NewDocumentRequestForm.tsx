'use client'

import { useState, useEffect } from 'react'
import { createDocumentRequestList, getTemplatesForCA } from '@/lib/actions/document-request-actions'
import { DocumentRequestTemplate } from '@/lib/types'

export function NewDocumentRequestForm({ clientId }: { clientId: string }) {
  const [title, setTitle] = useState('')
  const [reportType, setReportType] = useState('')
  const [items, setItems] = useState([{ name: '', required: true, dueDate: '' }])
  
  // Template states
  const [templates, setTemplates] = useState<DocumentRequestTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  
  // Save as template states
  const [saveAsTemplate, setSaveAsTemplate] = useState(false)
  const [templateName, setTemplateName] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])

  useEffect(() => {
    // Load templates on mount
    getTemplatesForCA().then(data => {
      setTemplates(data || [])
    }).catch(err => {
      console.error('Failed to load templates:', err)
    })
  }, [])

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tId = e.target.value
    setSelectedTemplateId(tId)

    if (tId) {
      const template = templates.find(t => t.id === tId)
      if (template) {
        const t = template as DocumentRequestTemplate & { document_request_template_items?: { name: string, required: boolean }[] };
        if (t.document_request_template_items) {
          const tItems = t.document_request_template_items.map(ti => ({
            name: ti.name,
            required: ti.required,
            dueDate: ''
          }))
          if (tItems.length > 0) {
            setItems(tItems)
          }
        }
      }
    } else {
      setItems([{ name: '', required: true, dueDate: '' }])
    }
  }

  const handleAddItem = () => {
    setItems([...items, { name: '', required: true, dueDate: '' }])
  }

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleItemChange = (index: number, field: string, value: string | boolean) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setWarnings([])
    
    // Validate
    if (!title.trim()) {
      setError('Title is required.')
      setLoading(false)
      return
    }

    if (saveAsTemplate && !templateName.trim()) {
      setError('Template name is required to save as a template.')
      setLoading(false)
      return
    }
    
    const validItems = items.filter(i => i.name.trim() !== '').map(i => ({
      name: i.name,
      required: i.required,
      dueDate: i.dueDate || null
    }))
    
    const result = await createDocumentRequestList(
      clientId, 
      title, 
      reportType || null, 
      validItems,
      saveAsTemplate ? templateName.trim() : undefined
    )
    
    if (!result.success) {
      setError(result.errors?.[0] || 'An error occurred.')
    } else {
      if (result.warnings && result.warnings.length > 0) {
        setWarnings(result.warnings)
      } else {
        // Find parent details element and close it only if no warnings to show
        const details = document.getElementById('new-doc-req-details') as HTMLDetailsElement
        if (details) details.open = false
      }
      
      // Reset form
      setTitle('')
      setReportType('')
      setItems([{ name: '', required: true, dueDate: '' }])
      setSaveAsTemplate(false)
      setTemplateName('')
      setSelectedTemplateId('')

      // Reload templates if we saved a new one
      if (saveAsTemplate) {
        getTemplatesForCA().then(data => setTemplates(data || []))
      }
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md text-sm flex justify-between items-start">
          <div>
            <p className="font-medium mb-1">List created successfully, but with warnings:</p>
            <ul className="list-disc pl-5">
              {warnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
          <button type="button" onClick={() => setWarnings([])} className="text-yellow-600 hover:text-yellow-800">
            &times;
          </button>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">List Title *</label>
          <input 
            type="text" 
            id="title" 
            value={title}
            onChange={e => setTitle(e.target.value)}
            required 
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 sm:text-sm" 
            placeholder="e.g. Initial Onboarding Documents"
          />
        </div>

        <div>
          <label htmlFor="report_type" className="block text-sm font-medium text-gray-700 mb-1">Related Report (Optional)</label>
          <select 
            id="report_type" 
            value={reportType}
            onChange={e => setReportType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 sm:text-sm bg-white"
          >
            <option value="">None</option>
            <option value="cma">CMA Report</option>
            <option value="feasibility">Deal Feasibility</option>
            <option value="financial_health">Financial Health</option>
          </select>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <label htmlFor="template_select" className="block text-sm font-medium text-gray-700 mb-1">Start from a Template</label>
        <select 
          id="template_select" 
          value={selectedTemplateId}
          onChange={handleTemplateChange}
          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 sm:text-sm bg-white"
        >
          <option value="">-- No template (start blank) --</option>
          {templates.map(t => (
            <option key={t.id} value={t.id}>
              {t.name} {t.report_type && `(${t.report_type})`}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700">Requested Items</label>
          <button 
            type="button" 
            onClick={handleAddItem}
            className="text-sm text-slate-600 hover:text-slate-900 font-medium"
          >
            + Add Item
          </button>
        </div>
        
        <div className="flex flex-col gap-3">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 bg-gray-50 p-3 rounded-md border border-gray-200">
              <div className="flex-1">
                <input 
                  type="text" 
                  value={item.name}
                  onChange={e => handleItemChange(idx, 'name', e.target.value)}
                  placeholder="Document Name (e.g. Bank Statement)" 
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 sm:text-sm"
                />
              </div>
              <div className="w-32">
                <input 
                  type="date" 
                  value={item.dueDate}
                  onChange={e => handleItemChange(idx, 'dueDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 sm:text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id={`req-${idx}`}
                  checked={item.required}
                  onChange={e => handleItemChange(idx, 'required', e.target.checked)}
                  className="h-4 w-4 text-slate-600 focus:ring-slate-500 border-gray-300 rounded"
                />
                <label htmlFor={`req-${idx}`} className="text-sm text-gray-700">Req</label>
              </div>
              <button 
                type="button" 
                onClick={() => handleRemoveItem(idx)}
                className="text-gray-400 hover:text-red-500 p-1"
                disabled={items.length === 1}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-50 p-4 rounded-md border border-slate-200 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <input 
            type="checkbox" 
            id="save_as_template"
            checked={saveAsTemplate}
            onChange={e => setSaveAsTemplate(e.target.checked)}
            className="h-4 w-4 text-slate-600 focus:ring-slate-500 border-gray-300 rounded"
          />
          <label htmlFor="save_as_template" className="text-sm font-medium text-gray-700">
            Save these items as a new template
          </label>
        </div>
        
        {saveAsTemplate && (
          <div className="ml-6">
            <label htmlFor="template_name" className="block text-sm font-medium text-gray-700 mb-1">Template Name *</label>
            <input 
              type="text" 
              id="template_name" 
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              required={saveAsTemplate}
              className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 sm:text-sm" 
              placeholder="e.g. Standard CMA Requirements"
            />
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
        <button 
          type="button"
          onClick={() => {
            const details = document.getElementById('new-doc-req-details') as HTMLDetailsElement
            if (details) details.open = false
          }}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-md shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Request List'}
        </button>
      </div>
    </form>
  )
}
