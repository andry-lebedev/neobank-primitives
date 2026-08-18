import { describe, expect, it, vi } from 'vitest'
import { registerEvidenceWebhook } from './webhooks'
import type { FinancialProvider } from './swipeluxV3'

describe('provider evidence webhooks', () => {
  it('registers the lifecycle events the runtime can reconcile and returns provider evidence', async () => {
    const createWebhook = vi.fn(async input => ({ id: 'whk_1', status: 'active', ...input }))
    const provider = { createWebhook } as Pick<FinancialProvider, 'createWebhook'>

    await expect(registerEvidenceWebhook(provider, 'https://merchant.example/swipelux')).resolves.toEqual({
      status: 'active',
      registrationId: 'whk_1',
      url: 'https://merchant.example/swipelux',
      events: [
        'customer.updated',
        'capability.status_changed',
        'account.details_changed',
        'transfer.state_changed',
      ],
      source: 'provider_response',
    })
  })

  it('does not report webhook support when the provider registration is inactive', async () => {
    const provider = {
      createWebhook: vi.fn(async input => ({ id: 'whk_1', status: 'disabled', ...input })),
    } as Pick<FinancialProvider, 'createWebhook'>

    await expect(registerEvidenceWebhook(provider, 'https://merchant.example/swipelux')).rejects.toThrow('disabled')
  })
})
