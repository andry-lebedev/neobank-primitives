import { describe, expect, it, vi } from 'vitest'
import client from './client'
import { createRecipient, createRecipientAccount, listRecipients, listRecipientAccounts } from './recipients'

vi.mock('./client', () => ({
  default: {
    post: vi.fn(() => Promise.resolve({ data: { id: 'rec_1' } })),
    get: vi.fn(() => Promise.resolve({ data: { recipients: [] } })),
  },
}))

describe('recipients api', () => {
  it('lists recipients', async () => {
    await listRecipients('cus_1')
    expect(client.get).toHaveBeenCalledWith('/v1/customers/cus_1/recipients')
  })

  it('creates an individual recipient and strips empty optional fields', async () => {
    await createRecipient('cus_1', { type: 'individual', firstName: 'Ada', lastName: 'L', email: '', phone: undefined })
    expect(client.post).toHaveBeenCalledWith('/v1/customers/cus_1/recipients', {
      type: 'individual', firstName: 'Ada', lastName: 'L',
    })
  })

  it('lists recipient accounts', async () => {
    await listRecipientAccounts('cus_1', 'rec_1')
    expect(client.get).toHaveBeenCalledWith('/v1/customers/cus_1/recipients/rec_1/accounts')
  })

  it('creates a SEPA recipient account', async () => {
    const details = { iban: 'EE382200221020145685', accountHolderName: 'Ada L', country: 'EE', currency: 'EUR' }
    await createRecipientAccount('cus_1', 'rec_1', { rail: 'sepa', details })
    expect(client.post).toHaveBeenLastCalledWith('/v1/customers/cus_1/recipients/rec_1/accounts', { rail: 'sepa', details })
  })
})
