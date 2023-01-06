import type { Dispatch, SetStateAction } from 'react'

// Shared domain model for the neobank app. These shapes are derived from how the
// data flows through src/api, src/context and the pages — they describe the
// objects the UI actually reads, not the full API surface.

export type VerificationStatus = 'not_started' | 'pending' | 'approved' | 'rejected'

export interface CustomerPersonal {
  firstName?: string
  middleName?: string
  lastName?: string
  birthDate?: string
  email?: string
  phone?: string
}

export interface Customer {
  id: string
  type?: string
  verificationStatus?: VerificationStatus
  personal?: CustomerPersonal
  externalId?: string
  metadata?: Record<string, unknown>
}

export interface Balance {
  amount: string | number
  currency: string
}

export interface Wallet {
  id: string
  address?: string
  chain?: string
  balances?: Balance[]
}

// A virtual bank account (source === 'virtual') or an external one the customer
// added. SEPA accounts expose iban/bic, SWIFT accounts accountNumber/swiftCode.
export interface Account {
  id: string
  source?: 'virtual' | 'external'
  type?: 'sepa' | 'swift'
  currency?: string
  country?: string
  label?: string
  targetWallet?: string
  iban?: string
  bic?: string
  bankName?: string
  accountHolderName?: string
  paymentReference?: string
  accountNumber?: string
  swiftCode?: string
  routingNumber?: string
  bankAddress?: string
}

export interface Recipient {
  id: string
  type?: 'individual' | 'business'
  relationship?: string
  firstName?: string
  lastName?: string
  companyName?: string
  email?: string
  phone?: string
}

export interface RecipientAccountDetails {
  iban?: string
  accountHolderName?: string
  country?: string
  currency?: string
}

export interface RecipientAccount {
  id: string
  rail?: TransferRail
  currency?: string
  iban?: string
  details?: RecipientAccountDetails
}

export type TransferType = 'onramp' | 'offramp' | 'wallet_to_wallet'
export type TransferState = 'pending' | 'in_progress' | 'awaiting_funds' | 'completed' | 'failed'
export type TransferRail = 'sepa' | 'swift' | 'sandbox'

// One side (from/to) of a transfer. Different rails populate different fields.
export interface TransferLeg {
  identifier?: string
  amount?: string | number
  currency?: string
  rail?: TransferRail
}

export interface Transfer {
  id: string
  type: TransferType
  state: TransferState
  from?: TransferLeg
  to?: TransferLeg
  createdAt: string
  failureReason?: string
}

export interface QuoteFee {
  amount: string | number
  currency: string
}

export interface Quote {
  id?: string
  fee?: QuoteFee
  destination_amount?: string | number
  rate?: string | number
  from?: TransferLeg
  to?: TransferLeg
}

export interface AppContextValue {
  customer: Customer | null
  wallet: Wallet | null
  accounts: Account[]
  transferLog: Transfer[]
  addTransfer: (transfer: Transfer) => void
  refreshWallet: () => void
  refreshCustomer: () => void
  loading: boolean
  error: string | null
  loggedOut: boolean
  setLoggedOut: Dispatch<SetStateAction<boolean>>
}
