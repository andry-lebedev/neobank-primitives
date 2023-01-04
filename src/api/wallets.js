import client from './client'

export function listWallets(customerId) {
  return client.get(`/v1/customers/${customerId}/wallets`).then(r => r.data)
}

export function getWallet(customerId, walletId) {
  return client.get(`/v1/customers/${customerId}/wallets/${walletId}`).then(r => r.data)
}

export function createWallet(customerId, chain = 'polygon') {
  return client.post(`/v1/customers/${customerId}/wallets`, { chain }).then(r => r.data)
}
