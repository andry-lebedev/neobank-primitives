import { describe, it, expect } from 'vitest'
import { explainers, EVENT_FLOW, stepsDone, type FlowKey } from './explainers'
import type { ActionEventType } from './lib/events'

const ALL_EVENTS: ActionEventType[] = [
  'customer.created', 'kyc.started', 'kyc.approved', 'wallet.provisioned',
  'account.issued', 'payout.quoted', 'payout.created', 'p2p.created',
  'topup.created', 'transfer.updated', 'mode.changed',
]

describe('explainers', () => {
  it('every action event maps to a flow or an explicit null', () => {
    for (const type of ALL_EVENTS) {
      expect(EVENT_FLOW[type], `missing mapping for ${type}`).not.toBeUndefined()
    }
  })

  it('every mapped flow has content with at least 2 steps and a docs link', () => {
    const flows = new Set(Object.values(EVENT_FLOW).filter((f): f is FlowKey => f !== null))
    for (const key of flows) {
      const flow = explainers[key]
      expect(flow.steps.length).toBeGreaterThanOrEqual(2)
      expect(flow.docsUrl).toMatch(/^https:\/\//)
    }
  })

  it('every explainer is reachable from an action event', () => {
    const flows = new Set(Object.values(EVENT_FLOW).filter((f): f is FlowKey => f !== null))
    for (const key of Object.keys(explainers)) {
      expect(flows.has(key as FlowKey), `${key} is not mapped by any action event`).toBe(true)
    }
  })

  it('stepsDone tracks transfer lifecycle', () => {
    expect(stepsDone('payout', 'pending')).toBe(2)
    expect(stepsDone('payout', 'in_progress')).toBe(3)
    expect(stepsDone('payout', 'completed')).toBe(4)
    expect(stepsDone('payout', 'failed')).toBe(-1)
  })
})
