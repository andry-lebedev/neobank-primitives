import { describe, it, expect } from 'vitest'
import {
  formatBalance,
  formatAmount,
  truncateAddress,
  resolveEmail,
  relativeTime,
  groupByDate,
  getKycLabel,
  getVirtualAccount,
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

describe('resolveEmail', () => {
  it('resolves demo email to wallet ID', () => {
    expect(resolveEmail('ak2@swipelux.com', 'ak2@swipelux.com', 'wal_abc')).toBe('wal_abc')
  })
  it('returns null for unknown email', () => {
    expect(resolveEmail('other@x.com', 'ak2@swipelux.com', 'wal_abc')).toBeNull()
  })
  it('is case-insensitive', () => {
    expect(resolveEmail('AK2@SWIPELUX.COM', 'ak2@swipelux.com', 'wal_abc')).toBe('wal_abc')
  })
  it('returns null for empty email', () => {
    expect(resolveEmail('', 'ak2@swipelux.com', 'wal_abc')).toBeNull()
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
    expect(getVirtualAccount(accounts).type).toBe('sepa')
  })
  it('falls back to SWIFT if no SEPA', () => {
    const accounts = [{ source: 'virtual', type: 'swift', swiftCode: 'ABC' }]
    expect(getVirtualAccount(accounts).type).toBe('swift')
  })
  it('returns null for empty array', () => {
    expect(getVirtualAccount([])).toBeNull()
  })
  it('ignores external accounts', () => {
    const accounts = [{ source: 'external', type: 'sepa', iban: 'EE38' }]
    expect(getVirtualAccount(accounts)).toBeNull()
  })
})
