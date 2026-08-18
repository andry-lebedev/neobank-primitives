import { beforeEach, describe, expect, it } from 'vitest'
import { createDemoSource } from '@/data/demo/source'
import { DEMO_CUSTOMER_ID, demoStore } from '@/data/demo/store'
import { createDemoFinancialProvider } from './demoProvider'

describe('demo financial provider', () => {
  beforeEach(() => demoStore.reset())

  it('exposes eligible demo rails and turns a data-source quote into an expiring provider quote', async () => {
    const source = createDemoSource({ latencyMs: 0 })
    const provider = createDemoFinancialProvider(source, {
      now: () => new Date('2030-01-01T00:00:00Z'),
      createId: prefix => `${prefix}_1`,
    })

    await expect(provider.supportedCapabilities(DEMO_CUSTOMER_ID)).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({ method: 'sepa', directions: ['payin', 'payout'], eligibility: { eligible: true } }),
      expect.objectContaining({ method: 'stablecoin_transfers', directions: ['payout'], eligibility: { eligible: true } }),
    ]))
    await expect(provider.listAccounts(DEMO_CUSTOMER_ID)).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'demo-wallet', type: 'wallet', status: 'ready', currency: 'USDC' }),
      expect.objectContaining({ id: 'demo-account', type: 'bank', status: 'ready', method: 'sepa' }),
    ]))

    await expect(provider.createQuote({
      customerId: DEMO_CUSTOMER_ID,
      capabilityId: 'sepa_demo',
      in: { accountId: 'demo-wallet', amount: '100.00', currency: 'USDC' },
      destinationId: 'rcpacct_01',
      out: { currency: 'EUR' },
    })).resolves.toMatchObject({
      id: 'quote_1',
      status: 'active',
      rate: '0.91',
      in: { amount: '100.00', currency: 'USDC' },
      out: { amount: '90.18', currency: 'EUR' },
      fees: [{ amount: '0.90', currency: 'USDC' }],
      createdAt: '2030-01-01T00:00:00.000Z',
      expiresAt: '2030-01-01T00:05:00.000Z',
    })
  })

  it('executes only a quote it created and returns provider-shaped transfer evidence', async () => {
    const source = createDemoSource({ latencyMs: 0 })
    const provider = createDemoFinancialProvider(source, {
      now: () => new Date('2030-01-01T00:00:00Z'),
      createId: prefix => `${prefix}_1`,
    })
    await provider.createQuote({
      customerId: DEMO_CUSTOMER_ID,
      capabilityId: 'sepa_demo',
      in: { accountId: 'demo-wallet', amount: '100.00', currency: 'USDC' },
      destinationId: 'rcpacct_01',
      out: { currency: 'EUR' },
    })

    await expect(provider.executeQuote({ quoteId: 'quote_1' })).resolves.toMatchObject({
      quoteId: 'quote_1',
      state: 'processing',
      customerId: DEMO_CUSTOMER_ID,
      capabilityId: 'sepa_demo',
      method: 'sepa',
      openTaskIds: [],
      references: { returnedTransferId: null },
    })
    await expect(provider.executeQuote({ quoteId: 'unknown' })).rejects.toThrow('was not found')
  })
})
