import axios from 'axios'
import { client } from './client'
import type {
  Account, CreateAccountInput, CreateCustomerInput, CreateRecipientAccountInput,
  CreateRecipientInput, Customer, DataSource, KycSession, PayoutInput,
  PayoutQuoteInput, Quote, Recipient, RecipientAccount, Transfer, TopupInput,
  VerificationStatus, Wallet,
} from '../types'

function compact(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== '')
  )
}

// The API returns customer fields flat; the app's domain Customer nests the
// person under `personal`. Individuals + list rows carry `type` and KYC `status`;
// business customers omit `type`, name the entity in `entityName`/`tradeName`,
// and report KYB under `verificationStatus`. Normalize both into one UI shape.
interface RawCustomer {
  id: string
  type?: 'individual' | 'business'
  firstName?: string
  lastName?: string
  legalName?: string | null
  entityName?: string | null
  tradeName?: string | null
  birthDate?: string
  email?: string
  phone?: string
  phoneNumber?: string
  status?: VerificationStatus
  verificationStatus?: VerificationStatus
  externalId?: string
}

function normalizeCustomer(raw: RawCustomer): Customer {
  const isBusiness = raw.type === 'business' || raw.entityName != null || raw.tradeName != null
  return {
    id: raw.id,
    type: isBusiness ? 'business' : (raw.type ?? 'individual'),
    verificationStatus: raw.verificationStatus ?? raw.status,
    personal: {
      // Business name: entity/trade (detail endpoint) or legalName (list rows); fall back to contact.
      firstName: isBusiness ? (raw.entityName ?? raw.tradeName ?? raw.legalName ?? raw.firstName) : raw.firstName,
      lastName: isBusiness ? undefined : raw.lastName,
      birthDate: raw.birthDate,
      email: raw.email,
      phone: raw.phone ?? raw.phoneNumber,
    },
    externalId: raw.externalId,
  }
}

// GET /v1/customers/{id} 400s for business customers, pointing at the business
// route ("Use GET /v1/customers/business/..."). Detect that to retry there.
function isBusinessRedirect(err: unknown): boolean {
  if (!axios.isAxiosError(err)) return false
  const message = (err.response?.data as { message?: string } | undefined)?.message ?? ''
  return /business customer/i.test(message)
}

const LIVE_SANDBOX_TOPUP_CURRENCY = 'USDC'

// INTEGRATION SURFACE — do not change paths or payload shapes when tailoring.
export const liveSource: DataSource = {
  listCustomers: (): Promise<Customer[]> =>
    client.get('/v1/customers', { params: { limit: 50 } })
      .then(r => ((r.data?.customers ?? []) as RawCustomer[]).map(normalizeCustomer)),

  getCustomer: (id): Promise<Customer> =>
    client.get(`/v1/customers/${id}`)
      .then(r => normalizeCustomer(r.data))
      .catch(err => {
        if (isBusinessRedirect(err)) {
          return client.get(`/v1/customers/business/${id}`).then(r => normalizeCustomer(r.data))
        }
        throw err
      }),

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
      wallet: input.walletId, amount: String(input.amount ?? 1000), currency: LIVE_SANDBOX_TOPUP_CURRENCY,
    }).then(r => r.data),
}
