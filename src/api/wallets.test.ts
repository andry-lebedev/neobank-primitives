import { describe, expect, it, vi } from 'vitest'
import client from './client'
import { createWallet } from './wallets'

vi.mock('./client', () => ({
  default: { post: vi.fn(() => Promise.resolve({ data: { id: 'wal_1' } })), get: vi.fn() },
}))

describe('createWallet', () => {
  it('posts the chain to the customer wallets endpoint', async () => {
    await createWallet('cus_1', 'polygon')
    expect(client.post).toHaveBeenCalledWith('/v1/customers/cus_1/wallets', { chain: 'polygon' })
  })

  it('defaults chain to polygon', async () => {
    await createWallet('cus_2')
    expect(client.post).toHaveBeenLastCalledWith('/v1/customers/cus_2/wallets', { chain: 'polygon' })
  })
})
