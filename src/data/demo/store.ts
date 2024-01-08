import { emitAction } from '@/lib/events'
import { brand } from '@/brand.config'
import { seedState, DEMO_CUSTOMER_ID, type DemoState } from './fixtures'
import type {
  Account, CreateAccountInput, CreateCustomerInput, CreateRecipientAccountInput,
  CreateRecipientInput, Customer, KycSession, PayoutInput, PayoutQuoteInput,
  Quote, Recipient, RecipientAccount, Transfer, TopupInput, Wallet,
} from '../types'

const STORAGE_KEY = 'swipelux_demo_state'
export const SETTLE_MS = 8_000
export const KYC_MS = 4_000
const FX_RATE_USDC_EUR = 0.91
const FEE_PCT = 0.009

let state: DemoState | null = null
let counter = 0

const nextId = (prefix: string) => `${prefix}_demo_${++counter}_${Date.now().toString(36)}`

function load(): DemoState {
  if (state) return state
  const raw = sessionStorage.getItem(STORAGE_KEY)
  state = raw ? (JSON.parse(raw) as DemoState) : seedState()
  // Catch-up: settle anything that aged past SETTLE_MS while the tab was away.
  for (const t of state.transfers) {
    if ((t.state === 'pending' || t.state === 'in_progress') && Date.now() - Date.parse(t.createdAt) >= SETTLE_MS) {
      t.state = 'completed'
    }
  }
  save()
  return state
}

function save(): void {
  if (state) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function settleLater(id: string): void {
  setTimeout(() => {
    const s = load()
    const t = s.transfers.find(x => x.id === id)
    if (!t || t.state === 'completed' || t.state === 'failed') return
    t.state = 'in_progress'
    save()
    emitAction({ type: 'transfer.updated', transfer: { ...t } })
    setTimeout(() => {
      const t2 = load().transfers.find(x => x.id === id)
      if (!t2 || t2.state === 'completed' || t2.state === 'failed') return
      t2.state = 'completed'
      save()
      emitAction({ type: 'transfer.updated', transfer: { ...t2 } })
    }, SETTLE_MS / 2)
  }, SETTLE_MS / 2)
}

function adjustBalance(currency: string, delta: number): void {
  const s = load()
  const balances = (s.wallet.balances ??= [])
  let b = balances.find(x => x.currency === currency)
  if (!b) {
    b = { amount: '0', currency }
    balances.push(b)
  }
  const next = Number(b.amount) + delta
  if (next < 0) throw new Error(`Insufficient funds: ${currency} balance is ${b.amount}`)
  b.amount = next.toFixed(2)
}

export const demoStore = {
  reset(): void {
    state = seedState()
    save()
  },

  getCustomer(id: string): Customer {
    const s = load()
    if (s.customer.id !== id) throw new Error('Customer not found')
    return { ...s.customer }
  },

  // Demo onboarding restarts the persona: fresh customer, empty wallet/account/history.
  createCustomer(input: CreateCustomerInput): Customer {
    const s = load()
    s.customer = {
      id: nextId('cust'),
      type: 'individual',
      verificationStatus: 'pending',
      personal: { firstName: input.firstName, lastName: input.lastName, email: input.email, birthDate: input.birthDate, phone: input.phone },
    }
    s.wallet = { id: '', balances: [] }
    s.accounts = []
    s.transfers = []
    save()
    return { ...s.customer }
  },

  initiateKyc(customerId: string): KycSession {
    setTimeout(() => {
      const s = load()
      if (s.customer.id === customerId && s.customer.verificationStatus === 'pending') {
        s.customer.verificationStatus = 'approved'
        save()
        emitAction({ type: 'kyc.approved' })
      }
    }, KYC_MS)
    return {}
  },

  listWallets(_customerId: string): Wallet[] {
    const s = load()
    return s.wallet.id ? [{ ...s.wallet, balances: s.wallet.balances?.map(b => ({ ...b })) }] : []
  },

  getWallet(_customerId: string, _walletId: string): Wallet {
    const s = load()
    return { ...s.wallet, balances: s.wallet.balances?.map(b => ({ ...b })) }
  },

  createWallet(_customerId: string, chain = 'polygon'): Wallet {
    const s = load()
    s.wallet = {
      id: nextId('wal'),
      chain,
      address: `0x${Math.random().toString(16).slice(2).padEnd(40, '0').slice(0, 40)}`,
      balances: [],
    }
    save()
    return { ...s.wallet }
  },

  listAccounts(_customerId: string): Account[] {
    return load().accounts.map(a => ({ ...a }))
  },

  createAccount(_customerId: string, input: CreateAccountInput): Account {
    const s = load()
    const holder = [s.customer.personal?.firstName, s.customer.personal?.lastName].filter(Boolean).join(' ')
    const account: Account = {
      id: nextId('acct'),
      source: 'virtual',
      type: input.type ?? 'sepa',
      currency: input.currency ?? 'EUR',
      country: input.country ?? 'IE',
      label: input.label ?? 'Main account',
      targetWallet: input.targetWallet ?? s.wallet.id,
      iban: `IE29 AIBK 9311 5212 ${String(1000 + s.accounts.length).padStart(4, '0')} 99`,
      bic: 'AIBKIE2D',
      bankName: 'Swipelux Partner Bank',
      accountHolderName: holder || 'Demo Customer',
      paymentReference: `SWPLX-${nextId('').slice(-5).toUpperCase()}`,
    }
    s.accounts.push(account)
    save()
    return { ...account }
  },

  listRecipients(_customerId: string): Recipient[] {
    return load().recipients.map(r => ({ ...r }))
  },

  createRecipient(_customerId: string, input: CreateRecipientInput): Recipient {
    const s = load()
    const r: Recipient = { id: nextId('rcp'), type: input.type ?? 'individual', ...input }
    s.recipients.push(r)
    s.recipientAccounts[r.id] = []
    save()
    return { ...r }
  },

  listRecipientAccounts(_customerId: string, recipientId: string): RecipientAccount[] {
    return (load().recipientAccounts[recipientId] ?? []).map(a => ({ ...a }))
  },

  createRecipientAccount(_customerId: string, recipientId: string, input: CreateRecipientAccountInput): RecipientAccount {
    const s = load()
    const acct: RecipientAccount = {
      id: nextId('rcpacct'),
      rail: input.rail ?? 'sepa',
      currency: input.details?.currency ?? 'EUR',
      iban: input.details?.iban,
      details: input.details,
    }
    ;(s.recipientAccounts[recipientId] ??= []).push(acct)
    save()
    return { ...acct }
  },

  listTransfers(_customerId: string): Transfer[] {
    return load().transfers.map(t => ({ ...t }))
  },

  getTransfer(id: string): Transfer {
    const t = load().transfers.find(x => x.id === id)
    if (!t) throw new Error('Transfer not found')
    return { ...t }
  },

  createPayoutQuote(input: PayoutQuoteInput): Quote {
    const currency = input.currency ?? 'USDC'
    const rate = currency === 'USDC' && input.toCurrency === 'EUR' ? FX_RATE_USDC_EUR : 1
    const fee = input.amount * FEE_PCT
    return {
      id: nextId('quote'),
      rate,
      fee: { amount: fee.toFixed(2), currency },
      destination_amount: ((input.amount - fee) * rate).toFixed(2),
      from: { amount: input.amount, currency },
      to: { currency: input.toCurrency },
    }
  },

  createPayout(input: PayoutInput): Transfer {
    const s = load()
    const currency = input.currency ?? 'USDC'
    adjustBalance(currency, -input.amount) // throws on insufficient funds
    const kind = input.kind ?? (input.toId.startsWith('0x') ? 'wallet' : 'bank')
    const isP2p = kind === 'wallet'
    const quote = isP2p ? null : this.createPayoutQuote({ fromWalletId: input.fromWalletId, amount: input.amount, currency, toAccountId: input.toId, toCurrency: input.toCurrency })
    const recipient = s.recipients.find(r => (s.recipientAccounts[r.id] ?? []).some(a => a.id === input.toId))
    const t: Transfer = {
      id: nextId('tx'),
      type: isP2p ? 'wallet_to_wallet' : 'offramp',
      state: 'pending',
      createdAt: new Date().toISOString(),
      from: { amount: input.amount.toFixed(2), currency },
      to: isP2p
        ? { identifier: `${input.toId.slice(0, 6)}…${input.toId.slice(-4)}`, amount: input.amount.toFixed(2), currency }
        : { rail: 'sepa', identifier: recipient ? [recipient.firstName, recipient.lastName].filter(Boolean).join(' ') : 'Recipient', amount: String(quote?.destination_amount ?? input.amount), currency: input.toCurrency },
    }
    s.transfers.unshift(t)
    save()
    settleLater(t.id)
    return { ...t }
  },

  topup(input: TopupInput): Transfer {
    const s = load()
    const amount = input.amount ?? 1000
    const currency = input.currency ?? s.wallet.balances?.find(b => b.currency === brand.currency)?.currency ?? s.wallet.balances?.[0]?.currency ?? brand.currency
    adjustBalance(currency, amount)
    const t: Transfer = {
      id: nextId('tx'),
      type: 'onramp',
      state: 'pending',
      createdAt: new Date().toISOString(),
      from: { rail: 'sandbox', identifier: 'Simulated deposit' },
      to: { amount: amount.toFixed(2), currency },
    }
    s.transfers.unshift(t)
    save()
    settleLater(t.id)
    return { ...t }
  },
}

export { DEMO_CUSTOMER_ID }
