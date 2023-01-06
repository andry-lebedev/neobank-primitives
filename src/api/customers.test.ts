import { describe, expect, it, vi } from 'vitest'
import client from './client'
import { createCustomer, initiateKyc } from './customers'

vi.mock('./client', () => ({
  default: {
    post: vi.fn(() => Promise.resolve({ data: { id: 'cus_123' } })),
  },
}))

describe('createCustomer', () => {
  it('posts an individual customer and omits empty optional personal fields', async () => {
    await createCustomer({
      firstName: 'Ada',
      middleName: '',
      lastName: undefined,
      birthDate: '',
      email: 'ada@example.com',
      phone: null,
    })

    expect(client.post).toHaveBeenCalledWith('/v2/customers', {
      type: 'individual',
      personal: {
        firstName: 'Ada',
        email: 'ada@example.com',
      },
    })
  })

  it('only attaches address and tax info when all required fields are present', async () => {
    await createCustomer({
      email: 'ada@example.com',
      address: {
        country: 'US',
        streetLine1: '1 Main St',
        streetLine2: '',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
      },
      taxInfo: {
        country: 'US',
        type: 'ssn',
        value: '1234',
      },
      externalId: 'demo-1',
      metadata: { source: 'onboarding' },
    })

    expect(client.post).toHaveBeenLastCalledWith('/v2/customers', {
      type: 'individual',
      externalId: 'demo-1',
      metadata: { source: 'onboarding' },
      personal: {
        email: 'ada@example.com',
      },
      taxInfo: {
        country: 'US',
        type: 'ssn',
        value: '1234',
      },
    })
  })

  it('initiateKyc posts level to the kyc endpoint and returns data', async () => {
    vi.mocked(client.post).mockResolvedValueOnce({ data: { verificationUrl: 'https://sumsub.test/abc' } })
    const res = await initiateKyc('cus_1', 'simplified')
    expect(client.post).toHaveBeenCalledWith('/v1/customers/cus_1/kyc', { level: 'simplified' })
    expect(res.verificationUrl).toBe('https://sumsub.test/abc')
  })

  it('initiateKyc defaults to simplified level', async () => {
    vi.mocked(client.post).mockResolvedValueOnce({ data: { verificationUrl: 'x' } })
    await initiateKyc('cus_2')
    expect(client.post).toHaveBeenCalledWith('/v1/customers/cus_2/kyc', { level: 'simplified' })
  })
})
