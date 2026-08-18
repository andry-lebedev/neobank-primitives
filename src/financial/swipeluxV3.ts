import { client } from '@/data/live/client'
import type { SupportedCapability } from '@/support'

export interface QuoteRequest {
  customerId: string
  capabilityId: string
  in: { accountId?: string; amount?: string; currency: string }
  destinationId: string
  out: { amount?: string; currency: string }
  externalId?: string
}

export interface ProviderQuote {
  id: string
  customerId: string
  capabilityId: string
  in: { accountId?: string; amount?: string; currency: string }
  out: { amount?: string; currency: string }
  destinationId?: string
  destination?: { type: 'account' | 'destination'; id: string }
  externalId?: string
  mode?: 'exact_in' | 'exact_out'
  direction?: 'fiat_to_stablecoin' | 'stablecoin_to_fiat' | 'stablecoin_move'
  status: string
  createdAt: string
  expiresAt: string
  rate: string
  fees?: Array<{ beneficiary?: 'developer' | 'service'; amount: string; currency: string }>
  transferId?: string | null
}

export interface ExecuteQuoteRequest {
  quoteId: string
  externalId?: string
  memo?: string
  supportingDocuments?: string[]
}

export interface ProviderTransfer {
  id: string
  quoteId?: string
  state: string
  customerId?: string
  capabilityId?: string
  method?: string
  stateDetail?: unknown
  openTaskIds?: string[]
  references?: Record<string, string | null | undefined>
  timestamps?: Record<string, string | null>
}

export interface FundingRuleRequest {
  trigger: { type: 'funds_received'; accountId: string }
  action: { type: 'transfer'; target: { type: 'account' | 'destination'; id: string } }
  label?: string
  metadata?: Record<string, unknown>
}

export interface FundingRule extends FundingRuleRequest {
  id: string
  status: string
}

export type WebhookEvent =
  | 'customer.created'
  | 'customer.updated'
  | 'customer.archived'
  | 'capability.created'
  | 'capability.status_changed'
  | 'application.status_changed'
  | 'recipient.status_changed'
  | 'destination.status_changed'
  | 'account.created'
  | 'account.status_changed'
  | 'account.details_changed'
  | 'api.deprecation'
  | 'transfer.created'
  | 'transfer.state_changed'

export interface WebhookRequest {
  url: string
  events: WebhookEvent[]
}

export interface WebhookRegistration extends WebhookRequest {
  id: string
  status: string
}

export interface VerificationResult {
  customerId: string
  customerType: string
  previousStatus: string
  status: 'approved' | 'rejected'
  reason: string | null
}

export type RecipientRelationship =
  | 'employee'
  | 'contractor'
  | 'vendor'
  | 'subsidiary'
  | 'merchant'
  | 'customer'
  | 'landlord'
  | 'family'
  | 'other'

export type RecipientRequest =
  | {
      type: 'individual'
      relationship: RecipientRelationship
      firstName: string
      lastName: string
      email?: string
    }
  | {
      type: 'business'
      relationship: RecipientRelationship
      companyName: string
      email?: string
    }

export interface ProviderRecipient {
  id: string
  type: 'individual' | 'business'
  relationship: RecipientRelationship
  firstName?: string
  lastName?: string
  companyName?: string
  email?: string
  status?: string
}

export type DestinationRequest =
  | {
      type: 'sepa'
      currency: string
      details: {
        iban: string
        accountHolderName: string
        country: string
        bic?: string
        bankName?: string
      }
    }
  | {
      type: 'wallet'
      currency: string
      details: { network: string; address: string }
      ownership: { type: 'self_custodied' } | { type: 'custodial'; custodianName: string }
      label?: string
    }

export interface ProviderDestination {
  id: string
  type: DestinationRequest['type']
  currency: string
  details: Record<string, string | undefined>
  ownership?: { type: 'self_custodied' } | { type: 'custodial'; custodianName: string }
  label?: string
  status?: string
}

export interface ProviderAccount {
  id: string
  type: 'wallet' | 'bank'
  origin: 'issued' | 'external'
  status: string
  currency: string
  method?: string
  capabilityId?: string
  details?: Record<string, unknown> | null
  openTaskIds?: string[]
}

export interface FinancialProvider {
  supportedCapabilities(customerId: string): Promise<SupportedCapability[]>
  listAccounts(customerId: string): Promise<ProviderAccount[]>
  listRecipients(customerId: string): Promise<ProviderRecipient[]>
  createRecipient(customerId: string, input: RecipientRequest): Promise<ProviderRecipient>
  listDestinations(customerId: string, recipientId: string): Promise<ProviderDestination[]>
  createDestination(customerId: string, recipientId: string, input: DestinationRequest): Promise<ProviderDestination>
  createQuote(input: QuoteRequest): Promise<ProviderQuote>
  executeQuote(input: ExecuteQuoteRequest): Promise<ProviderTransfer>
  getTransfer(transferId: string): Promise<ProviderTransfer>
  createRule(customerId: string, input: FundingRuleRequest): Promise<FundingRule>
  createWebhook(input: WebhookRequest): Promise<WebhookRegistration>
  simulateVerification(customerId: string, status: 'approved' | 'rejected'): Promise<VerificationResult>
}

export const swipeluxV3: FinancialProvider = {
  supportedCapabilities: customerId =>
    client
      .get(`/v3/customers/${customerId}/capabilities/supported`)
      .then(response => response.data.data as SupportedCapability[]),
  listAccounts: customerId =>
    client
      .get(`/v3/customers/${customerId}/accounts`)
      .then(response => response.data.data as ProviderAccount[]),
  listRecipients: customerId =>
    client
      .get(`/v3/customers/${customerId}/recipients`)
      .then(response => response.data.data as ProviderRecipient[]),
  createRecipient: (customerId, input) =>
    client
      .post(`/v3/customers/${customerId}/recipients`, input)
      .then(response => response.data.data as ProviderRecipient),
  listDestinations: (customerId, recipientId) =>
    client
      .get(`/v3/customers/${customerId}/recipients/${recipientId}/destinations`)
      .then(response => response.data.data as ProviderDestination[]),
  createDestination: (customerId, recipientId, input) =>
    client
      .post(`/v3/customers/${customerId}/recipients/${recipientId}/destinations`, input)
      .then(response => response.data.data as ProviderDestination),
  createQuote: input =>
    client.post('/v3/quotes', input).then(response => response.data.data as ProviderQuote),
  executeQuote: input =>
    client.post('/v3/transfers', input).then(response => response.data.data as ProviderTransfer),
  getTransfer: transferId =>
    client.get(`/v3/transfers/${transferId}`).then(response => response.data.data as ProviderTransfer),
  createRule: (customerId, input) =>
    client.post(`/v3/customers/${customerId}/rules`, input).then(response => response.data.data as FundingRule),
  createWebhook: input =>
    client.post('/v3/webhooks', input).then(response => response.data.data as WebhookRegistration),
  simulateVerification: (customerId, status) =>
    client
      .post(`/v3/sandbox/customers/${customerId}/verification`, { status })
      .then(response => response.data.data as VerificationResult),
}
