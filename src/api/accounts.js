import client from './client'

export function listAccounts(customerId) {
  return client.get(`/v1/customers/${customerId}/accounts`).then(r => r.data)
}

export function createAccount(customerId, { type = 'sepa', country, currency, targetWallet, label }) {
  const body = { type, country, currency, targetWallet }
  if (label) body.label = label
  return client.post(`/v1/customers/${customerId}/accounts`, body).then(r => r.data)
}
