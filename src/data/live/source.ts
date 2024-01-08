import { client } from './client'
import type {
  Account, CreateAccountInput, CreateCustomerInput, CreateRecipientAccountInput,
  CreateRecipientInput, Customer, DataSource, KycSession, PayoutInput,
  PayoutQuoteInput, Quote, Recipient, RecipientAccount, Transfer, TopupInput, Wallet,
} from '../types'

function compact(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== '')
  )
}

// INTEGRATION SURFACE — do not change paths or payload shapes when tailoring.
export const liveSource: DataSource = {
  getCustomer: (id): Promise<Customer> =>
    client.get(`/v1/customers/${id}`).then(r => r.data),

  createCustomer: (input: CreateCustomerInput): Promise<Customer> =>
    client.post('/v2/customers', {
      type: 'individual',
      personal: compact({ firstName: input.firstName, lastName: input.lastName, email: input.email, birthDate: input.birthDate, phone: input.phone }),
    }).then(r => r.data),

  initiateKyc: (customerId): Promise<KycSession> =>
    client.post(`/v1/customers/${customerId}/kyc`, { level: 'simplified' }).then(r => r.data),

  listWallets: (customerId): Promise<Wallet[]> =>
    client.get(`/v1/customers/${customerId}/wallets`).then(r => r.data?.wallets ?? []),

  getWallet: (customerId, walletId): Promise<Wallet> =>
    client.get(`/v1/customers/${customerId}/wallets/${walletId}`).then(r => r.data),

  createWallet: (customerId, chain = 'polygon'): Promise<Wallet> =>
    client.post(`/v1/customers/${customerId}/wallets`, { chain }).then(r => r.data),

  listAccounts: (customerId): Promise<Account[]> =>
    client.get(`/v1/customers/${customerId}/accounts`).then(r => r.data?.accounts ?? []),

  createAccount: (customerId, input: CreateAccountInput): Promise<Account> =>
    client.post(`/v1/customers/${customerId}/accounts`, compact({
      type: input.type ?? 'sepa', country: input.country, currency: input.currency,
      targetWallet: input.targetWallet, label: input.label,
    })).then(r => r.data),

  listRecipients: (customerId): Promise<Recipient[]> =>
    client.get(`/v1/customers/${customerId}/recipients`).then(r => r.data?.recipients ?? []),

  createRecipient: (customerId, input: CreateRecipientInput): Promise<Recipient> =>
    client.post(`/v1/customers/${customerId}/recipients`, compact({ type: input.type ?? 'individual', ...input })).then(r => r.data),

  listRecipientAccounts: (customerId, recipientId): Promise<RecipientAccount[]> =>
    client.get(`/v1/customers/${customerId}/recipients/${recipientId}/accounts`).then(r => r.data?.accounts ?? []),

  createRecipientAccount: (customerId, recipientId, input: CreateRecipientAccountInput): Promise<RecipientAccount> =>
    client.post(`/v1/customers/${customerId}/recipients/${recipientId}/accounts`, { rail: input.rail ?? 'sepa', details: input.details }).then(r => r.data),

  listTransfers: (customerId): Promise<Transfer[]> =>
    client.get('/v1/transfers', { params: { customerId } }).then(r => (Array.isArray(r.data) ? r.data : r.data?.transfers ?? [])),

  getTransfer: (id): Promise<Transfer> =>
    client.get(`/v1/transfers/${id}`).then(r => r.data),

  createPayoutQuote: (input: PayoutQuoteInput): Promise<Quote> =>
    client.post('/v1/payout/quote', {
      from: { id: input.fromWalletId, amount: input.amount, currency: input.currency ?? 'USDC' },
      to: { id: input.toAccountId, currency: input.toCurrency },
    }).then(r => r.data),

  createPayout: (input: PayoutInput): Promise<Transfer> =>
    client.post('/v1/payout', {
      from: { id: input.fromWalletId, amount: input.amount, currency: input.currency ?? 'USDC' },
      to: { id: input.toId, currency: input.toCurrency },
    }).then(r => r.data),

  topup: (input: TopupInput): Promise<Transfer> =>
    client.post('/v1/sandbox/topup', {
      wallet: input.walletId, amount: String(input.amount ?? 1000), currency: input.currency ?? 'USDC',
    }).then(r => r.data),
}
