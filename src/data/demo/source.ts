import { demoStore } from './store'
import type { DataSource } from '../types'

// Async face over the synchronous demo store. The small latency makes
// loading states visible so the demo feels like a real network app.
export function createDemoSource({ latencyMs = 300 }: { latencyMs?: number } = {}): DataSource {
  const later = <T>(fn: () => T): Promise<T> =>
    new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          resolve(fn())
        } catch (err) {
          reject(err)
        }
      }, latencyMs)
    })

  return {
    listCustomers: () => later(() => demoStore.listCustomers()),
    getCustomer: id => later(() => demoStore.getCustomer(id)),
    createCustomer: input => later(() => demoStore.createCustomer(input)),
    initiateKyc: customerId => later(() => demoStore.initiateKyc(customerId)),
    listWallets: customerId => later(() => demoStore.listWallets(customerId)),
    getWallet: (customerId, walletId) => later(() => demoStore.getWallet(customerId, walletId)),
    createWallet: (customerId, chain) => later(() => demoStore.createWallet(customerId, chain)),
    listAccounts: customerId => later(() => demoStore.listAccounts(customerId)),
    createAccount: (customerId, input) => later(() => demoStore.createAccount(customerId, input)),
    listRecipients: customerId => later(() => demoStore.listRecipients(customerId)),
    createRecipient: (customerId, input) => later(() => demoStore.createRecipient(customerId, input)),
    listRecipientAccounts: (customerId, recipientId) => later(() => demoStore.listRecipientAccounts(customerId, recipientId)),
    createRecipientAccount: (customerId, recipientId, input) => later(() => demoStore.createRecipientAccount(customerId, recipientId, input)),
    listTransfers: customerId => later(() => demoStore.listTransfers(customerId)),
    getTransfer: id => later(() => demoStore.getTransfer(id)),
    createPayoutQuote: input => later(() => demoStore.createPayoutQuote(input)),
    createPayout: input => later(() => demoStore.createPayout(input)),
    topup: input => later(() => demoStore.topup(input)),
  }
}

export const demoSource: DataSource = createDemoSource()
