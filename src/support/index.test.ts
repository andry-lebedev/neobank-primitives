import { describe, expect, it } from 'vitest'
import { APP_SUPPORT, availableRails } from './index'

describe('application support contract', () => {
  it('declares executable runtime and configuration support', () => {
    expect(APP_SUPPORT.runtime.node).toBe('>=22.12.0 <26')
    expect(APP_SUPPORT.runtime.minimumViewportWidth).toBe(320)
    expect(APP_SUPPORT.configuration.required).toEqual(['swipeluxApiKey'])
    expect(APP_SUPPORT.live.apiVersion).toBe('v3')
  })

  it('derives usable rails from customer capability evidence', () => {
    expect(availableRails([
      { id: 'sepa_named', method: 'sepa', availability: 'available', directions: ['payin', 'payout'], eligibility: { eligible: true } },
      { id: 'swift_named', method: 'swift', availability: 'disabled', directions: ['payout'], eligibility: { eligible: true } },
      { id: 'stablecoin_transfers', method: 'stablecoin_transfers', availability: 'available', directions: ['payout'] },
    ])).toEqual([
      { capabilityId: 'sepa_named', method: 'sepa', directions: ['payin', 'payout'] },
      { capabilityId: 'stablecoin_transfers', method: 'stablecoin_transfers', directions: ['payout'] },
    ])
  })
})
