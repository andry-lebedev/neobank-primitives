import type { Transfer } from '../types'
import { daysAgo } from './fixtureTransferTime'

export function northwindTransfers(): Transfer[] {
  return [
    { id: 'tx_nw01', type: 'onramp', state: 'completed', createdAt: daysAgo(1), from: { rail: 'sepa', identifier: 'Customer invoice 2041' }, to: { amount: '18400.00', currency: 'EUR' } },
    { id: 'tx_nw02', type: 'offramp', state: 'completed', createdAt: daysAgo(2), from: { amount: '7600.00', currency: 'EUR' }, to: { rail: 'sepa', identifier: 'Baltic Freight OÜ', amount: '7600.00', currency: 'EUR' } },
    { id: 'tx_nw03', type: 'offramp', state: 'completed', createdAt: daysAgo(5), from: { amount: '3000.00', currency: 'USDC' }, to: { rail: 'swift', identifier: 'Shenzhen Supplies Co', amount: '21450', currency: 'CNY' } },
    { id: 'tx_nw04', type: 'onramp', state: 'completed', createdAt: daysAgo(7), from: { rail: 'sandbox', identifier: 'USDC treasury' }, to: { amount: '12000.00', currency: 'USDC' } },
  ]
}
