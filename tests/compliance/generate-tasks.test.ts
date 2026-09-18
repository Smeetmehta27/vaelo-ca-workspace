import { describe, it, expect } from 'vitest'
import { generateTasksForClient, ComplianceRule, ClientData } from '../../lib/compliance/generate-tasks'

describe('generateTasksForClient', () => {
  const baseRules: ComplianceRule[] = [
    { id: '1', entity_type: 'Private Limited Company', task_type: 'GSTR-1', frequency: 'monthly', requires_gst: true, qrmp_only: false, day_of_period_due: 11 },
    { id: '2', entity_type: 'Private Limited Company', task_type: 'GSTR-1', frequency: 'quarterly', requires_gst: true, qrmp_only: true, day_of_period_due: 13 },
    { id: '3', entity_type: 'Private Limited Company', task_type: 'GSTR-3B', frequency: 'monthly', requires_gst: true, qrmp_only: false, day_of_period_due: 20 },
    { id: '4', entity_type: 'Private Limited Company', task_type: 'GSTR-3B', frequency: 'quarterly', requires_gst: true, qrmp_only: true, day_of_period_due: 24 },
    { id: '5', entity_type: 'Private Limited Company', task_type: 'TDS_RETURN', frequency: 'quarterly', requires_gst: false, qrmp_only: false, day_of_period_due: 31 },
    { id: '6', entity_type: 'Private Limited Company', task_type: 'ADVANCE_TAX', frequency: 'quarterly', requires_gst: false, qrmp_only: false, day_of_period_due: 15 },
    { id: '7', entity_type: 'Private Limited Company', task_type: 'ITR', frequency: 'annual', requires_gst: false, qrmp_only: false, day_of_period_due: 31 },
    { id: '8', entity_type: 'Private Limited Company', task_type: 'ROC_FILING', frequency: 'annual', requires_gst: false, qrmp_only: false, day_of_period_due: 30 },
  ]

  const baseClient: ClientData = {
    id: 'client-1',
    entity_type: 'Private Limited Company',
    gstin: null,
    filing_frequency: null,
    assigned_to: 'user-1'
  }

  // Use a fixed reference date: August 15, 2026
  const refDate = new Date('2026-08-15T12:00:00Z')

  it('generates correct tasks for standard monthly GST client', () => {
    const client = { ...baseClient, gstin: '27AAAAA0000A1Z5', filing_frequency: 'Monthly' }
    const tasks = generateTasksForClient(client, baseRules, refDate)

    const taskTypes = tasks.map(t => t.task_type)
    expect(taskTypes).toContain('GSTR-1')
    expect(taskTypes).toContain('GSTR-3B')
    expect(taskTypes).toContain('TDS_RETURN')
    expect(taskTypes).toContain('ADVANCE_TAX')
    expect(taskTypes).toContain('ITR')
    expect(taskTypes).toContain('ROC_FILING')

    const gstr1 = tasks.find(t => t.task_type === 'GSTR-1')
    expect(gstr1?.period_label).toBe('GSTR-1 Aug 2026')
    expect(gstr1?.due_date).toBe('2026-09-11') // 11th of next month

    const gstr3b = tasks.find(t => t.task_type === 'GSTR-3B')
    expect(gstr3b?.period_label).toBe('GSTR-3B Aug 2026')
    expect(gstr3b?.due_date).toBe('2026-09-20') // 20th of next month

    const tds = tasks.find(t => t.task_type === 'TDS_RETURN')
    expect(tds?.period_label).toBe('TDS_RETURN Q2 FY26-27') // Aug is Q2
    expect(tds?.due_date).toBe('2026-10-31') // 31st of month following Q2
  })

  it('generates correct tasks for QRMP GST client', () => {
    const client = { ...baseClient, gstin: '27AAAAA0000A1Z5', filing_frequency: 'QRMP' }
    const tasks = generateTasksForClient(client, baseRules, refDate)

    const gstr1 = tasks.find(t => t.task_type === 'GSTR-1')
    expect(gstr1?.period_label).toBe('GSTR-1 Q2 FY26-27')
    expect(gstr1?.due_date).toBe('2026-10-13')

    const gstr3b = tasks.find(t => t.task_type === 'GSTR-3B')
    expect(gstr3b?.period_label).toBe('GSTR-3B Q2 FY26-27')
    expect(gstr3b?.due_date).toBe('2026-10-24')
  })

  it('generates correct tasks for non-GST client', () => {
    const client = { ...baseClient, gstin: null }
    const tasks = generateTasksForClient(client, baseRules, refDate)

    const taskTypes = tasks.map(t => t.task_type)
    expect(taskTypes).not.toContain('GSTR-1')
    expect(taskTypes).not.toContain('GSTR-3B')
    expect(taskTypes).toContain('TDS_RETURN')
    expect(taskTypes).toContain('ADVANCE_TAX')
  })

  it('generates correct advance tax dates', () => {
    const client = { ...baseClient, gstin: null }
    const tasks = generateTasksForClient(client, baseRules, refDate)

    const advTax = tasks.find(t => t.task_type === 'ADVANCE_TAX')
    // August is Q2 (Jul-Sep) -> last month of Q2 is Sept -> Due Sept 15
    expect(advTax?.period_label).toBe('ADVANCE_TAX Q2 FY26-27')
    expect(advTax?.due_date).toBe('2026-09-15')
  })

  it('generates correct tasks for company-type client (ROC filing)', () => {
    const client = { ...baseClient, entity_type: 'Private Limited Company' }
    const tasks = generateTasksForClient(client, baseRules, refDate)
    
    const roc = tasks.find(t => t.task_type === 'ROC_FILING')
    expect(roc).toBeDefined()
    expect(roc?.period_label).toBe('ROC_FILING FY25-26')
    expect(roc?.due_date).toBe('2026-10-30')
  })

  it('ensures idempotency by returning consistent period labels', () => {
    const client = { ...baseClient, gstin: '27AAAAA0000A1Z5', filing_frequency: 'Monthly' }
    const tasks1 = generateTasksForClient(client, baseRules, refDate)
    
    // Simulating running a day later in the same month
    const refDateLater = new Date('2026-08-16T12:00:00Z')
    const tasks2 = generateTasksForClient(client, baseRules, refDateLater)

    expect(tasks1).toEqual(tasks2)
  })
})
