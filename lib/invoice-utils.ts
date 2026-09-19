export function getDaysOverdue(dueDateStr: string | null, referenceDateStr?: string): number {
  if (!dueDateStr) return 0
  
  let todayStr = referenceDateStr
  if (!todayStr) {
    const now = new Date()
    todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  }
  
  const due = new Date(`${dueDateStr}T00:00:00Z`)
  const todayDate = new Date(`${todayStr}T00:00:00Z`)
  
  if (todayDate <= due) return 0
  
  const diffTime = Math.abs(todayDate.getTime() - due.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

