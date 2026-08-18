import type { Transfer, TransferState } from '@/data/types'
import type { OperationReceipt } from './runtime'

function transferState(providerState: string): TransferState {
  if (providerState === 'completed') return 'completed'
  if (providerState === 'failed' || providerState === 'canceled') return 'failed'
  if (providerState === 'awaiting_funds') return 'awaiting_funds'
  if (providerState === 'processing') return 'in_progress'
  return 'pending'
}

function failureReason(detail: unknown): string | undefined {
  if (!detail || typeof detail !== 'object') return undefined
  const value = detail as Record<string, unknown>
  if (typeof value.message === 'string') return value.message
  if (typeof value.code === 'string') return value.code
  return undefined
}

export function receiptToTransfer(receipt: OperationReceipt): Transfer {
  const walletTransfer = receipt.intent.rail === 'stablecoin_transfers'
  const createdAt = receipt.evidence.timestamps.createdAt ?? receipt.quote.createdAt
  const updatedAt = receipt.evidence.timestamps.updatedAt ?? createdAt
  return {
    id: receipt.id,
    type: walletTransfer ? 'wallet_to_wallet' : 'offramp',
    state: transferState(receipt.status),
    createdAt,
    updatedAt,
    completedAt: receipt.evidence.timestamps.completedAt ?? undefined,
    from: {
      amount: receipt.quote.in.amount ?? receipt.intent.amount.toFixed(2),
      currency: receipt.quote.in.currency,
    },
    to: {
      ...(walletTransfer ? {} : { rail: 'sepa' as const }),
      identifier: receipt.intent.destinationId,
      amount: receipt.quote.out.amount,
      currency: receipt.quote.out.currency,
    },
    failureReason: failureReason(receipt.evidence.stateDetail),
  }
}
