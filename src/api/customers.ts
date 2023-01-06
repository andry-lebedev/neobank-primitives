import client from './client'
import type { Balance, Customer, Wallet } from '../types'

function compactObject(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined && value !== null && value !== '')
  )
}

export interface CustomerBalances {
  customerId?: string
  totalBalance?: Balance
  wallets?: Wallet[]
}

export interface KycSession {
  verificationUrl?: string
}

export interface CustomerAddress {
  country?: string
  streetLine1?: string
  streetLine2?: string
  city?: string
  state?: string
  postalCode?: string
}

export interface CustomerTaxInfo {
  country?: string
  type?: string
  value?: string
}

export interface CreateCustomerInput {
  firstName?: string | null
  middleName?: string | null
  lastName?: string | null
  birthDate?: string | null
  email?: string | null
  phone?: string | null
  address?: CustomerAddress
  taxInfo?: CustomerTaxInfo
  externalId?: string
  metadata?: Record<string, unknown>
}

export function getCustomer(id: string): Promise<Customer> {
  return client.get(`/v1/customers/${id}`).then(r => r.data)
}

export function getBalances(id: string): Promise<CustomerBalances> {
  return client.get(`/v1/customers/${id}/balances`).then(r => r.data)
}

export function initiateKyc(customerId: string, level = 'simplified'): Promise<KycSession> {
  return client.post(`/v1/customers/${customerId}/kyc`, { level }).then(r => r.data)
}

export function createCustomer({
  firstName,
  middleName,
  lastName,
  birthDate,
  email,
  phone,
  address,
  taxInfo,
  externalId,
  metadata,
}: CreateCustomerInput): Promise<Customer> {
  const body: Record<string, unknown> = {
    type: 'individual',
    personal: compactObject({ firstName, middleName, lastName, birthDate, email, phone }),
  }

  if (externalId) body.externalId = externalId
  if (metadata) body.metadata = metadata

  if (address && ['country', 'streetLine1', 'streetLine2', 'city', 'state', 'postalCode'].every(k => address[k as keyof CustomerAddress])) {
    body.address = address
  }

  if (taxInfo && taxInfo.country && taxInfo.type && taxInfo.value) {
    body.taxInfo = taxInfo
  }

  return client.post('/v2/customers', body).then(r => r.data)
}
