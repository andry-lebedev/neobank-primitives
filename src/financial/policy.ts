export interface AgentPolicy {
  allowedCurrencies: string[]
  allowedRails: string[]
  approvedDestinations: string[]
  blockedDestinations: string[]
  allowedApprovers: string[]
  perOperationLimit: number
  periodLimit: number
  spentInPeriod: number
}

export interface PolicyConfiguration {
  agents: Record<string, AgentPolicy>
}

export interface FinancialIntent {
  agentId: string
  operation: 'payout' | 'wallet_transfer' | 'funding'
  amount: number
  currency: string
  rail: string
  destinationId: string
}

export type PolicyDecisionCode = 'allow' | 'review' | 'block'

export interface PolicyDecision {
  decision: PolicyDecisionCode
  reasons: string[]
  context: {
    agentId: string
    operation: FinancialIntent['operation']
    periodSpendBefore: number
    periodSpendAfter: number
  }
}

export interface PolicyEngine {
  evaluate(intent: FinancialIntent): PolicyDecision
  canApprove(agentId: string, approverId: string): boolean
  record(intent: FinancialIntent): void
}

export function createPolicyEngine(configuration: PolicyConfiguration): PolicyEngine {
  const spentByAgent = new Map(
    Object.entries(configuration.agents).map(([agentId, policy]) => [agentId, policy.spentInPeriod]),
  )
  return {
    evaluate(intent) {
      const policy = configuration.agents[intent.agentId]
      if (!policy) throw new Error(`No policy configured for agent ${intent.agentId}.`)
      const spentInPeriod = spentByAgent.get(intent.agentId) ?? 0
      const blockReasons: string[] = []
      const reviewReasons: string[] = []
      if (!Number.isFinite(intent.amount) || intent.amount <= 0) blockReasons.push('invalid_amount')
      if (!policy.allowedCurrencies.includes(intent.currency)) blockReasons.push('currency_not_allowed')
      if (!policy.allowedRails.includes(intent.rail)) blockReasons.push('rail_not_allowed')
      if (policy.blockedDestinations.includes(intent.destinationId)) blockReasons.push('destination_blocked')
      if (intent.amount > policy.perOperationLimit) reviewReasons.push('operation_limit_exceeded')
      if (spentInPeriod + intent.amount > policy.periodLimit) reviewReasons.push('period_budget_exceeded')
      if (!policy.approvedDestinations.includes(intent.destinationId)) reviewReasons.push('destination_approval_required')
      const decision = blockReasons.length > 0 ? 'block' : reviewReasons.length > 0 ? 'review' : 'allow'
      return {
        decision,
        reasons: blockReasons.length > 0 ? blockReasons : reviewReasons,
        context: {
          agentId: intent.agentId,
          operation: intent.operation,
          periodSpendBefore: spentInPeriod,
          periodSpendAfter: spentInPeriod + intent.amount,
        },
      }
    },
    canApprove(agentId, approverId) {
      return configuration.agents[agentId]?.allowedApprovers.includes(approverId) ?? false
    },
    record(intent) {
      const policy = configuration.agents[intent.agentId]
      if (!policy) throw new Error(`No policy configured for agent ${intent.agentId}.`)
      spentByAgent.set(intent.agentId, (spentByAgent.get(intent.agentId) ?? 0) + intent.amount)
    },
  }
}
