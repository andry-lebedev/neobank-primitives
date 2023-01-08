import { describe, it, expect, vi, beforeEach } from 'vitest'
import { client } from './client'
import { liveSource } from './source'

vi.mock('./client', () => ({
  client: { get: vi.fn(), post: vi.fn() },
}))

const mockedGet = vi.mocked(client.get)
const mockedPost = vi.mocked(client.post)

describe('live source', () => {
  beforeEach(() => {
    mockedGet.mockReset()
    mockedPost.mockReset()
  })

  it('normalizes wrapped list responses', async () => {
    mockedGet.mockResolvedValueOnce({ data: { wallets: [{ id: 'w1' }] } })
    expect(await liveSource.listWallets('c1')).toEqual([{ id: 'w1' }])
    expect(mockedGet).toHaveBeenCalledWith('/v1/customers/c1/wallets')

    mockedGet.mockResolvedValueOnce({ data: [{ id: 't1' }] })
    expect(await liveSource.listTransfers('c1')).toEqual([{ id: 't1' }])
    expect(mockedGet).toHaveBeenCalledWith('/v1/transfers', { params: { customerId: 'c1' } })
  })

  it('builds the v1 payout payload', async () => {
    mockedPost.mockResolvedValueOnce({ data: { id: 'tx1' } })
    await liveSource.createPayout({ fromWalletId: 'w1', amount: 100, currency: 'USDC', toId: 'a1', toCurrency: 'EUR' })
    expect(mockedPost).toHaveBeenCalledWith('/v1/payout', {
      from: { id: 'w1', amount: 100, currency: 'USDC' },
      to: { id: 'a1', currency: 'EUR' },
    })
  })

  it('creates customers via /v2 with compacted personal block', async () => {
    mockedPost.mockResolvedValueOnce({ data: { id: 'c9' } })
    await liveSource.createCustomer({ firstName: 'Ada', lastName: 'L', email: 'ada@x.io' })
    expect(mockedPost).toHaveBeenCalledWith('/v2/customers', {
      type: 'individual',
      personal: { firstName: 'Ada', lastName: 'L', email: 'ada@x.io' },
    })
  })
})
