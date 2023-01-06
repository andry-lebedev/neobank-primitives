import client from './client'
import type { Wallet } from '../types'

export interface WalletListResponse {
  wallets?: Wallet[]
}

export function listWallets(customerId: string): Promise<WalletListResponse> {
  return client.get(`/v1/customers/${customerId}/wallets`).then(r => r.data)
}

export function getWallet(customerId: string, walletId: string): Promise<Wallet> {
  return client.get(`/v1/customers/${customerId}/wallets/${walletId}`).then(r => r.data)
}

export function createWallet(customerId: string, chain = 'polygon'): Promise<Wallet> {
  return client.post(`/v1/customers/${customerId}/wallets`, { chain }).then(r => r.data)
}
