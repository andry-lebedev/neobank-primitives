import client from './client'
import type { Recipient, RecipientAccount, RecipientAccountDetails, TransferRail } from '../types'

function compact(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== '')
  )
}

export interface RecipientListResponse {
  recipients?: Recipient[]
}

export interface RecipientAccountListResponse {
  accounts?: RecipientAccount[]
}

export interface CreateRecipientInput {
  type?: 'individual' | 'business'
  relationship?: string
  firstName?: string
  lastName?: string
  companyName?: string
  email?: string
  phone?: string
}

export interface CreateRecipientAccountInput {
  rail?: TransferRail
  details?: RecipientAccountDetails
}

export function listRecipients(customerId: string): Promise<RecipientListResponse> {
  return client.get(`/v1/customers/${customerId}/recipients`).then(r => r.data)
}

export function createRecipient(customerId: string, { type = 'individual', relationship, firstName, lastName, companyName, email, phone }: CreateRecipientInput): Promise<Recipient> {
  const body = compact({ type, relationship, firstName, lastName, companyName, email, phone })
  return client.post(`/v1/customers/${customerId}/recipients`, body).then(r => r.data)
}

export function listRecipientAccounts(customerId: string, recipientId: string): Promise<RecipientAccountListResponse> {
  return client.get(`/v1/customers/${customerId}/recipients/${recipientId}/accounts`).then(r => r.data)
}

export function createRecipientAccount(customerId: string, recipientId: string, { rail = 'sepa', details }: CreateRecipientAccountInput): Promise<RecipientAccount> {
  return client.post(`/v1/customers/${customerId}/recipients/${recipientId}/accounts`, { rail, details }).then(r => r.data)
}
