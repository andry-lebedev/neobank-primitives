import type { Account, Customer, Recipient, RecipientAccount, Transfer, Wallet } from '../types'
import { alexHistoryTransfers } from './alexHistoryTransfers'
import { alexRecentTransfers } from './alexRecentTransfers'
import { northwindTransfers } from './northwindTransfers'

export const DEMO_CUSTOMER_ID = 'demo-customer'
export const DEMO_WALLET_ID = 'demo-wallet'
export const DEMO_ACCOUNT_ID = 'demo-account'

// One self-contained customer the UI can act as. The demo seeds several so a
// prospect can "log in" as different profiles (funded, brand-new, business)
// without any backend.
export interface Persona {
  customer: Customer
  wallet: Wallet
  accounts: Account[]
  recipients: Recipient[]
  recipientAccounts: Record<string, RecipientAccount[]>
  transfers: Transfer[]
}

export interface DemoState {
  personas: Record<string, Persona>
}

// Funded, fully verified individual with history — the default persona.
function alex(): Persona {
  return {
    customer: {
      id: DEMO_CUSTOMER_ID,
      type: 'individual',
      verificationStatus: 'approved',
      personal: { firstName: 'Alex', lastName: 'Rivera', email: 'alex@example.com' },
    },
    wallet: {
      id: DEMO_WALLET_ID,
      custody: { type: 'custodial', custodianName: 'Swipelux Sandbox' },
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
    transfers: [...alexRecentTransfers(), ...alexHistoryTransfers()],
  }
}

// Brand-new individual: KYC pending, wallet provisioned but empty, no activity.
// Shows the pre-verification / empty state.
function jordan(): Persona {
  return {
    customer: {
      id: 'demo-customer-new',
      type: 'individual',
      verificationStatus: 'pending',
      personal: { firstName: 'Jordan', lastName: 'Blake', email: 'jordan@example.com' },
    },
    wallet: { id: 'demo-wallet-new', address: '0x4De2A1bC3f90E7d5128cE4b0a17F9d836Be1cA42', chain: 'polygon', balances: [], custody: { type: 'custodial', custodianName: 'Swipelux Sandbox' } },
    accounts: [],
    recipients: [],
    recipientAccounts: {},
    transfers: [],
  }
}

// Business customer: verified, EUR + USDC funded, supplier payouts in history.
function northwind(): Persona {
  return {
    customer: {
      id: 'demo-customer-biz',
      type: 'business',
      verificationStatus: 'approved',
      personal: { firstName: 'Northwind', lastName: 'Ltd', email: 'ops@northwind.example' },
    },
    wallet: {
      id: 'demo-wallet-biz',
      custody: { type: 'custodial', custodianName: 'Swipelux Sandbox' },
      address: '0x9Ab12Cd34Ef56789012345678901234567890aB',
      chain: 'polygon',
      balances: [
        { amount: '48250.00', currency: 'EUR' },
        { amount: '12000.00', currency: 'USDC' },
      ],
    },
    accounts: [
      {
        id: 'demo-account-biz',
        source: 'virtual',
        type: 'sepa',
        currency: 'EUR',
        country: 'IE',
        label: 'Operating account',
        targetWallet: 'demo-wallet-biz',
        iban: 'IE64 AIBK 9311 5277 0042 12',
        bic: 'AIBKIE2D',
        bankName: 'Swipelux Partner Bank',
        accountHolderName: 'Northwind Ltd',
        paymentReference: 'SWPLX-NW42K',
      },
    ],
    recipients: [
      { id: 'rcp_nw1', type: 'business', companyName: 'Baltic Freight OÜ', email: 'ap@balticfreight.example' },
    ],
    recipientAccounts: {
      rcp_nw1: [
        { id: 'rcpacct_nw1', rail: 'sepa', currency: 'EUR', iban: 'EE38 2200 2210 2014 5685', details: { iban: 'EE38 2200 2210 2014 5685', accountHolderName: 'Baltic Freight OÜ', country: 'EE', currency: 'EUR' } },
      ],
    },
    transfers: northwindTransfers(),
  }
}

export function seedState(): DemoState {
  return {
    personas: {
      [DEMO_CUSTOMER_ID]: alex(),
      'demo-customer-new': jordan(),
      'demo-customer-biz': northwind(),
    },
  }
}
