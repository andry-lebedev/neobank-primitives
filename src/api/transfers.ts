import client from './client'
import type { Quote, Transfer, TransferLeg } from '../types'

export interface TransferListResponse {
  transfers?: Transfer[]
}

export interface SandboxTopupResult {
  id: string
  type?: Transfer['type']
  state?: Transfer['state']
  from?: TransferLeg
  to?: TransferLeg
  url?: string
  onchain_url?: string
}

export interface CreatePayoutQuoteInput {
  fromWalletId: string
  amount: string | number
  currency?: string
  toAccountId: string
  toCurrency: string
}

export interface CreatePayoutInput {
  fromWalletId: string
  amount: string | number
  currency?: string
  toId: string
  toCurrency: string
}

export interface SandboxTopupInput {
  walletId: string
  amount?: string | number
  currency?: string
}

export function getTransfer(id: string): Promise<Transfer> {
  return client.get(`/v1/transfers/${id}`).then(r => r.data)
}

export function listTransfers(customerId: string): Promise<Transfer[] | TransferListResponse> {
  return client.get('/v1/transfers', { params: { customerId } }).then(r => r.data)
}

export function createPayoutQuote({ fromWalletId, amount, currency = 'USDC', toAccountId, toCurrency }: CreatePayoutQuoteInput): Promise<Quote> {
  return client.post('/v1/payout/quote', {
    from: { id: fromWalletId, amount: Number(amount), currency },
    to: { id: toAccountId, currency: toCurrency },
  }).then(r => r.data)
}

export function createPayout({ fromWalletId, amount, currency = 'USDC', toId, toCurrency }: CreatePayoutInput): Promise<Transfer> {
  return client.post('/v1/payout', {
    from: { id: fromWalletId, amount: Number(amount), currency },
    to: { id: toId, currency: toCurrency },
  }).then(r => r.data)
}

export function sandboxTopup({ walletId, amount = '1000', currency = 'USDC' }: SandboxTopupInput): Promise<SandboxTopupResult> {
  return client.post('/v1/sandbox/topup', { wallet: walletId, amount, currency }).then(r => r.data)
}
