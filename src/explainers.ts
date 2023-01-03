import type { ActionEventType } from './lib/events'
import type { TransferState } from './data/types'
import type { OperationReceipt } from './financial/runtime'

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
      { id: 'customer', title: 'Customer created', detail: 'The returned customer ID and adapter source are recorded in the onboarding receipt.' },
      { id: 'kyc', title: 'KYC status checked', detail: 'Financial provisioning waits until the customer resource reports approved verification.' },
      { id: 'wallet', title: 'Wallet provisioned', detail: 'The returned wallet ID, network, and custody fields are recorded as evidence.' },
      { id: 'account', title: 'Bank account issued', detail: 'The returned account ID and bank details are shown after provisioning succeeds.' },
    ],
  },
  payout: {
    key: 'payout',
    title: 'Behind a bank payout',
    subtitle: 'Policy and provider evidence',
    docsUrl: 'https://docs.swipelux.com',
    steps: [
      { id: 'quote', title: 'Quote locked', detail: 'Rate and expiry are read from the provider quote; no fixed window is assumed.' },
      { id: 'policy', title: 'Policy evaluated', detail: 'Currency, rail, limits, budget, and destination rules return allow, review, or block.' },
      { id: 'submit', title: 'Exact quote submitted', detail: 'Execution sends the provider quote ID and rejects expired or replayed quotes.' },
      { id: 'state', title: 'Provider state observed', detail: 'Completion and timing are shown only when returned by the provider.' },
    ],
  },
  p2p: {
    key: 'p2p',
    title: 'Behind a wallet transfer',
    subtitle: 'Destination, policy, quote, provider state',
    docsUrl: 'https://docs.swipelux.com',
    steps: [
      { id: 'destination', title: 'Wallet destination created', detail: 'A v3 wallet destination ID is created from declared network, address, and ownership.' },
      { id: 'policy', title: 'Policy evaluated', detail: 'New destinations and configured limits can require identified human approval.' },
      { id: 'quote', title: 'Exact quote submitted', detail: 'The stablecoin transfer executes the provider quote ID before its returned expiry.' },
      { id: 'state', title: 'Provider state observed', detail: 'The UI reports the provider state and does not promise a settlement time.' },
    ],
  },
  topup: {
    key: 'topup',
    title: 'Behind a deposit',
    subtitle: 'Fiat in, stablecoin balance out',
    docsUrl: 'https://docs.swipelux.com',
    steps: [
      { id: 'receive', title: 'Deposit created', detail: 'The sandbox or provider returns a transfer ID and initial state.' },
      { id: 'credit', title: 'Provider state observed', detail: 'Activity changes only when a lifecycle event or refreshed provider response reports a new state.' },
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
  'operation.receipt': null,
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

function durationLabel(milliseconds: number): string {
  return milliseconds % 1000 === 0 ? `${milliseconds / 1000}s` : `${milliseconds}ms`
}

export function receiptExplainer(receipt: OperationReceipt): ExplainerFlow {
  const walletTransfer = receipt.intent.rail === 'stablecoin_transfers'
  const observed = receipt.evidence.observedSettlement
  return {
    key: walletTransfer ? 'p2p' : 'payout',
    title: walletTransfer ? 'Behind a wallet transfer' : 'Behind a bank payout',
    subtitle: `Provider response ${receipt.id}`,
    docsUrl: 'https://platform.swipelux.com/api-reference',
    steps: [
      {
        id: 'policy',
        title: 'Policy evaluated',
        detail: `Decision: ${receipt.policy.decision}${receipt.policy.reasons.length ? ` (${receipt.policy.reasons.join(', ')})` : ''}.`,
      },
      {
        id: 'quote',
        title: 'Provider quote locked',
        detail: `${receipt.quote.id} expires at ${receipt.quote.expiresAt}; rate ${receipt.quote.rate}.`,
      },
      {
        id: 'transfer',
        title: 'Transfer accepted',
        detail: `${receipt.evidence.transferId} · ${receipt.evidence.providerState} · capability ${receipt.evidence.capabilityId}.`,
      },
      {
        id: 'settlement',
        title: observed ? 'Settlement observed' : 'Provider state observed',
        detail: observed
          ? `Completed at ${observed.completedAt}; observed duration ${durationLabel(observed.durationMs)}.`
          : `Provider reports ${receipt.evidence.providerState}; no completion timestamp was returned.`,
      },
    ],
  }
}
