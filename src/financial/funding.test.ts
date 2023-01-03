import { describe, expect, it, vi } from 'vitest'
import { configureInboundFunding } from './funding'
import type { FundingRule, FundingRuleRequest } from './swipeluxV3'

describe('inbound funding', () => {
  it('activates an automatic credit rule only for an eligible pay-in rail', async () => {
    const provider = {
      supportedCapabilities: vi.fn(async () => [
        { id: 'sepa_named', method: 'sepa', availability: 'available', directions: ['payin' as const], eligibility: { eligible: true } },
      ]),
      createRule: vi.fn(async (_customerId: string, input: FundingRuleRequest): Promise<FundingRule> => ({
        id: 'rul_1',
        status: 'active',
        ...input,
      })),
    }

    const receipt = await configureInboundFunding({
      provider,
      customerId: 'cus_1',
      settlementAccountId: 'acc_settlement',
      targetAccountId: 'acc_wallet',
    })

    expect(receipt).toMatchObject({
      status: 'active',
      capabilityId: 'sepa_named',
      method: 'sepa',
      ruleId: 'rul_1',
      source: 'provider_response',
    })
    expect(provider.createRule).toHaveBeenCalledWith('cus_1', {
      trigger: { type: 'funds_received', accountId: 'acc_settlement' },
      action: { type: 'transfer', target: { type: 'account', id: 'acc_wallet' } },
      label: 'Automatically credit incoming funds',
      metadata: { capabilityId: 'sepa_named' },
    })
  })

  it('refuses to claim inbound support when the customer is not eligible', async () => {
    const provider = {
      supportedCapabilities: vi.fn(async () => [
        { id: 'sepa_named', method: 'sepa', availability: 'available', directions: ['payin' as const], eligibility: { eligible: false } },
      ]),
      createRule: vi.fn(async (_customerId: string, input: FundingRuleRequest): Promise<FundingRule> => ({
        id: 'rul_unexpected', status: 'active', ...input,
      })),
    }

    await expect(configureInboundFunding({
      provider,
      customerId: 'cus_ineligible',
      settlementAccountId: 'acc_settlement',
      targetAccountId: 'acc_wallet',
    })).rejects.toThrow('No eligible inbound funding rail')
    expect(provider.createRule).not.toHaveBeenCalled()
  })
})
