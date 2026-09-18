export type ComplianceRule = {
  id: string
  entity_type: string
  task_type: string
  frequency: string
  requires_gst: boolean
  qrmp_only: boolean
  day_of_period_due: number
}

export type ClientData = {
  id: string
  entity_type: string | null
  gstin: string | null
  filing_frequency: string | null
  assigned_to: string | null
}

export type ComplianceTaskInsert = {
  client_id: string
  source_rule_id: string
  task_type: string
  period_label: string
  due_date: string
  owner_id: string | null
  status: string
}

export function generateTasksForClient(
  client: ClientData,
  rules: ComplianceRule[],
  referenceDate: Date = new Date()
): ComplianceTaskInsert[] {
  if (!client.entity_type) return []

  const tasks: ComplianceTaskInsert[] = []
  
  // Filter rules by entity type
  const entityRules = rules.filter(r => r.entity_type === client.entity_type)

  const isQrmp = client.filing_frequency === 'QRMP'
  const hasGst = !!client.gstin

  // Filter rules based on GST status and QRMP
  const applicableRules = entityRules.filter(r => {
    if (r.requires_gst && !hasGst) return false
    if (r.requires_gst && hasGst) {
      if (isQrmp && !r.qrmp_only && (r.task_type === 'GSTR-1' || r.task_type === 'GSTR-3B')) {
        return false // skip monthly rules for QRMP clients
      }
      if (!isQrmp && r.qrmp_only) {
        return false // skip QRMP rules for regular clients
      }
    }
    return true
  })

  const year = referenceDate.getFullYear()
  const month = referenceDate.getMonth() // 0-11
  
  applicableRules.forEach(rule => {
    let periodLabel = ''
    let dueDate: Date | null = null

    if (rule.frequency === 'monthly') {
      // Due in the next month
      // e.g. for referenceDate in August, the period is August, due in September
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      periodLabel = `${rule.task_type} ${monthNames[month]} ${year}`
      
      const dueMonth = month + 1
      const dueYear = dueMonth > 11 ? year + 1 : year
      dueDate = new Date(Date.UTC(dueYear, dueMonth % 12, rule.day_of_period_due))
    } 
    else if (rule.frequency === 'quarterly') {
      let q = 1
      let dueMonth = 6 // default to month following quarter
      if (month >= 3 && month <= 5) { q = 1; dueMonth = 6; }
      else if (month >= 6 && month <= 8) { q = 2; dueMonth = 9; }
      else if (month >= 9 && month <= 11) { q = 3; dueMonth = 0; }
      else { q = 4; dueMonth = 3; }

      // Advance tax is due in the last month of the quarter, not the month after
      if (rule.task_type === 'ADVANCE_TAX') {
        if (q === 1) dueMonth = 5; // Jun
        else if (q === 2) dueMonth = 8; // Sep
        else if (q === 3) dueMonth = 11; // Dec
        else if (q === 4) dueMonth = 2; // Mar
      }

      const fyYearStart = month < 3 ? year - 1 : year
      const fy = `${fyYearStart.toString().slice(-2)}-${(fyYearStart + 1).toString().slice(-2)}`
      
      // Advance tax often uses installment numbers instead of Qs, but Q works for period_label uniqueness
      periodLabel = `${rule.task_type} Q${q} FY${fy}`
      
      let dueYear = year
      if (rule.task_type === 'ADVANCE_TAX') {
        dueYear = dueMonth === 2 ? (month < 3 ? year : year + 1) : (month < 3 ? year - 1 : year)
      } else {
        dueYear = dueMonth === 0 || dueMonth === 3 ? (month < 3 ? year : year + 1) : year
      }
      
      dueDate = new Date(Date.UTC(dueYear, dueMonth, rule.day_of_period_due))
    }
    else if (rule.frequency === 'annual') {
      // Annual typically due in Oct/Nov for the previous FY
      // If referenceDate is in e.g. April 2026, we might be looking at FY 25-26
      const fyYearStart = month < 3 ? year - 2 : year - 1
      const fy = `${fyYearStart.toString().slice(-2)}-${(fyYearStart + 1).toString().slice(-2)}`
      periodLabel = `${rule.task_type} FY${fy}`
      
      // ITR due Oct 31 of assessment year
      const dueYear = month < 3 ? year - 1 : year
      const dueMonth = rule.task_type === 'ITR' ? 9 : (rule.task_type === 'ROC_FILING' ? 9 : 0) // default to Oct (9)
      dueDate = new Date(Date.UTC(dueYear, dueMonth, rule.day_of_period_due))
    }

    if (dueDate) {
      tasks.push({
        client_id: client.id,
        source_rule_id: rule.id,
        task_type: rule.task_type,
        period_label: periodLabel,
        due_date: dueDate.toISOString().split('T')[0],
        owner_id: client.assigned_to,
        status: 'pending'
      })
    }
  })

  return tasks
}
