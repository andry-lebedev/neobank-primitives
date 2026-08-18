import type { Transfer } from '../types'
import { daysAgo } from './fixtureTransferTime'

export function alexHistoryTransfers(): Transfer[] {
  return [
    { id: 'tx_07', type: 'offramp', state: 'completed', createdAt: daysAgo(9), from: { amount: '230.00', currency: 'EUR' }, to: { rail: 'sepa', identifier: 'Utilities GmbH', amount: '230.00', currency: 'EUR' } },
    { id: 'tx_08', type: 'wallet_to_wallet', state: 'completed', createdAt: daysAgo(11), from: { amount: '75.50', currency: 'USDC' }, to: { identifier: '0x2bA4…77f0', amount: '75.50', currency: 'USDC' } },
    { id: 'tx_09', type: 'onramp', state: 'completed', createdAt: daysAgo(13), from: { rail: 'sepa', identifier: 'Acme Payroll' }, to: { amount: '1200.00', currency: 'EUR' } },
    { id: 'tx_10', type: 'offramp', state: 'completed', createdAt: daysAgo(15), from: { amount: '320.00', currency: 'EUR' }, to: { rail: 'swift', identifier: 'J. Tanaka', amount: '51400', currency: 'JPY' } },
    { id: 'tx_11', type: 'onramp', state: 'completed', createdAt: daysAgo(18), from: { rail: 'sepa', identifier: 'Refund — AirEU' }, to: { amount: '89.99', currency: 'EUR' } },
    { id: 'tx_12', type: 'offramp', state: 'failed', createdAt: daysAgo(20), from: { amount: '60.00', currency: 'EUR' }, to: { rail: 'sepa', identifier: 'Unknown IBAN', amount: '60.00', currency: 'EUR' }, failureReason: 'Recipient bank rejected the transfer' },
  ]
}
