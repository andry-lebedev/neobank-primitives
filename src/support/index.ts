export type PaymentDirection = 'payin' | 'payout'

export interface SupportedCapability {
  id: string
  method: string
  availability: string
  directions: PaymentDirection[]
  eligibility?: { eligible: boolean }
}

export interface AvailableRail {
  capabilityId: string
  method: string
  directions: PaymentDirection[]
}

export const APP_SUPPORT = {
  runtime: {
    node: '>=22.12.0 <26',
    minimumViewportWidth: 320,
  },
  configuration: {
    required: ['swipeluxApiKey'],
  },
  live: {
    apiVersion: 'v3',
    defaultBaseUrl: 'https://platform.sbx.swipelux.com',
    capabilityPath: '/v3/customers/{customerId}/capabilities/supported',
  },
  providerEvidence: {
    regulatoryPerimeter: 'https://docs.swipelux.com/knowledge-base/compliance/regulatory-perimeter',
    custody: 'https://docs.swipelux.com/knowledge-base/compliance/custody-and-wallet-controls',
    screening: 'https://docs.swipelux.com/knowledge-base/compliance/screening-and-monitoring',
  },
} as const

export function availableRails(capabilities: SupportedCapability[]): AvailableRail[] {
  return capabilities
    .filter(capability =>
      (capability.availability === 'available' || capability.availability === 'beta')
      && capability.eligibility?.eligible !== false
    )
    .map(({ id, method, directions }) => ({ capabilityId: id, method, directions }))
}
