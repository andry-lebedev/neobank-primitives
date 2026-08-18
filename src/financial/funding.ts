import { availableRails } from '@/support'
import type { FinancialProvider } from './swipeluxV3'

type FundingProvider = Pick<FinancialProvider, 'supportedCapabilities' | 'createRule'>

export interface ConfigureInboundFundingInput {
  provider: FundingProvider
  customerId: string
  settlementAccountId: string
  targetAccountId: string
}

export interface InboundFundingReceipt {
  status: 'active'
  capabilityId: string
  method: string
  directions: ['payin']
  ruleId: string
  source: 'provider_response'
}

export async function configureInboundFunding({
  provider,
  customerId,
  settlementAccountId,
  targetAccountId,
}: ConfigureInboundFundingInput): Promise<InboundFundingReceipt> {
  const rails = availableRails(await provider.supportedCapabilities(customerId))
  const rail = rails.find(candidate => candidate.directions.includes('payin'))
  if (!rail) throw new Error('No eligible inbound funding rail is available for this customer.')

  const rule = await provider.createRule(customerId, {
    trigger: { type: 'funds_received', accountId: settlementAccountId },
    action: { type: 'transfer', target: { type: 'account', id: targetAccountId } },
    label: 'Automatically credit incoming funds',
    metadata: { capabilityId: rail.capabilityId },
  })
  if (rule.status !== 'active') throw new Error(`Inbound funding rule is ${rule.status}, not active.`)

  return {
    status: 'active',
    capabilityId: rail.capabilityId,
    method: rail.method,
    directions: ['payin'],
    ruleId: rule.id,
    source: 'provider_response',
  }
}
