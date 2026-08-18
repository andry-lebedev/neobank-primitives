import type { FinancialProvider, WebhookEvent } from './swipeluxV3'

type WebhookProvider = Pick<FinancialProvider, 'createWebhook'>

export const EVIDENCE_WEBHOOK_EVENTS: WebhookEvent[] = [
  'customer.updated',
  'capability.status_changed',
  'account.details_changed',
  'transfer.state_changed',
]

export interface EvidenceWebhookReceipt {
  status: 'active'
  registrationId: string
  url: string
  events: WebhookEvent[]
  source: 'provider_response'
}

export async function registerEvidenceWebhook(
  provider: WebhookProvider,
  url: string,
): Promise<EvidenceWebhookReceipt> {
  const parsed = new URL(url)
  if (parsed.protocol !== 'https:') throw new Error('Webhook URL must use HTTPS.')
  const registration = await provider.createWebhook({ url, events: [...EVIDENCE_WEBHOOK_EVENTS] })
  if (registration.status !== 'active') {
    throw new Error(`Webhook registration ${registration.id} is ${registration.status}, not active.`)
  }
  return {
    status: 'active',
    registrationId: registration.id,
    url: registration.url,
    events: [...registration.events],
    source: 'provider_response',
  }
}
