import type { Transfer } from '../types'
import { daysAgo } from './fixtureTransferTime'

export function alexRecentTransfers(): Transfer[] {
  return [
    { id: 'tx_01', type: 'onramp', state: 'completed', createdAt: daysAgo(1), from: { rail: 'sepa', identifier: 'Acme Payroll' }, to: { amount: '1200.00', currency: 'EUR' } },
    { id: 'tx_02', type: 'offramp', state: 'completed', createdAt: daysAgo(2), from: { amount: '480.00', currency: 'USDC' }, to: { rail: 'sepa', identifier: 'Maria K.', amount: '438.10', currency: 'EUR' } },
    { id: 'tx_03', type: 'wallet_to_wallet', state: 'completed', createdAt: daysAgo(3), from: { amount: '120.00', currency: 'USDC' }, to: { identifier: '0x8f3C…9aD1', amount: '120.00', currency: 'USDC' } },
    { id: 'tx_04', type: 'onramp', state: 'completed', createdAt: daysAgo(4), from: { rail: 'sepa', identifier: 'Stripe payout' }, to: { amount: '2450.00', currency: 'EUR' } },
    { id: 'tx_05', type: 'offramp', state: 'completed', createdAt: daysAgo(6), from: { amount: '900.00', currency: 'EUR' }, to: { rail: 'sepa', identifier: 'Rent — H. Schmidt', amount: '900.00', currency: 'EUR' } },
    { id: 'tx_06', type: 'onramp', state: 'completed', createdAt: daysAgo(8), from: { rail: 'sandbox', identifier: 'USDC deposit' }, to: { amount: '1000.00', currency: 'USDC' } },
  ]
}
