import client from './client'

export function getCustomer(id) {
  return client.get(`/v1/customers/${id}`).then(r => r.data)
}

export function getBalances(id) {
  return client.get(`/v1/customers/${id}/balances`).then(r => r.data)
}
