import { describe, it, expect } from 'vitest'
import { getDaysOverdue } from '../../lib/invoice-utils'

describe('Invoice Utilities - getDaysOverdue', () => {
  it('returns 0 if dueDateStr is null', () => {
    expect(getDaysOverdue(null)).toBe(0)
  })

  it('returns 0 if due date is today', () => {
    // Both are same date
    expect(getDaysOverdue('2024-03-15', '2024-03-15')).toBe(0)
  })

  it('returns 0 if due date is in the future', () => {
    // Due tomorrow
    expect(getDaysOverdue('2024-03-16', '2024-03-15')).toBe(0)
    // Due way in the future
    expect(getDaysOverdue('2024-12-31', '2024-03-15')).toBe(0)
  })

  it('returns 1 if due date was yesterday', () => {
    expect(getDaysOverdue('2024-03-14', '2024-03-15')).toBe(1)
  })

  it('calculates correct days across months', () => {
    // Due Feb 28 (leap year), today is March 1
    expect(getDaysOverdue('2024-02-28', '2024-03-01')).toBe(2)
  })

  it('calculates correct days across years', () => {
    // Due Dec 31, today is Jan 2
    expect(getDaysOverdue('2023-12-31', '2024-01-02')).toBe(2)
  })
})
