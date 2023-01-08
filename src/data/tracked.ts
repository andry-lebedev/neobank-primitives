import { emitAction } from '@/lib/events'
import type { DataSource } from './types'

// Wraps any DataSource and emits action events after successful writes.
// This is the ONE place demo and live behavior meet — the explainer and
// integrations see identical events in both modes.
export function withTracking(source: DataSource): DataSource {
  return {
    ...source,

    async createCustomer(input) {
      const customer = await source.createCustomer(input)
      emitAction({ type: 'customer.created', customer })
      return customer
    },

    async initiateKyc(customerId) {
      const session = await source.initiateKyc(customerId)
      emitAction({ type: 'kyc.started' })
      return session
    },

    async createWallet(customerId, chain) {
      const wallet = await source.createWallet(customerId, chain)
      emitAction({ type: 'wallet.provisioned', wallet })
      return wallet
    },

    async createAccount(customerId, input) {
      const account = await source.createAccount(customerId, input)
      emitAction({ type: 'account.issued', account })
      return account
    },

    async createPayoutQuote(input) {
      const quote = await source.createPayoutQuote(input)
      emitAction({ type: 'payout.quoted', quote })
      return quote
    },

    async createPayout(input) {
      const transfer = await source.createPayout(input)
      emitAction({ type: transfer.type === 'wallet_to_wallet' ? 'p2p.created' : 'payout.created', transfer })
      return transfer
    },

    async topup(input) {
      const transfer = await source.topup(input)
      emitAction({ type: 'topup.created', transfer })
      return transfer
    },
  }
}
