import { availableRails } from '@/support'
import type { FinancialIntent, PolicyDecision, PolicyEngine } from './policy'
import type { FinancialProvider, ProviderQuote, ProviderTransfer } from './swipeluxV3'
import { createMemoryJournal, type FinancialJournal } from './journal'
import { createOperationReceipt, type ReceiptContext } from './runtimeReceipt'

export interface QuoteCommand {
  customerId: string
  agentId: string
  amount: number
  currency: string
  outCurrency: string
  rail: string
  sourceAccountId: string
  destinationId: string
  externalId?: string
}

export interface ReadyQuoteOutcome {
  status: 'ready'
  decision: PolicyDecision
  quote: ProviderQuote
  approval?: { requestId: string; approverId: string }
}

export interface ApprovalRequiredOutcome {
  status: 'approval_required'
  decision: PolicyDecision
  requestId: string
  quote?: undefined
}

export interface BlockedQuoteOutcome {
  status: 'blocked'
  decision: PolicyDecision
  quote?: undefined
}

export type QuoteOutcome = ReadyQuoteOutcome | ApprovalRequiredOutcome | BlockedQuoteOutcome

export interface ExecuteOptions {
  memo?: string
  supportingDocuments?: string[]
}

export interface OperationReceipt {
  id: string
  status: string
  intent: QuoteCommand
  quote: ProviderQuote
  policy: PolicyDecision
  approval?: { requestId: string; approverId: string }
  evidence: {
    source: 'provider_response'
    capabilityId: string
    transferId: string
    providerState: string
    stateDetail?: unknown
    openTaskIds: string[]
    references: Record<string, string | null | undefined>
    timestamps: Record<string, string | null>
    observedSettlement?: {
      startedAt: string
      completedAt: string
      durationMs: number
    }
  }
}

export interface AuditEvent {
  type: 'policy.blocked' | 'approval.requested' | 'approval.granted' | 'quote.created' | 'transfer.created' | 'transfer.updated'
  resourceId: string
  agentId: string
  occurredAt: string
  policy: PolicyDecision
  approverId?: string
}

export interface FinancialRuntime {
  quote(command: QuoteCommand): Promise<QuoteOutcome>
  approve(requestId: string, approverId: string): Promise<ReadyQuoteOutcome>
  execute(quoteId: string, options?: ExecuteOptions): Promise<OperationReceipt>
  refresh(transferId: string): Promise<OperationReceipt>
  audit(): AuditEvent[]
}

export interface FinancialRuntimeDependencies {
  provider: FinancialProvider
  policy: PolicyEngine
  now?: () => Date
  createId?: () => string
  journal?: FinancialJournal
  onReceipt?: (receipt: OperationReceipt) => void
}

interface LockedQuote extends ReceiptContext {
  executionState: 'ready' | 'executing' | 'executed'
}

function toIntent(command: QuoteCommand): FinancialIntent {
  return {
    agentId: command.agentId,
    operation: command.rail === 'stablecoin_transfers' ? 'wallet_transfer' : 'payout',
    amount: command.amount,
    currency: command.currency,
    rail: command.rail,
    destinationId: command.destinationId,
  }
}

export function createFinancialRuntime({
  provider,
  policy,
  now = () => new Date(),
  createId = () => `apr_${Date.now().toString(36)}`,
  journal: providedJournal,
  onReceipt,
}: FinancialRuntimeDependencies): FinancialRuntime {
  const journal = providedJournal ?? createMemoryJournal()
  const pendingApprovals = new Map<string, { command: QuoteCommand; decision: PolicyDecision; capabilityId: string }>()
  const lockedQuotes = new Map<string, LockedQuote>()
  const publishReceipt = (receipt: OperationReceipt) => {
    try {
      onReceipt?.(structuredClone(receipt))
    } catch {
      // Consumer rendering or analytics must not turn a provider-accepted
      // transfer into an apparent execution failure that can be retried.
    }
  }

  const lockQuote = async (
    command: QuoteCommand,
    decision: PolicyDecision,
    capabilityId: string,
    approval?: { requestId: string; approverId: string },
  ): Promise<ReadyQuoteOutcome> => {
    const quote = await provider.createQuote({
      customerId: command.customerId,
      capabilityId,
      in: { accountId: command.sourceAccountId, amount: command.amount.toFixed(2), currency: command.currency },
      destinationId: command.destinationId,
      out: { currency: command.outCurrency },
      externalId: command.externalId,
    })
    const expiresAt = new Date(quote.expiresAt).getTime()
    if (
      (quote.status !== 'active' && quote.status !== 'ready')
      || quote.customerId !== command.customerId
      || quote.capabilityId !== capabilityId
      || !Number.isFinite(expiresAt)
      || expiresAt <= now().getTime()
    ) {
      throw new Error(`Provider quote ${quote.id} is not executable.`)
    }
    journal.appendAudit({
      type: 'quote.created',
      resourceId: quote.id,
      agentId: command.agentId,
      occurredAt: now().toISOString(),
      policy: decision,
    })
    lockedQuotes.set(quote.id, {
      command,
      decision,
      capabilityId,
      quote,
      ...(approval ? { approval } : {}),
      executionState: 'ready',
    })
    return { status: 'ready', decision, quote, ...(approval ? { approval } : {}) }
  }

  return {
    async quote(command) {
      const capabilities = availableRails(await provider.supportedCapabilities(command.customerId))
      const capability = capabilities.find(item => item.method === command.rail && item.directions.includes('payout'))
      if (!capability) {
        const outcome: BlockedQuoteOutcome = {
          status: 'blocked',
          decision: {
            decision: 'block',
            reasons: ['capability_not_available'],
            context: {
              agentId: command.agentId,
              operation: command.rail === 'stablecoin_transfers' ? 'wallet_transfer' : 'payout',
              periodSpendBefore: 0,
              periodSpendAfter: 0,
            },
          },
        }
        journal.appendAudit({
          type: 'policy.blocked',
          resourceId: command.externalId ?? command.destinationId,
          agentId: command.agentId,
          occurredAt: now().toISOString(),
          policy: outcome.decision,
        })
        return outcome
      }

      const decision = policy.evaluate(toIntent(command))
      if (decision.decision === 'block') {
        journal.appendAudit({
          type: 'policy.blocked',
          resourceId: command.externalId ?? command.destinationId,
          agentId: command.agentId,
          occurredAt: now().toISOString(),
          policy: decision,
        })
        return { status: 'blocked', decision }
      }
      if (decision.decision === 'review') {
        const requestId = createId()
        pendingApprovals.set(requestId, { command, decision, capabilityId: capability.capabilityId })
        journal.appendAudit({
          type: 'approval.requested',
          resourceId: requestId,
          agentId: command.agentId,
          occurredAt: now().toISOString(),
          policy: decision,
        })
        return { status: 'approval_required', decision, requestId }
      }
      return lockQuote(command, decision, capability.capabilityId)
    },
    async approve(requestId, approverId) {
      const pending = pendingApprovals.get(requestId)
      if (!pending) throw new Error(`Approval request ${requestId} was not found.`)
      if (!policy.canApprove(pending.command.agentId, approverId)) {
        throw new Error(`${approverId} is not authorized to approve operations for ${pending.command.agentId}.`)
      }
      pendingApprovals.delete(requestId)
      journal.appendAudit({
        type: 'approval.granted',
        resourceId: requestId,
        agentId: pending.command.agentId,
        approverId,
        occurredAt: now().toISOString(),
        policy: pending.decision,
      })
      return lockQuote(
        pending.command,
        pending.decision,
        pending.capabilityId,
        { requestId, approverId },
      )
    },
    async execute(quoteId, options = {}) {
      const locked = lockedQuotes.get(quoteId)
      if (!locked) throw new Error(`Locked quote ${quoteId} was not found.`)
      if (locked.executionState !== 'ready') throw new Error(`Quote ${quoteId} has already been executed.`)
      const expiresAt = new Date(locked.quote.expiresAt)
      if (!Number.isFinite(expiresAt.getTime()) || now().getTime() >= expiresAt.getTime()) {
        throw new Error(`Quote ${quoteId} has expired.`)
      }

      locked.executionState = 'executing'
      let transfer: ProviderTransfer
      try {
        transfer = await provider.executeQuote({
          quoteId,
          ...(locked.command.externalId ? { externalId: locked.command.externalId } : {}),
          ...(options.memo ? { memo: options.memo } : {}),
          ...(options.supportingDocuments ? { supportingDocuments: [...options.supportingDocuments] } : {}),
        })
      } catch (error) {
        locked.executionState = 'ready'
        throw error
      }
      locked.executionState = 'executed'
      policy.record(toIntent(locked.command))
      const receipt = createOperationReceipt(locked, transfer)
      journal.saveReceipt(receipt)
      journal.appendAudit({
        type: 'transfer.created',
        resourceId: transfer.id,
        agentId: locked.command.agentId,
        occurredAt: now().toISOString(),
        policy: locked.decision,
      })
      publishReceipt(receipt)
      return receipt
    },
    async refresh(transferId) {
      const current = journal.getReceipt(transferId)
      if (!current) throw new Error(`Transfer receipt ${transferId} was not found.`)
      const transfer = await provider.getTransfer(transferId)
      if (transfer.id !== transferId) {
        throw new Error(`Provider returned transfer ${transfer.id} while refreshing ${transferId}.`)
      }
      const locked: LockedQuote = {
        command: current.intent,
        decision: current.policy,
        capabilityId: current.evidence.capabilityId,
        quote: current.quote,
        approval: current.approval,
        executionState: 'executed',
      }
      const receipt = createOperationReceipt(locked, transfer)
      journal.saveReceipt(receipt)
      journal.appendAudit({
        type: 'transfer.updated',
        resourceId: transfer.id,
        agentId: current.intent.agentId,
        occurredAt: now().toISOString(),
        policy: current.policy,
      })
      publishReceipt(receipt)
      return receipt
    },
    audit: () => journal.listAudit(),
  }
}
