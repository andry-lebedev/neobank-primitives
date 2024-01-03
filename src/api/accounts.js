import client from './client'

export function listAccounts(customerId) {
  return client.get(`/v1/customers/${customerId}/accounts`).then(r => r.data)
}
