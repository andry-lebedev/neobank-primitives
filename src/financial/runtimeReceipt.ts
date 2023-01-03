import type { PolicyDecision } from './policy'
import type { OperationReceipt, QuoteCommand } from './runtime'
import type { ProviderQuote, ProviderTransfer } from './swipeluxV3'

export interface ReceiptContext {
  command: QuoteCommand
  decision: PolicyDecision
  capabilityId: string
  quote: ProviderQuote
  approval?: { requestId: string; approverId: string }
}

function observedSettlement(timestamps: Record<string, string | null>, state: string) {
  const startedAt = timestamps.createdAt
  const completedAt = timestamps.completedAt
  const startedMs = startedAt ? new Date(startedAt).getTime() : Number.NaN
  const completedMs = completedAt ? new Date(completedAt).getTime() : Number.NaN
  if (
    state !== 'completed'
    || !startedAt
    || !completedAt
    || !Number.isFinite(startedMs)
    || !Number.isFinite(completedMs)
    || completedMs < startedMs
  ) return undefined
  return { startedAt, completedAt, durationMs: completedMs - startedMs }
}

export function createOperationReceipt(locked: ReceiptContext, transfer: ProviderTransfer): OperationReceipt {
  const timestamps = { ...(transfer.timestamps ?? {}) }
  const settlement = observedSettlement(timestamps, transfer.state)
  return {
    id: transfer.id,
    status: transfer.state,
    intent: { ...locked.command },
    quote: { ...locked.quote },
    policy: {
      ...locked.decision,
      reasons: [...locked.decision.reasons],
      context: { ...locked.decision.context },
    },
    ...(locked.approval ? { approval: { ...locked.approval } } : {}),
    evidence: {
      source: 'provider_response',
      capabilityId: transfer.capabilityId ?? locked.capabilityId,
      transferId: transfer.id,
      providerState: transfer.state,
      stateDetail: transfer.stateDetail,
      openTaskIds: [...(transfer.openTaskIds ?? [])],
      references: { ...(transfer.references ?? {}) },
      timestamps,
      ...(settlement ? { observedSettlement: settlement } : {}),
    },
  }
}
