// Domain model + the DataSource interface. Shapes ported from the v1 Swipelux
// API layer — they describe what the UI reads, not the full API surface.

export type VerificationStatus = 'not_started' | 'pending' | 'approved' | 'rejected'

export interface CustomerPersonal {
  firstName?: string
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
  firstName?: string
  lastName?: string
  companyName?: string
  email?: string
}

export interface RecipientAccountDetails {
  iban?: string
  accountHolderName?: string
  country?: string
  currency?: string
}

export type TransferRail = 'sepa' | 'swift' | 'sandbox'

export interface RecipientAccount {
  id: string
  rail?: TransferRail
  currency?: string
  iban?: string
  details?: RecipientAccountDetails
}

export type TransferType = 'onramp' | 'offramp' | 'wallet_to_wallet'
export type TransferState = 'pending' | 'in_progress' | 'awaiting_funds' | 'completed' | 'failed'

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

export interface KycSession {
  verificationUrl?: string
}

export interface CreateCustomerInput {
  firstName: string
  lastName: string
  email: string
  birthDate?: string
  phone?: string
}

export interface CreateAccountInput {
  type?: 'sepa' | 'swift'
  country?: string
  currency?: string
  targetWallet?: string
  label?: string
}

export interface CreateRecipientInput {
  type?: 'individual' | 'business'
  firstName?: string
  lastName?: string
  companyName?: string
  email?: string
}

export interface CreateRecipientAccountInput {
  rail?: TransferRail
  details?: RecipientAccountDetails
}

export interface PayoutQuoteInput {
  fromWalletId: string
  amount: number
  currency?: string
  toAccountId: string
  toCurrency: string
}

export interface PayoutInput {
  fromWalletId: string
  amount: number
  currency?: string
  toId: string
  toCurrency: string
  kind?: 'bank' | 'wallet'
}

export interface TopupInput {
  walletId: string
  amount?: number
  currency?: string
}

export type AppMode = 'demo' | 'live'

// The single contract every screen talks to. Implemented by src/data/demo and
// src/data/live; wrapped by src/data/tracked.ts which emits action events.
export interface DataSource {
  getCustomer(id: string): Promise<Customer>
  createCustomer(input: CreateCustomerInput): Promise<Customer>
  initiateKyc(customerId: string): Promise<KycSession>
  listWallets(customerId: string): Promise<Wallet[]>
  getWallet(customerId: string, walletId: string): Promise<Wallet>
  createWallet(customerId: string, chain?: string): Promise<Wallet>
  listAccounts(customerId: string): Promise<Account[]>
  createAccount(customerId: string, input: CreateAccountInput): Promise<Account>
  listRecipients(customerId: string): Promise<Recipient[]>
  createRecipient(customerId: string, input: CreateRecipientInput): Promise<Recipient>
  listRecipientAccounts(customerId: string, recipientId: string): Promise<RecipientAccount[]>
  createRecipientAccount(customerId: string, recipientId: string, input: CreateRecipientAccountInput): Promise<RecipientAccount>
  listTransfers(customerId: string): Promise<Transfer[]>
  getTransfer(id: string): Promise<Transfer>
  createPayoutQuote(input: PayoutQuoteInput): Promise<Quote>
  createPayout(input: PayoutInput): Promise<Transfer>
  topup(input: TopupInput): Promise<Transfer>
}
