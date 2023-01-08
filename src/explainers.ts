import type { ActionEventType } from './lib/events'
import type { TransferState } from './data/types'

// "How it works" narration — product-level, per flow. Tailorable: a client AI
// may rewrite titles/details to match the client's own wording. Keyed off
// action events so it works identically in demo and live mode.

export type FlowKey = 'onboarding' | 'payout' | 'p2p' | 'topup'

export interface ExplainerStep {
  id: string
  title: string
  detail: string
}

export interface ExplainerFlow {
  key: FlowKey
  title: string
  subtitle: string
  docsUrl: string
  steps: ExplainerStep[]
}

export const explainers: Record<FlowKey, ExplainerFlow> = {
  onboarding: {
    key: 'onboarding',
    title: 'Behind onboarding',
    subtitle: 'Customer → KYC → wallet → bank account',
    docsUrl: 'https://docs.swipelux.com',
    steps: [
      { id: 'customer', title: 'Customer created', detail: 'A compliance-ready customer record — Swipelux is the regulated entity, you are not.' },
      { id: 'kyc', title: 'KYC verified', detail: 'Identity verification runs through Swipelux; no KYC vendor contract needed on your side.' },
      { id: 'wallet', title: 'Wallet provisioned', detail: 'A stablecoin wallet on Polygon, custodied by Swipelux.' },
      { id: 'account', title: 'Bank account issued', detail: 'A named virtual IBAN that tops up the wallet automatically when money arrives.' },
    ],
  },
  payout: {
    key: 'payout',
    title: 'Behind a bank payout',
    subtitle: '4 steps behind one API call',
    docsUrl: 'https://docs.swipelux.com',
    steps: [
      { id: 'quote', title: 'Quote locked', detail: 'Stablecoin→fiat rate locked for 5 minutes before you commit — you never hold FX risk.' },
      { id: 'screen', title: 'Compliance checked', detail: 'Recipient and transaction run through compliance checks automatically before funds move.' },
      { id: 'convert', title: 'Stablecoin converted', detail: 'USDC sold, fiat settled on the Swipelux ledger.' },
      { id: 'send', title: 'Bank payout sent', detail: 'Funds leave via SEPA/SWIFT — typically same day.' },
    ],
  },
  p2p: {
    key: 'p2p',
    title: 'Behind a wallet transfer',
    subtitle: 'Instant, on-ledger',
    docsUrl: 'https://docs.swipelux.com',
    steps: [
      { id: 'screen', title: 'Compliance checked', detail: 'Both sides run through compliance checks automatically before funds move.' },
      { id: 'settle', title: 'Settled instantly', detail: 'Funds move wallet-to-wallet on the Swipelux ledger in seconds, 24/7 — no banking hours.' },
    ],
  },
  topup: {
    key: 'topup',
    title: 'Behind a deposit',
    subtitle: 'Fiat in, stablecoin balance out',
    docsUrl: 'https://docs.swipelux.com',
    steps: [
      { id: 'receive', title: 'Funds received', detail: 'Money arrives at the virtual IBAN (or on-chain to the wallet address).' },
      { id: 'credit', title: 'Balance credited', detail: 'Converted and credited to the customer wallet automatically — webhook fired to your backend.' },
    ],
  },
}

// Which flow narrates which event. null = event drives no narration directly
// (transfer.updated advances the already-open flow; mode.changed is chrome).
export const EVENT_FLOW: Record<ActionEventType, FlowKey | null> = {
  'customer.created': 'onboarding',
  'kyc.started': 'onboarding',
  'kyc.approved': 'onboarding',
  'wallet.provisioned': 'onboarding',
  'account.issued': 'onboarding',
  'payout.quoted': 'payout',
  'payout.created': 'payout',
  'p2p.created': 'p2p',
  'topup.created': 'topup',
  'transfer.updated': null,
  'mode.changed': null,
}

// How many steps of a flow are done for a given transfer state.
// -1 signals failure (drawer renders the active step in red).
export function stepsDone(flow: FlowKey, state: TransferState): number {
  if (state === 'failed') return -1
  const total = explainers[flow].steps.length
  if (state === 'completed') return total
  if (state === 'in_progress') return total - 1
  return total - 2 // pending / awaiting_funds: first checks done, conversion in flight
}
