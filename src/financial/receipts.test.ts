import { describe, expect, it } from 'vitest'
import { receiptToTransfer } from './receipts'
import type { OperationReceipt } from './runtime'

describe('operation receipt projection', () => {
  it('projects provider state and amounts into the UI transfer contract', () => {
    const receipt = {
      id: 'tr_1',
      status: 'processing',
      intent: {
        customerId: 'cus_1', agentId: 'agent_1', amount: 100, currency: 'USDC', outCurrency: 'EUR',
        rail: 'sepa', sourceAccountId: 'acc_1', destinationId: 'dst_1',
      },
      quote: {
        id: 'quo_1', customerId: 'cus_1', capabilityId: 'sepa_named',
        in: { accountId: 'acc_1', amount: '100.00', currency: 'USDC' },
        out: { amount: '90.00', currency: 'EUR' },
        status: 'executed', rate: '0.9', createdAt: '2030-01-01T00:00:00Z', expiresAt: '2030-01-01T00:05:00Z',
      },
      policy: {
        decision: 'allow', reasons: [],
        context: { agentId: 'agent_1', operation: 'payout', periodSpendBefore: 0, periodSpendAfter: 100 },
      },
      evidence: {
        source: 'provider_response', capabilityId: 'sepa_named', transferId: 'tr_1', providerState: 'processing',
        openTaskIds: [], references: {}, timestamps: { createdAt: '2030-01-01T00:01:00Z' },
      },
    } satisfies OperationReceipt

    expect(receiptToTransfer(receipt)).toEqual({
      id: 'tr_1',
      type: 'offramp',
      state: 'in_progress',
      createdAt: '2030-01-01T00:01:00Z',
      updatedAt: '2030-01-01T00:01:00Z',
      from: { amount: '100.00', currency: 'USDC' },
      to: { rail: 'sepa', identifier: 'dst_1', amount: '90.00', currency: 'EUR' },
    })
  })
})
