import { beforeEach, describe, expect, it, vi } from 'vitest'
import { client } from '@/data/live/client'
import { swipeluxV3, type WebhookRequest } from './swipeluxV3'

vi.mock('@/data/live/client', () => ({
  client: { get: vi.fn(), post: vi.fn() },
}))

const mockedGet = vi.mocked(client.get)
const mockedPost = vi.mocked(client.post)

describe('Swipelux v3 financial adapter', () => {
  beforeEach(() => {
    mockedGet.mockReset()
    mockedPost.mockReset()
  })

  it('returns customer-specific capability evidence', async () => {
    const capabilities = [
      { id: 'sepa_named', method: 'sepa', availability: 'available', directions: ['payin', 'payout'], eligibility: { eligible: true } },
    ]
    mockedGet.mockResolvedValueOnce({ data: { data: capabilities } })

    await expect(swipeluxV3.supportedCapabilities('cus_123')).resolves.toEqual(capabilities)
    expect(mockedGet).toHaveBeenCalledWith('/v3/customers/cus_123/capabilities/supported')
  })

  it('returns ready v3 account resources for quote source selection', async () => {
    const accounts = [{ id: 'acc_usdc', type: 'wallet', origin: 'issued', status: 'ready', currency: 'USDC', details: { network: 'polygon', address: '0x1' } }]
    mockedGet.mockResolvedValueOnce({ data: { data: accounts } })

    await expect(swipeluxV3.listAccounts('cus_123')).resolves.toEqual(accounts)
    expect(mockedGet).toHaveBeenCalledWith('/v3/customers/cus_123/accounts')
  })

  it('locks pricing in a quote and executes that exact quote', async () => {
    const quoteRequest = {
      customerId: 'cus_123',
      capabilityId: 'sepa_named',
      in: { accountId: 'acc_usdc', amount: '100.00', currency: 'USDC' },
      destinationId: 'dst_iban',
      out: { currency: 'EUR' },
      externalId: 'agent-run-42',
    }
    const quote = { id: 'qte_1', ...quoteRequest, status: 'ready', expiresAt: '2030-01-01T00:05:00Z' }
    const transfer = { id: 'trf_1', quoteId: quote.id, state: 'pending' }
    mockedPost
      .mockResolvedValueOnce({ data: { data: quote } })
      .mockResolvedValueOnce({ data: { data: transfer } })

    await expect(swipeluxV3.createQuote(quoteRequest)).resolves.toEqual(quote)
    await expect(swipeluxV3.executeQuote({ quoteId: quote.id, externalId: 'agent-run-42' })).resolves.toEqual(transfer)
    expect(mockedPost).toHaveBeenNthCalledWith(1, '/v3/quotes', quoteRequest)
    expect(mockedPost).toHaveBeenNthCalledWith(2, '/v3/transfers', { quoteId: quote.id, externalId: 'agent-run-42' })
  })

  it('reads provider settlement and compliance evidence for a transfer', async () => {
    const transfer = {
      id: 'trf_1',
      state: 'completed',
      stateDetail: { code: 'settled', actor: 'provider' },
      openTaskIds: [],
      references: { traceNumber: 'sepa-123', returnedTransferId: null },
      timestamps: { createdAt: '2030-01-01T00:00:00Z', completedAt: '2030-01-01T00:00:05Z' },
    }
    mockedGet.mockResolvedValueOnce({ data: { data: transfer } })

    await expect(swipeluxV3.getTransfer('trf_1')).resolves.toEqual(transfer)
    expect(mockedGet).toHaveBeenCalledWith('/v3/transfers/trf_1')
  })

  it('creates an automatic funds-received rule for inbound credits', async () => {
    const rule = {
      trigger: { type: 'funds_received' as const, accountId: 'acc_settlement' },
      action: { type: 'transfer' as const, target: { type: 'account' as const, id: 'acc_wallet' } },
      label: 'Credit the customer wallet',
    }
    mockedPost.mockResolvedValueOnce({ data: { data: { id: 'rul_1', status: 'active', ...rule } } })

    await expect(swipeluxV3.createRule('cus_123', rule)).resolves.toMatchObject({ id: 'rul_1', status: 'active' })
    expect(mockedPost).toHaveBeenCalledWith('/v3/customers/cus_123/rules', rule)
  })

  it('registers provider webhooks for customer, account, capability, and transfer evidence', async () => {
    const registration = {
      url: 'https://merchant.example/webhooks/swipelux',
      events: ['customer.updated', 'capability.status_changed', 'account.details_changed', 'transfer.state_changed'],
    } satisfies WebhookRequest
    mockedPost.mockResolvedValueOnce({ data: { data: { id: 'whk_1', status: 'active', ...registration } } })

    await expect(swipeluxV3.createWebhook(registration)).resolves.toMatchObject({ id: 'whk_1', status: 'active' })
    expect(mockedPost).toHaveBeenCalledWith('/v3/webhooks', registration)
  })

  it('uses the sandbox verification interface and returns the resulting status', async () => {
    const verification = { customerId: 'cus_123', customerType: 'individual', previousStatus: 'pending', status: 'approved', reason: null }
    mockedPost.mockResolvedValueOnce({ data: { data: verification } })

    await expect(swipeluxV3.simulateVerification('cus_123', 'approved')).resolves.toEqual(verification)
    expect(mockedPost).toHaveBeenCalledWith('/v3/sandbox/customers/cus_123/verification', { status: 'approved' })
  })

  it('creates and lists v3 recipients and payout destinations', async () => {
    const recipientInput = {
      type: 'individual' as const,
      relationship: 'vendor' as const,
      firstName: 'Maria',
      lastName: 'K',
    }
    const destinationInput = {
      type: 'wallet' as const,
      currency: 'USDC',
      details: { network: 'polygon', address: '0x1234' },
      ownership: { type: 'self_custodied' as const },
    }
    mockedGet
      .mockResolvedValueOnce({ data: { data: [{ id: 'rcp_1', ...recipientInput }] } })
      .mockResolvedValueOnce({ data: { data: [{ id: 'dst_1', status: 'ready', ...destinationInput }] } })
    mockedPost
      .mockResolvedValueOnce({ data: { data: { id: 'rcp_1', ...recipientInput } } })
      .mockResolvedValueOnce({ data: { data: { id: 'dst_1', status: 'ready', ...destinationInput } } })

    await expect(swipeluxV3.listRecipients('cus_123')).resolves.toHaveLength(1)
    await expect(swipeluxV3.createRecipient('cus_123', recipientInput)).resolves.toMatchObject({ id: 'rcp_1' })
    await expect(swipeluxV3.listDestinations('cus_123', 'rcp_1')).resolves.toHaveLength(1)
    await expect(swipeluxV3.createDestination('cus_123', 'rcp_1', destinationInput)).resolves.toMatchObject({ id: 'dst_1' })

    expect(mockedGet).toHaveBeenNthCalledWith(1, '/v3/customers/cus_123/recipients')
    expect(mockedPost).toHaveBeenNthCalledWith(1, '/v3/customers/cus_123/recipients', recipientInput)
    expect(mockedGet).toHaveBeenNthCalledWith(2, '/v3/customers/cus_123/recipients/rcp_1/destinations')
    expect(mockedPost).toHaveBeenNthCalledWith(2, '/v3/customers/cus_123/recipients/rcp_1/destinations', destinationInput)
  })
})
