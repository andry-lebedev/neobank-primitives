import { describe, expect, it, vi } from 'vitest'
import { createPolicyEngine } from './policy'
import { createFinancialRuntime } from './runtime'
import type { FinancialProvider, ProviderQuote } from './swipeluxV3'
import { createMemoryJournal } from './journal'

function createProvider(): FinancialProvider {
  return {
    supportedCapabilities: vi.fn(async () => [
      { id: 'sepa_named', method: 'sepa', availability: 'available', directions: ['payout' as const], eligibility: { eligible: true } },
    ]),
    listAccounts: vi.fn(),
    listRecipients: vi.fn(),
    createRecipient: vi.fn(),
    listDestinations: vi.fn(),
    createDestination: vi.fn(),
    createQuote: vi.fn(async input => ({
      id: 'qte_1',
      ...input,
      status: 'ready',
      rate: '0.99',
      createdAt: '2030-01-01T00:00:00Z',
      expiresAt: '2030-01-01T00:05:00Z',
    } satisfies ProviderQuote)),
    executeQuote: vi.fn(async input => ({
      id: 'tr_1',
      quoteId: input.quoteId,
      state: 'processing',
      customerId: 'cus_1',
      capabilityId: 'sepa_named',
      method: 'sepa',
      stateDetail: null,
      openTaskIds: [],
      references: { returnedTransferId: null },
      timestamps: {
        createdAt: '2030-01-01T00:01:00Z',
        updatedAt: '2030-01-01T00:01:00Z',
        fundsReceivedAt: null,
        completedAt: null,
        failedAt: null,
        returnedAt: null,
        settledAt: null,
      },
    })),
    getTransfer: vi.fn(),
    createRule: vi.fn(),
    createWebhook: vi.fn(),
    simulateVerification: vi.fn(),
  }
}

function createPolicy() {
  return createPolicyEngine({
    agents: {
      treasury_bot: {
        allowedCurrencies: ['EUR', 'USDC'],
        allowedRails: ['sepa'],
        approvedDestinations: ['dst_payroll'],
        blockedDestinations: [],
        allowedApprovers: ['human_cfo'],
        perOperationLimit: 1_000,
        periodLimit: 5_000,
        spentInPeriod: 0,
      },
    },
  })
}

describe('financial runtime', () => {
  it('returns a provider-locked quote only after capability and policy checks pass', async () => {
    const provider = createProvider()
    const runtime = createFinancialRuntime({
      provider,
      policy: createPolicy(),
      now: () => new Date('2030-01-01T00:00:00Z'),
    })

    const outcome = await runtime.quote({
      customerId: 'cus_1',
      agentId: 'treasury_bot',
      amount: 250,
      currency: 'USDC',
      outCurrency: 'EUR',
      rail: 'sepa',
      sourceAccountId: 'acc_usdc',
      destinationId: 'dst_payroll',
      externalId: 'invoice-42',
    })

    expect(outcome).toMatchObject({
      status: 'ready',
      decision: { decision: 'allow' },
      quote: { id: 'qte_1', expiresAt: '2030-01-01T00:05:00Z' },
    })
    expect(provider.createQuote).toHaveBeenCalledWith({
      customerId: 'cus_1',
      capabilityId: 'sepa_named',
      in: { accountId: 'acc_usdc', amount: '250.00', currency: 'USDC' },
      destinationId: 'dst_payroll',
      out: { currency: 'EUR' },
      externalId: 'invoice-42',
    })
    expect(runtime.audit()).toEqual([
      expect.objectContaining({ type: 'quote.created', resourceId: 'qte_1', agentId: 'treasury_bot' }),
    ])
  })

  it('pauses an out-of-policy intent until an identified human approves it', async () => {
    const provider = createProvider()
    const policy = createPolicyEngine({
      agents: {
        treasury_bot: {
          allowedCurrencies: ['USDC'],
          allowedRails: ['sepa'],
          approvedDestinations: ['dst_payroll'],
          blockedDestinations: [],
          allowedApprovers: ['human_cfo'],
          perOperationLimit: 100,
          periodLimit: 5_000,
          spentInPeriod: 0,
        },
      },
    })
    const runtime = createFinancialRuntime({
      provider,
      policy,
      now: () => new Date('2030-01-01T00:00:00Z'),
      createId: () => 'apr_1',
    })
    const command = {
      customerId: 'cus_1',
      agentId: 'treasury_bot',
      amount: 250,
      currency: 'USDC',
      outCurrency: 'EUR',
      rail: 'sepa',
      sourceAccountId: 'acc_usdc',
      destinationId: 'dst_payroll',
    }

    const pending = await runtime.quote(command)
    expect(pending).toMatchObject({ status: 'approval_required', requestId: 'apr_1' })
    expect(provider.createQuote).not.toHaveBeenCalled()

    await expect(runtime.approve('apr_1', 'untrusted_user')).rejects.toThrow('not authorized')
    const approved = await runtime.approve('apr_1', 'human_cfo')
    expect(approved).toMatchObject({
      status: 'ready',
      quote: { id: 'qte_1' },
      approval: { requestId: 'apr_1', approverId: 'human_cfo' },
    })
    expect(runtime.audit().map(event => event.type)).toEqual([
      'approval.requested',
      'approval.granted',
      'quote.created',
    ])
  })

  it('executes the exact locked quote before expiry and refuses expired or replayed quotes', async () => {
    const provider = createProvider()
    const journal = createMemoryJournal()
    const onReceipt = vi.fn()
    let clock = new Date('2030-01-01T00:00:00Z')
    const runtime = createFinancialRuntime({
      provider,
      policy: createPolicy(),
      now: () => clock,
      journal,
      onReceipt,
    })
    const command = {
      customerId: 'cus_1',
      agentId: 'treasury_bot',
      amount: 250,
      currency: 'USDC',
      outCurrency: 'EUR',
      rail: 'sepa',
      sourceAccountId: 'acc_usdc',
      destinationId: 'dst_payroll',
      externalId: 'invoice-42',
    }

    await runtime.quote(command)
    clock = new Date('2030-01-01T00:04:59Z')
    const receipt = await runtime.execute('qte_1', { memo: 'January payroll' })

    expect(provider.executeQuote).toHaveBeenCalledWith({
      quoteId: 'qte_1',
      externalId: 'invoice-42',
      memo: 'January payroll',
    })
    expect(receipt).toMatchObject({
      id: 'tr_1',
      status: 'processing',
      quote: { id: 'qte_1', expiresAt: '2030-01-01T00:05:00Z' },
      policy: { decision: 'allow' },
      evidence: { capabilityId: 'sepa_named', transferId: 'tr_1', providerState: 'processing' },
    })
    expect(journal.getReceipt('tr_1')).toEqual(receipt)
    expect(onReceipt).toHaveBeenCalledWith(receipt)
    await expect(runtime.execute('qte_1')).rejects.toThrow('already been executed')

    const secondProvider = createProvider()
    const expiredRuntime = createFinancialRuntime({
      provider: secondProvider,
      policy: createPolicy(),
      now: () => clock,
    })
    await expiredRuntime.quote(command)
    clock = new Date('2030-01-01T00:05:00Z')
    await expect(expiredRuntime.execute('qte_1')).rejects.toThrow('expired')
    expect(secondProvider.executeQuote).not.toHaveBeenCalled()
  })

  it('refreshes a receipt from provider state and reports only observed settlement timing', async () => {
    const provider = createProvider()
    vi.mocked(provider.getTransfer).mockResolvedValueOnce({
      id: 'tr_1',
      quoteId: 'qte_1',
      state: 'completed',
      capabilityId: 'sepa_named',
      stateDetail: null,
      openTaskIds: [],
      references: { traceNumber: 'sepa-123', returnedTransferId: null },
      timestamps: {
        createdAt: '2030-01-01T00:01:00Z',
        updatedAt: '2030-01-01T00:01:05Z',
        fundsReceivedAt: null,
        completedAt: '2030-01-01T00:01:05Z',
        failedAt: null,
        returnedAt: null,
        settledAt: null,
      },
    })
    const runtime = createFinancialRuntime({
      provider,
      policy: createPolicy(),
      now: () => new Date('2030-01-01T00:02:00Z'),
    })

    await runtime.quote({
      customerId: 'cus_1',
      agentId: 'treasury_bot',
      amount: 250,
      currency: 'USDC',
      outCurrency: 'EUR',
      rail: 'sepa',
      sourceAccountId: 'acc_usdc',
      destinationId: 'dst_payroll',
    })
    await runtime.execute('qte_1')

    await expect(runtime.refresh('tr_1')).resolves.toMatchObject({
      status: 'completed',
      evidence: {
        providerState: 'completed',
        references: { traceNumber: 'sepa-123' },
        observedSettlement: {
          startedAt: '2030-01-01T00:01:00Z',
          completedAt: '2030-01-01T00:01:05Z',
          durationMs: 5_000,
        },
      },
    })
    expect(provider.getTransfer).toHaveBeenCalledWith('tr_1')
    expect(runtime.audit().at(-1)).toMatchObject({ type: 'transfer.updated', resourceId: 'tr_1' })
  })

  it('audits a blocked intent when the requested rail is not available', async () => {
    const provider = createProvider()
    vi.mocked(provider.supportedCapabilities).mockResolvedValueOnce([])
    const runtime = createFinancialRuntime({ provider, policy: createPolicy() })

    await expect(runtime.quote({
      customerId: 'cus_1',
      agentId: 'treasury_bot',
      amount: 50,
      currency: 'USDC',
      outCurrency: 'EUR',
      rail: 'sepa',
      sourceAccountId: 'acc_usdc',
      destinationId: 'dst_payroll',
      externalId: 'intent-1',
    })).resolves.toMatchObject({ status: 'blocked', decision: { reasons: ['capability_not_available'] } })
    expect(runtime.audit()).toContainEqual(expect.objectContaining({
      type: 'policy.blocked',
      resourceId: 'intent-1',
      agentId: 'treasury_bot',
    }))
  })

  it('does not report a locked quote when the provider response is not executable', async () => {
    const provider = createProvider()
    vi.mocked(provider.createQuote).mockResolvedValueOnce({
      id: 'qte_failed',
      customerId: 'cus_1',
      capabilityId: 'sepa_named',
      in: { accountId: 'acc_usdc', amount: '50.00', currency: 'USDC' },
      out: { currency: 'EUR' },
      status: 'failed',
      rate: '0.99',
      createdAt: '2030-01-01T00:00:00Z',
      expiresAt: '2030-01-01T00:05:00Z',
    })
    const runtime = createFinancialRuntime({
      provider,
      policy: createPolicy(),
      now: () => new Date('2030-01-01T00:00:00Z'),
    })

    await expect(runtime.quote({
      customerId: 'cus_1', agentId: 'treasury_bot', amount: 50, currency: 'USDC', outCurrency: 'EUR',
      rail: 'sepa', sourceAccountId: 'acc_usdc', destinationId: 'dst_payroll',
    })).rejects.toThrow('not executable')
    expect(runtime.audit()).toEqual([])
  })
})
