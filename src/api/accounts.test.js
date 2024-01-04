import { describe, expect, it, vi } from 'vitest'
import client from './client'
import { createAccount } from './accounts'

vi.mock('./client', () => ({
  default: { post: vi.fn(() => Promise.resolve({ data: { id: 'acc_1' } })), get: vi.fn() },
}))

describe('createAccount', () => {
  it('posts required fields for a SEPA virtual account', async () => {
    await createAccount('cus_1', { type: 'sepa', country: 'EE', currency: 'EUR', targetWallet: 'wal_1' })
    expect(client.post).toHaveBeenCalledWith('/v1/customers/cus_1/accounts', {
      type: 'sepa', country: 'EE', currency: 'EUR', targetWallet: 'wal_1',
    })
  })

  it('includes label only when provided', async () => {
    await createAccount('cus_1', { type: 'sepa', country: 'EE', currency: 'EUR', targetWallet: 'wal_1', label: 'Main' })
    expect(client.post).toHaveBeenLastCalledWith('/v1/customers/cus_1/accounts', {
      type: 'sepa', country: 'EE', currency: 'EUR', targetWallet: 'wal_1', label: 'Main',
    })
  })
})
