import { describe, it, expect } from 'vitest'
import {
  formatBalance,
  formatAmount,
  truncateAddress,
  relativeTime,
  groupByDate,
  getKycLabel,
  getVirtualAccount,
  canSend,
  kycBanner,
  needsKyc,
} from './utils'

describe('formatBalance', () => {
  it('formats numeric string with 2 decimals', () => {
    expect(formatBalance('2500.00')).toBe('2,500.00')
  })
  it('handles number input', () => {
    expect(formatBalance(1000)).toBe('1,000.00')
  })
  it('returns 0.00 for invalid', () => {
    expect(formatBalance('')).toBe('0.00')
  })
})

describe('formatAmount', () => {
  it('formats amount with currency suffix', () => {
    expect(formatAmount('200', 'USDC')).toBe('200.00 USDC')
  })
  it('handles missing currency', () => {
    expect(formatAmount('50')).toBe('50.00')
  })
})

describe('truncateAddress', () => {
  it('truncates long address at 6 chars each side', () => {
    const addr = '0x71C7656EC7ab88b098defB751B7401B5f6d8976F'
    expect(truncateAddress(addr)).toBe('0x71C7…976F')
  })
  it('returns short strings unchanged', () => {
    expect(truncateAddress('short')).toBe('short')
  })
  it('returns empty string for null', () => {
    expect(truncateAddress(null)).toBe('')
  })
})

describe('getKycLabel', () => {
  it('returns green for approved', () => {
    expect(getKycLabel('approved').color).toBe('green')
  })
  it('returns amber for pending', () => {
    expect(getKycLabel('pending').color).toBe('amber')
  })
  it('returns red for rejected', () => {
    expect(getKycLabel('rejected').color).toBe('red')
  })
  it('falls back gracefully for unknown status', () => {
    expect(getKycLabel('unknown').color).toBe('gray')
  })
})

describe('getVirtualAccount', () => {
  it('prefers SEPA over SWIFT', () => {
    const accounts = [
      { source: 'virtual', type: 'swift', swiftCode: 'ABC' },
      { source: 'virtual', type: 'sepa', iban: 'EE38' },
    ]
    expect(getVirtualAccount(accounts)?.type).toBe('sepa')
  })
  it('falls back to SWIFT if no SEPA', () => {
    const accounts = [{ source: 'virtual', type: 'swift', swiftCode: 'ABC' }]
    expect(getVirtualAccount(accounts)?.type).toBe('swift')
  })
  it('returns null for empty array', () => {
    expect(getVirtualAccount([])).toBeNull()
  })
  it('ignores external accounts', () => {
    const accounts = [{ source: 'external', type: 'sepa', iban: 'EE38' }]
    expect(getVirtualAccount(accounts)).toBeNull()
  })
})

describe('canSend (soft KYC gate)', () => {
  it('blocks only when rejected', () => {
    expect(canSend('rejected')).toBe(false)
    expect(canSend('not_started')).toBe(true)
    expect(canSend('pending')).toBe(true)
    expect(canSend('approved')).toBe(true)
    expect(canSend(undefined)).toBe(true)
  })
})

describe('kycBanner', () => {
  it('returns a message for non-approved statuses and null for approved', () => {
    expect(kycBanner('approved')).toBeNull()
    expect(kycBanner('not_started')).toMatch(/verify/i)
    expect(kycBanner('pending')).toMatch(/review/i)
    expect(kycBanner('rejected')).toMatch(/failed/i)
  })
})

describe('needsKyc', () => {
  it('is true when verification can be started', () => {
    expect(needsKyc(undefined)).toBe(true)
    expect(needsKyc('not_started')).toBe(true)
    expect(needsKyc('rejected')).toBe(true)
  })
  it('is false while pending or approved', () => {
    expect(needsKyc('pending')).toBe(false)
    expect(needsKyc('approved')).toBe(false)
  })
})

describe('relativeTime', () => {
  it('returns "just now" for recent timestamps', () => {
    const recent = new Date(Date.now() - 30000).toISOString() // 30 seconds ago
    expect(relativeTime(recent)).toBe('just now')
  })
  it('returns minutes ago', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60000).toISOString()
    expect(relativeTime(fiveMinAgo)).toBe('5m ago')
  })
  it('returns hours ago', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 3600000).toISOString()
    expect(relativeTime(twoHoursAgo)).toBe('2h ago')
  })
  it('returns days ago', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString()
    expect(relativeTime(threeDaysAgo)).toBe('3d ago')
  })
})

describe('groupByDate', () => {
  it('groups today transfers under Today', () => {
    const t = { id: '1', createdAt: new Date().toISOString() }
    const groups = groupByDate([t])
    expect(Object.keys(groups)).toContain('Today')
    expect(groups['Today']).toHaveLength(1)
  })
  it('groups yesterday transfers under Yesterday', () => {
    const t = { id: '1', createdAt: new Date(Date.now() - 86400000).toISOString() }
    const groups = groupByDate([t])
    expect(Object.keys(groups)).toContain('Yesterday')
  })
  it('returns empty object for empty array', () => {
    expect(groupByDate([])).toEqual({})
  })
  it('sorts within a group newest first', () => {
    const middayToday = new Date()
    middayToday.setHours(12, 0, 0, 0)
    const older = { id: '1', createdAt: new Date(middayToday.getTime() - 7200000).toISOString() }
    const newer = { id: '2', createdAt: new Date(middayToday.getTime() - 3600000).toISOString() }
    const groups = groupByDate([older, newer])
    expect(groups['Today'][0].id).toBe('2')
    expect(groups['Today'][1].id).toBe('1')
  })
})
