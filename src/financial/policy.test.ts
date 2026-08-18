import { describe, expect, it } from 'vitest'
import { createPolicyEngine } from './policy'

describe('financial policy engine', () => {
  const configuration = {
    agents: {
      treasury_bot: {
        allowedCurrencies: ['EUR', 'USDC'],
        allowedRails: ['sepa', 'stablecoin_transfers'],
        approvedDestinations: ['dst_payroll'],
        blockedDestinations: ['dst_sanctioned'],
        allowedApprovers: ['human_cfo'],
        perOperationLimit: 1_000,
        periodLimit: 5_000,
        spentInPeriod: 500,
      },
    },
  }

  it('authorizes a bounded intent and returns auditable agent context', () => {
    const engine = createPolicyEngine(configuration)

    expect(engine.evaluate({
      agentId: 'treasury_bot',
      operation: 'payout',
      amount: 250,
      currency: 'EUR',
      rail: 'sepa',
      destinationId: 'dst_payroll',
    })).toEqual({
      decision: 'allow',
      reasons: [],
      context: {
        agentId: 'treasury_bot',
        operation: 'payout',
        periodSpendBefore: 500,
        periodSpendAfter: 750,
      },
    })
  })

  it('blocks unsupported assets, rails, and explicitly blocked destinations', () => {
    const engine = createPolicyEngine(configuration)

    expect(engine.evaluate({
      agentId: 'treasury_bot',
      operation: 'payout',
      amount: 100,
      currency: 'BTC',
      rail: 'swift',
      destinationId: 'dst_sanctioned',
    })).toMatchObject({
      decision: 'block',
      reasons: ['currency_not_allowed', 'rail_not_allowed', 'destination_blocked'],
    })
  })

  it('escalates limits, period budgets, and new destinations for human review', () => {
    const engine = createPolicyEngine(configuration)

    expect(engine.evaluate({
      agentId: 'treasury_bot',
      operation: 'payout',
      amount: 4_750,
      currency: 'EUR',
      rail: 'sepa',
      destinationId: 'dst_new_vendor',
    })).toMatchObject({
      decision: 'review',
      reasons: ['operation_limit_exceeded', 'period_budget_exceeded', 'destination_approval_required'],
      context: { periodSpendBefore: 500, periodSpendAfter: 5_250 },
    })
  })

  it('records successful spend for later period-budget decisions', () => {
    const engine = createPolicyEngine(configuration)
    const intent = {
      agentId: 'treasury_bot',
      operation: 'payout' as const,
      amount: 250,
      currency: 'EUR',
      rail: 'sepa',
      destinationId: 'dst_payroll',
    }

    engine.record(intent)

    expect(engine.evaluate({ ...intent, amount: 100 }).context).toMatchObject({
      periodSpendBefore: 750,
      periodSpendAfter: 850,
    })
  })

  it('blocks non-finite, zero, and negative amounts', () => {
    const engine = createPolicyEngine(configuration)
    for (const amount of [Number.NaN, Number.POSITIVE_INFINITY, 0, -1]) {
      expect(engine.evaluate({
        agentId: 'treasury_bot',
        operation: 'payout',
        amount,
        currency: 'EUR',
        rail: 'sepa',
        destinationId: 'dst_payroll',
      })).toMatchObject({ decision: 'block', reasons: expect.arrayContaining(['invalid_amount']) })
    }
  })
})
