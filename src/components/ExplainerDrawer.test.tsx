import { describe, it, expect, afterEach } from 'vitest'
import { act, screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils'
import { setSourceOverride } from '@/data'
import { ExplainerDrawer } from './ExplainerDrawer'
import { useExplainer } from '@/context/useExplainer'
import { emitAction } from '@/lib/events'
import { useEffect } from 'react'
import type { OperationReceipt } from '@/financial/runtime'

function ForceOpen() {
  const { setOpen } = useExplainer()
  useEffect(() => setOpen(true), [setOpen])
  return null
}

afterEach(() => setSourceOverride(null))

describe('ExplainerDrawer', () => {
  it('narrates a payout and advances steps on transfer.updated', async () => {
    renderWithProviders(<><ForceOpen /><ExplainerDrawer /></>)

    act(() => emitAction({
      type: 'payout.created',
      transfer: { id: 'tx9', type: 'offramp', state: 'pending', createdAt: new Date().toISOString() },
    }))
    expect(await screen.findByText('Behind a bank payout')).toBeInTheDocument()
    expect(screen.getByText('Quote locked')).toBeInTheDocument()

    act(() => emitAction({
      type: 'transfer.updated',
      transfer: { id: 'tx9', type: 'offramp', state: 'completed', createdAt: new Date().toISOString() },
    }))
    // all 4 steps done → 4 checkmarks
    expect(screen.getAllByTestId('step-done')).toHaveLength(4)
  })

  it('shows idle hint when nothing happened yet', () => {
    renderWithProviders(<><ForceOpen /><ExplainerDrawer /></>)
    expect(screen.getByText(/do something/i)).toBeInTheDocument()
  })

  it('renders policy, quote, and provider-state evidence from an operation receipt', async () => {
    renderWithProviders(<><ForceOpen /><ExplainerDrawer /></>)
    const receipt = {
      id: 'tr_evidence',
      status: 'processing',
      intent: {
        customerId: 'cus_1', agentId: 'agent_1', amount: 25, currency: 'USDC', outCurrency: 'EUR',
        rail: 'sepa', sourceAccountId: 'acc_1', destinationId: 'dst_1',
      },
      quote: {
        id: 'quo_evidence', customerId: 'cus_1', capabilityId: 'sepa_named',
        in: { accountId: 'acc_1', amount: '25.00', currency: 'USDC' }, out: { amount: '22.50', currency: 'EUR' },
        rate: '0.9', status: 'executed', createdAt: '2030-01-01T00:00:00Z', expiresAt: '2030-01-01T00:05:00Z',
      },
      policy: {
        decision: 'allow', reasons: [],
        context: { agentId: 'agent_1', operation: 'payout', periodSpendBefore: 0, periodSpendAfter: 25 },
      },
      evidence: {
        source: 'provider_response', capabilityId: 'sepa_named', transferId: 'tr_evidence', providerState: 'processing',
        openTaskIds: [], references: {}, timestamps: { createdAt: '2030-01-01T00:01:00Z' },
      },
    } satisfies OperationReceipt

    act(() => emitAction({ type: 'operation.receipt', receipt }))

    expect(await screen.findByText(/quo_evidence/)).toBeInTheDocument()
    expect(screen.getByText(/tr_evidence.*processing/i)).toBeInTheDocument()
    expect(screen.getByText(/decision: allow/i)).toBeInTheDocument()
    expect(screen.queryByText(/same day|instantly|in seconds/i)).not.toBeInTheDocument()
  })
})
