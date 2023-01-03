import { beforeEach, describe, expect, it } from 'vitest'
import { createStorageJournal } from './journal'
import type { AuditEvent, OperationReceipt } from './runtime'

const receipt: OperationReceipt = {
  id: 'tr_1',
  status: 'processing',
  intent: {
    customerId: 'cus_1',
    agentId: 'agent_1',
    amount: 100,
    currency: 'USDC',
    outCurrency: 'EUR',
    rail: 'sepa',
    sourceAccountId: 'acc_1',
    destinationId: 'dst_1',
  },
  quote: {
    id: 'quo_1',
    customerId: 'cus_1',
    capabilityId: 'sepa_named',
    in: { accountId: 'acc_1', amount: '100.00', currency: 'USDC' },
    out: { amount: '90.00', currency: 'EUR' },
    status: 'executed',
    createdAt: '2030-01-01T00:00:00Z',
    expiresAt: '2030-01-01T00:05:00Z',
    rate: '0.9',
  },
  policy: {
    decision: 'allow',
    reasons: [],
    context: { agentId: 'agent_1', operation: 'payout', periodSpendBefore: 0, periodSpendAfter: 100 },
  },
  evidence: {
    source: 'provider_response',
    capabilityId: 'sepa_named',
    transferId: 'tr_1',
    providerState: 'processing',
    openTaskIds: [],
    references: { returnedTransferId: null },
    timestamps: { createdAt: '2030-01-01T00:01:00Z' },
  },
}

const event: AuditEvent = {
  type: 'transfer.created',
  resourceId: 'tr_1',
  agentId: 'agent_1',
  occurredAt: '2030-01-01T00:01:00Z',
  policy: receipt.policy,
}

describe('financial journal', () => {
  beforeEach(() => localStorage.clear())

  it('persists receipts and audit events across journal instances without exposing mutable state', () => {
    const first = createStorageJournal(localStorage, 'test_financial_journal')
    first.saveReceipt(receipt)
    first.appendAudit(event)

    const second = createStorageJournal(localStorage, 'test_financial_journal')
    const loaded = second.getReceipt('tr_1')
    expect(loaded).toEqual(receipt)
    expect(second.listReceipts()).toEqual([receipt])
    expect(second.listAudit()).toEqual([event])

    loaded!.status = 'tampered'
    expect(second.getReceipt('tr_1')?.status).toBe('processing')
  })
})
