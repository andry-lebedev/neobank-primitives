import { describe, it, expect, beforeEach } from 'vitest'
import { createDemoSource } from './source'
import { demoStore } from './store'
import { DEMO_CUSTOMER_ID } from './fixtures'

describe('demo source', () => {
  beforeEach(() => {
    sessionStorage.clear()
    demoStore.reset()
  })

  it('resolves store data through the async DataSource face', async () => {
    const source = createDemoSource({ latencyMs: 0 })
    const customer = await source.getCustomer(DEMO_CUSTOMER_ID)
    expect(customer.id).toBe(DEMO_CUSTOMER_ID)
    const wallets = await source.listWallets(DEMO_CUSTOMER_ID)
    expect(wallets).toHaveLength(1)
  })

  it('rejects (not throws sync) on store errors', async () => {
    const source = createDemoSource({ latencyMs: 0 })
    // getCustomer tolerates unknown ids (falls back to the default persona);
    // getTransfer still throws for a missing id, which must surface as a rejection.
    await expect(source.getTransfer('nope')).rejects.toThrow(/not found/i)
  })

  it('lists all seeded customers', async () => {
    const source = createDemoSource({ latencyMs: 0 })
    const customers = await source.listCustomers()
    expect(customers.length).toBeGreaterThanOrEqual(3)
    expect(customers.map(c => c.id)).toContain(DEMO_CUSTOMER_ID)
  })
})
