import { describe, it, expect, beforeEach } from 'vitest'
import { withTracking } from './tracked'
import { createDemoSource } from './demo/source'
import { demoStore } from './demo/store'
import { DEMO_WALLET_ID } from './demo/fixtures'
import { onAction, type ActionEvent } from '@/lib/events'

describe('tracked source', () => {
  beforeEach(() => {
    sessionStorage.clear()
    demoStore.reset()
  })

  it('emits payout.quoted and payout.created around payout calls', async () => {
    const source = withTracking(createDemoSource({ latencyMs: 0 }))
    const events: ActionEvent[] = []
    const off = onAction(e => events.push(e))

    await source.createPayoutQuote({ fromWalletId: DEMO_WALLET_ID, amount: 50, currency: 'EUR', toAccountId: 'rcpacct_01', toCurrency: 'EUR' })
    await source.createPayout({ fromWalletId: DEMO_WALLET_ID, amount: 50, currency: 'EUR', toId: 'rcpacct_01', toCurrency: 'EUR' })

    const types = events.map(e => e.type)
    expect(types).toContain('payout.quoted')
    expect(types).toContain('payout.created')
    off()
  })

  it('emits p2p.created for wallet-to-wallet payouts', async () => {
    const source = withTracking(createDemoSource({ latencyMs: 0 }))
    const events: ActionEvent[] = []
    const off = onAction(e => events.push(e))
    await source.createPayout({ fromWalletId: DEMO_WALLET_ID, amount: 10, currency: 'USDC', toId: '0xAbCd000000000000000000000000000000000001', toCurrency: 'USDC' })
    expect(events.map(e => e.type)).toContain('p2p.created')
    off()
  })

  it('emits onboarding events', async () => {
    const source = withTracking(createDemoSource({ latencyMs: 0 }))
    const events: ActionEvent[] = []
    const off = onAction(e => events.push(e))
    const c = await source.createCustomer({ firstName: 'Ada', lastName: 'L', email: 'a@x.io' })
    await source.initiateKyc(c.id)
    await source.createWallet(c.id)
    await source.createAccount(c.id, { currency: 'EUR' })
    expect(events.map(e => e.type)).toEqual(
      expect.arrayContaining(['customer.created', 'kyc.started', 'wallet.provisioned', 'account.issued'])
    )
    off()
  })
})
