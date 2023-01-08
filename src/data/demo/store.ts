import { emitAction } from '@/lib/events'
import { brand } from '@/brand.config'
import { seedState, DEMO_CUSTOMER_ID, type DemoState, type Persona } from './fixtures'
import type {
  Account, CreateAccountInput, CreateCustomerInput, CreateRecipientAccountInput,
  CreateRecipientInput, Customer, KycSession, PayoutInput, PayoutQuoteInput,
  Quote, Recipient, RecipientAccount, Transfer, TopupInput, Wallet,
} from '../types'

const STORAGE_KEY = 'swipelux_demo_state'
// Which seeded persona the demo is "logged in" as. Separate from the live
// customer id (swipelux_customer_id) so switching modes never crosses wires.
const ACTIVE_KEY = 'swipelux_demo_customer'
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
  const parsed = raw ? (JSON.parse(raw) as Partial<DemoState>) : null
  state = parsed && parsed.personas ? (parsed as DemoState) : seedState()
  // Catch-up: settle anything that aged past SETTLE_MS while the tab was away.
  for (const p of Object.values(state.personas)) {
    for (const t of p.transfers) {
      if ((t.state === 'pending' || t.state === 'in_progress') && Date.now() - Date.parse(t.createdAt) >= SETTLE_MS) {
        t.state = 'completed'
      }
    }
  }
  save()
  return state
}

function save(): void {
  if (state) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

// Resolve a persona by customer id; unknown ids fall back to the default
// persona so a stale selection (e.g. a live customer id) never throws in demo.
function persona(id: string): Persona {
  const s = load()
  return s.personas[id] ?? s.personas[DEMO_CUSTOMER_ID]
}

function personaByWallet(walletId: string): Persona {
  const s = load()
  return Object.values(s.personas).find(p => p.wallet.id === walletId) ?? s.personas[DEMO_CUSTOMER_ID]
}

function findTransfer(id: string): { persona: Persona; transfer: Transfer } | null {
  const s = load()
  for (const p of Object.values(s.personas)) {
    const transfer = p.transfers.find(t => t.id === id)
    if (transfer) return { persona: p, transfer }
  }
  return null
}

function settleLater(id: string): void {
  setTimeout(() => {
    const found = findTransfer(id)
    if (!found || found.transfer.state === 'completed' || found.transfer.state === 'failed') return
    found.transfer.state = 'in_progress'
    save()
    emitAction({ type: 'transfer.updated', transfer: { ...found.transfer } })
    setTimeout(() => {
      const f2 = findTransfer(id)
      if (!f2 || f2.transfer.state === 'completed' || f2.transfer.state === 'failed') return
      f2.transfer.state = 'completed'
      save()
      emitAction({ type: 'transfer.updated', transfer: { ...f2.transfer } })
    }, SETTLE_MS / 2)
  }, SETTLE_MS / 2)
}

function adjustBalance(p: Persona, currency: string, delta: number): void {
  const balances = (p.wallet.balances ??= [])
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
    localStorage.removeItem(ACTIVE_KEY)
  },

  // The persona the demo currently acts as. Falls back to the default if the
  // stored id isn't a known persona (e.g. after a reset).
  getActiveCustomerId(): string {
    const id = localStorage.getItem(ACTIVE_KEY)
    return id && load().personas[id] ? id : DEMO_CUSTOMER_ID
  },

  setActiveCustomer(id: string): void {
    localStorage.setItem(ACTIVE_KEY, id)
  },

  // Every seeded customer, for the "log in as" picker.
  listCustomers(): Customer[] {
    return Object.values(load().personas).map(p => ({ ...p.customer }))
  },

  getCustomer(id: string): Customer {
    return { ...persona(id).customer }
  },

  // Onboarding adds a new persona (pending KYC, empty wallet). The caller then
  // selects it via setCustomerId, so the app loads as the new customer.
  createCustomer(input: CreateCustomerInput): Customer {
    const s = load()
    const customer: Customer = {
      id: nextId('cust'),
      type: 'individual',
      verificationStatus: 'pending',
      personal: { firstName: input.firstName, lastName: input.lastName, email: input.email, birthDate: input.birthDate, phone: input.phone },
    }
    s.personas[customer.id] = {
      customer,
      wallet: { id: '', balances: [] },
      accounts: [],
      recipients: [],
      recipientAccounts: {},
      transfers: [],
    }
    save()
    this.setActiveCustomer(customer.id) // onboarding logs in as the new customer
    return { ...customer }
  },

  initiateKyc(customerId: string): KycSession {
    setTimeout(() => {
      const p = persona(customerId)
      if (p.customer.id === customerId && p.customer.verificationStatus === 'pending') {
        p.customer.verificationStatus = 'approved'
        save()
        emitAction({ type: 'kyc.approved' })
      }
    }, KYC_MS)
    return {}
  },

  listWallets(customerId: string): Wallet[] {
    const w = persona(customerId).wallet
    return w.id ? [{ ...w, balances: w.balances?.map(b => ({ ...b })) }] : []
  },

  getWallet(customerId: string, _walletId: string): Wallet {
    const w = persona(customerId).wallet
    return { ...w, balances: w.balances?.map(b => ({ ...b })) }
  },

  createWallet(customerId: string, chain = 'polygon'): Wallet {
    const p = persona(customerId)
    p.wallet = {
      id: nextId('wal'),
      chain,
      address: `0x${Math.random().toString(16).slice(2).padEnd(40, '0').slice(0, 40)}`,
      balances: [],
    }
    save()
    return { ...p.wallet }
  },

  listAccounts(customerId: string): Account[] {
    return persona(customerId).accounts.map(a => ({ ...a }))
  },

  createAccount(customerId: string, input: CreateAccountInput): Account {
    const p = persona(customerId)
    const holder = [p.customer.personal?.firstName, p.customer.personal?.lastName].filter(Boolean).join(' ')
    const account: Account = {
      id: nextId('acct'),
      source: 'virtual',
      type: input.type ?? 'sepa',
      currency: input.currency ?? 'EUR',
      country: input.country ?? 'IE',
      label: input.label ?? 'Main account',
      targetWallet: input.targetWallet ?? p.wallet.id,
      iban: `IE29 AIBK 9311 5212 ${String(1000 + p.accounts.length).padStart(4, '0')} 99`,
      bic: 'AIBKIE2D',
      bankName: 'Swipelux Partner Bank',
      accountHolderName: holder || 'Demo Customer',
      paymentReference: `SWPLX-${nextId('').slice(-5).toUpperCase()}`,
    }
    p.accounts.push(account)
    save()
    return { ...account }
  },

  listRecipients(customerId: string): Recipient[] {
    return persona(customerId).recipients.map(r => ({ ...r }))
  },

  createRecipient(customerId: string, input: CreateRecipientInput): Recipient {
    const p = persona(customerId)
    const r: Recipient = { id: nextId('rcp'), type: input.type ?? 'individual', ...input }
    p.recipients.push(r)
    p.recipientAccounts[r.id] = []
    save()
    return { ...r }
  },

  listRecipientAccounts(customerId: string, recipientId: string): RecipientAccount[] {
    return (persona(customerId).recipientAccounts[recipientId] ?? []).map(a => ({ ...a }))
  },

  createRecipientAccount(customerId: string, recipientId: string, input: CreateRecipientAccountInput): RecipientAccount {
    const p = persona(customerId)
    const acct: RecipientAccount = {
      id: nextId('rcpacct'),
      rail: input.rail ?? 'sepa',
      currency: input.details?.currency ?? 'EUR',
      iban: input.details?.iban,
      details: input.details,
    }
    ;(p.recipientAccounts[recipientId] ??= []).push(acct)
    save()
    return { ...acct }
  },

  listTransfers(customerId: string): Transfer[] {
    return persona(customerId).transfers.map(t => ({ ...t }))
  },

  getTransfer(id: string): Transfer {
    const found = findTransfer(id)
    if (!found) throw new Error('Transfer not found')
    return { ...found.transfer }
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
    const p = personaByWallet(input.fromWalletId)
    const currency = input.currency ?? 'USDC'
    adjustBalance(p, currency, -input.amount) // throws on insufficient funds
    const kind = input.kind ?? (input.toId.startsWith('0x') ? 'wallet' : 'bank')
    const isP2p = kind === 'wallet'
    const quote = isP2p ? null : this.createPayoutQuote({ fromWalletId: input.fromWalletId, amount: input.amount, currency, toAccountId: input.toId, toCurrency: input.toCurrency })
    const recipient = p.recipients.find(r => (p.recipientAccounts[r.id] ?? []).some(a => a.id === input.toId))
    const recipientName = recipient ? [recipient.firstName, recipient.lastName].filter(Boolean).join(' ') || recipient.companyName || 'Recipient' : 'Recipient'
    const t: Transfer = {
      id: nextId('tx'),
      type: isP2p ? 'wallet_to_wallet' : 'offramp',
      state: 'pending',
      createdAt: new Date().toISOString(),
      from: { amount: input.amount.toFixed(2), currency },
      to: isP2p
        ? { identifier: `${input.toId.slice(0, 6)}…${input.toId.slice(-4)}`, amount: input.amount.toFixed(2), currency }
        : { rail: 'sepa', identifier: recipientName, amount: String(quote?.destination_amount ?? input.amount), currency: input.toCurrency },
    }
    p.transfers.unshift(t)
    save()
    settleLater(t.id)
    return { ...t }
  },

  topup(input: TopupInput): Transfer {
    const p = personaByWallet(input.walletId)
    const amount = input.amount ?? 1000
    const currency = input.currency ?? p.wallet.balances?.find(b => b.currency === brand.currency)?.currency ?? p.wallet.balances?.[0]?.currency ?? brand.currency
    adjustBalance(p, currency, amount)
    const t: Transfer = {
      id: nextId('tx'),
      type: 'onramp',
      state: 'pending',
      createdAt: new Date().toISOString(),
      from: { rail: 'sandbox', identifier: 'Simulated deposit' },
      to: { amount: amount.toFixed(2), currency },
    }
    p.transfers.unshift(t)
    save()
    settleLater(t.id)
    return { ...t }
  },
}

export { DEMO_CUSTOMER_ID }
