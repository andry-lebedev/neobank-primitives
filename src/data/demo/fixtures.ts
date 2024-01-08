import type { Account, Customer, Recipient, RecipientAccount, Transfer, Wallet } from '../types'

export const DEMO_CUSTOMER_ID = 'demo-customer'
export const DEMO_WALLET_ID = 'demo-wallet'
export const DEMO_ACCOUNT_ID = 'demo-account'

const DAY = 86_400_000
const iso = (msAgo: number) => new Date(Date.now() - msAgo).toISOString()

export interface DemoState {
  customer: Customer
  wallet: Wallet
  accounts: Account[]
  recipients: Recipient[]
  recipientAccounts: Record<string, RecipientAccount[]>
  transfers: Transfer[]
}

export function seedState(): DemoState {
  const transfers: Transfer[] = [
    { id: 'tx_01', type: 'onramp', state: 'completed', createdAt: iso(1 * DAY), from: { rail: 'sepa', identifier: 'Acme Payroll' }, to: { amount: '1200.00', currency: 'EUR' } },
    { id: 'tx_02', type: 'offramp', state: 'completed', createdAt: iso(2 * DAY), from: { amount: '480.00', currency: 'USDC' }, to: { rail: 'sepa', identifier: 'Maria K.', amount: '438.10', currency: 'EUR' } },
    { id: 'tx_03', type: 'wallet_to_wallet', state: 'completed', createdAt: iso(3 * DAY), from: { amount: '120.00', currency: 'USDC' }, to: { identifier: '0x8f3C…9aD1', amount: '120.00', currency: 'USDC' } },
    { id: 'tx_04', type: 'onramp', state: 'completed', createdAt: iso(4 * DAY), from: { rail: 'sepa', identifier: 'Stripe payout' }, to: { amount: '2450.00', currency: 'EUR' } },
    { id: 'tx_05', type: 'offramp', state: 'completed', createdAt: iso(6 * DAY), from: { amount: '900.00', currency: 'EUR' }, to: { rail: 'sepa', identifier: 'Rent — H. Schmidt', amount: '900.00', currency: 'EUR' } },
    { id: 'tx_06', type: 'onramp', state: 'completed', createdAt: iso(8 * DAY), from: { rail: 'sandbox', identifier: 'USDC deposit' }, to: { amount: '1000.00', currency: 'USDC' } },
    { id: 'tx_07', type: 'offramp', state: 'completed', createdAt: iso(9 * DAY), from: { amount: '230.00', currency: 'EUR' }, to: { rail: 'sepa', identifier: 'Utilities GmbH', amount: '230.00', currency: 'EUR' } },
    { id: 'tx_08', type: 'wallet_to_wallet', state: 'completed', createdAt: iso(11 * DAY), from: { amount: '75.50', currency: 'USDC' }, to: { identifier: '0x2bA4…77f0', amount: '75.50', currency: 'USDC' } },
    { id: 'tx_09', type: 'onramp', state: 'completed', createdAt: iso(13 * DAY), from: { rail: 'sepa', identifier: 'Acme Payroll' }, to: { amount: '1200.00', currency: 'EUR' } },
    { id: 'tx_10', type: 'offramp', state: 'completed', createdAt: iso(15 * DAY), from: { amount: '320.00', currency: 'EUR' }, to: { rail: 'swift', identifier: 'J. Tanaka', amount: '51400', currency: 'JPY' } },
    { id: 'tx_11', type: 'onramp', state: 'completed', createdAt: iso(18 * DAY), from: { rail: 'sepa', identifier: 'Refund — AirEU' }, to: { amount: '89.99', currency: 'EUR' } },
    { id: 'tx_12', type: 'offramp', state: 'failed', createdAt: iso(20 * DAY), from: { amount: '60.00', currency: 'EUR' }, to: { rail: 'sepa', identifier: 'Unknown IBAN', amount: '60.00', currency: 'EUR' }, failureReason: 'Recipient bank rejected the transfer' },
  ]

  return {
    customer: {
      id: DEMO_CUSTOMER_ID,
      type: 'individual',
      verificationStatus: 'approved',
      personal: { firstName: 'Alex', lastName: 'Rivera', email: 'alex@example.com' },
    },
    wallet: {
      id: DEMO_WALLET_ID,
      address: '0x71C9e2f4B8a35D6e10F2cE94b1a07d83AfE4cb21',
      chain: 'polygon',
      balances: [
        { amount: '21930.50', currency: 'EUR' },
        { amount: '2450.00', currency: 'USDC' },
      ],
    },
    accounts: [
      {
        id: DEMO_ACCOUNT_ID,
        source: 'virtual',
        type: 'sepa',
        currency: 'EUR',
        country: 'IE',
        label: 'Main EUR account',
        targetWallet: DEMO_WALLET_ID,
        iban: 'IE29 AIBK 9311 5212 3456 78',
        bic: 'AIBKIE2D',
        bankName: 'Swipelux Partner Bank',
        accountHolderName: 'Alex Rivera',
        paymentReference: 'SWPLX-7F2K9',
      },
    ],
    recipients: [
      { id: 'rcp_01', type: 'individual', firstName: 'Maria', lastName: 'K.', email: 'maria@example.com' },
    ],
    recipientAccounts: {
      rcp_01: [
        { id: 'rcpacct_01', rail: 'sepa', currency: 'EUR', iban: 'DE89 3704 0044 0532 0130 00', details: { iban: 'DE89 3704 0044 0532 0130 00', accountHolderName: 'Maria K.', country: 'DE', currency: 'EUR' } },
      ],
    },
    transfers,
  }
}
