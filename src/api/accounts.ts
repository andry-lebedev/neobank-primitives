import client from './client'
import type { Account } from '../types'

export interface AccountListResponse {
  accounts?: Account[]
}

export interface CreateAccountInput {
  type?: 'sepa' | 'swift'
  country?: string
  currency?: string
  targetWallet?: string
  label?: string
}

export function listAccounts(customerId: string): Promise<AccountListResponse> {
  return client.get(`/v1/customers/${customerId}/accounts`).then(r => r.data)
}

export function createAccount(customerId: string, { type = 'sepa', country, currency, targetWallet, label }: CreateAccountInput): Promise<Account> {
  const body: Record<string, unknown> = { type, country, currency, targetWallet }
  if (label) body.label = label
  return client.post(`/v1/customers/${customerId}/accounts`, body).then(r => r.data)
}
