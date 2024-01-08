import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { demoStore, SETTLE_MS } from './store'
import { DEMO_CUSTOMER_ID } from './fixtures'
import { onAction, type ActionEvent } from '@/lib/events'

describe('demo store', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    sessionStorage.clear()
    demoStore.reset()
  })
  afterEach(() => vi.useRealTimers())

  it('seeds a persona with wallet, account and history', () => {
    const customer = demoStore.getCustomer(DEMO_CUSTOMER_ID)
    expect(customer.verificationStatus).toBe('approved')
    expect(demoStore.listWallets(DEMO_CUSTOMER_ID)[0].balances?.length).toBeGreaterThan(0)
    expect(demoStore.listAccounts(DEMO_CUSTOMER_ID)[0].iban).toBeTruthy()
    expect(demoStore.listTransfers(DEMO_CUSTOMER_ID).length).toBeGreaterThanOrEqual(10)
  })

  it('seeds multiple personas and switches the active customer', () => {
    const ids = demoStore.listCustomers().map(c => c.id)
    expect(ids).toContain(DEMO_CUSTOMER_ID)
    expect(ids).toContain('demo-customer-biz')
    expect(ids.length).toBeGreaterThanOrEqual(3)

    expect(demoStore.getActiveCustomerId()).toBe(DEMO_CUSTOMER_ID) // default
    demoStore.setActiveCustomer('demo-customer-biz')
    expect(demoStore.getActiveCustomerId()).toBe('demo-customer-biz')
    expect(demoStore.getCustomer('demo-customer-biz').type).toBe('business')

    demoStore.setActiveCustomer('not-a-real-id') // unknown → falls back to default
    expect(demoStore.getActiveCustomerId()).toBe(DEMO_CUSTOMER_ID)
  })

  it('payout deducts balance, starts pending, auto-completes and emits', () => {
    const wallet = demoStore.listWallets(DEMO_CUSTOMER_ID)[0]
    const before = Number(wallet.balances!.find(b => b.currency === 'EUR')!.amount)
    const events: ActionEvent[] = []
    const off = onAction(e => events.push(e))

    const t = demoStore.createPayout({ fromWalletId: wallet.id, amount: 100, currency: 'EUR', toId: 'acct_x', toCurrency: 'EUR' })
    expect(t.state).toBe('pending')
    const after = Number(demoStore.listWallets(DEMO_CUSTOMER_ID)[0].balances!.find(b => b.currency === 'EUR')!.amount)
    expect(after).toBeCloseTo(before - 100)

    vi.advanceTimersByTime(SETTLE_MS + 10)
    expect(demoStore.getTransfer(t.id).state).toBe('completed')
    expect(events.some(e => e.type === 'transfer.updated')).toBe(true)
    off()
  })

  it('rejects insufficient funds', () => {
    const wallet = demoStore.listWallets(DEMO_CUSTOMER_ID)[0]
    expect(() =>
      demoStore.createPayout({ fromWalletId: wallet.id, amount: 9_999_999, currency: 'EUR', toId: 'acct_x', toCurrency: 'EUR' })
    ).toThrow(/insufficient/i)
  })

  it('topup credits balance immediately and settles later', () => {
    const wallet = demoStore.listWallets(DEMO_CUSTOMER_ID)[0]
    const before = Number(wallet.balances!.find(b => b.currency === 'EUR')!.amount)
    demoStore.topup({ walletId: wallet.id, amount: 500, currency: 'EUR' })
    const after = Number(demoStore.listWallets(DEMO_CUSTOMER_ID)[0].balances!.find(b => b.currency === 'EUR')!.amount)
    expect(after).toBeCloseTo(before + 500)
  })

  it('onboarding lifecycle: new customer starts pending, KYC approves after delay', () => {
    const c = demoStore.createCustomer({ firstName: 'Ada', lastName: 'L', email: 'ada@x.io' })
    expect(c.verificationStatus).toBe('pending')
    demoStore.initiateKyc(c.id)
    vi.advanceTimersByTime(5000)
    expect(demoStore.getCustomer(c.id).verificationStatus).toBe('approved')
  })

  it('reset restores the seed persona', () => {
    demoStore.createCustomer({ firstName: 'Ada', lastName: 'L', email: 'ada@x.io' })
    demoStore.reset()
    expect(demoStore.getCustomer(DEMO_CUSTOMER_ID).personal?.firstName).toBe('Alex')
  })
})
