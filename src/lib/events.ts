import type { Account, AppMode, Customer, Quote, Transfer, Wallet } from '@/data/types'

// Typed app-wide action events. Emitted by the data layer (src/data/tracked.ts
// and demo-store timers); consumed by the explainer drawer and integrations.
export type ActionEvent =
  | { type: 'customer.created'; customer: Customer }
  | { type: 'kyc.started' }
  | { type: 'kyc.approved' }
  | { type: 'wallet.provisioned'; wallet: Wallet }
  | { type: 'account.issued'; account: Account }
  | { type: 'payout.quoted'; quote: Quote }
  | { type: 'payout.created'; transfer: Transfer }
  | { type: 'p2p.created'; transfer: Transfer }
  | { type: 'topup.created'; transfer: Transfer }
  | { type: 'transfer.updated'; transfer: Transfer }
  | { type: 'mode.changed'; mode: AppMode }

export type ActionEventType = ActionEvent['type']

type Listener = (event: ActionEvent) => void

const listeners = new Set<Listener>()

export function onAction(fn: Listener): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function emitAction(event: ActionEvent): void {
  listeners.forEach(fn => {
    try {
      fn(event)
    } catch (err) {
      console.error('[events] listener failed', err)
    }
  })
}
