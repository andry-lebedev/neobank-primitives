import { describe, it, expect } from 'vitest'
import { formatMoney, formatDate, transferTitle } from './format'
import type { Transfer } from '@/data/types'

describe('format', () => {
  it('formats money in the brand locale/currency', () => {
    expect(formatMoney(1234.5)).toBe('€1,234.50')
    expect(formatMoney('2450', 'USDC')).toBe('2,450.00 USDC')
  })

  it('formats ISO dates compactly', () => {
    expect(formatDate('2026-06-13T10:30:00.000Z')).toMatch(/Jun 13/)
  })

  it('titles transfers by type', () => {
    const t: Transfer = { id: 't1', type: 'offramp', state: 'completed', createdAt: '2026-06-01T00:00:00Z', to: { identifier: 'IE12BANK', currency: 'EUR' } }
    expect(transferTitle(t)).toBe('Bank payout')
    expect(transferTitle({ ...t, type: 'onramp' })).toBe('Deposit')
    expect(transferTitle({ ...t, type: 'wallet_to_wallet' })).toBe('Wallet transfer')
  })
})
