import client from './client'

export function topup({ walletId, amount, currency = 'USDC' }) {
  return client.post('/v1/sandbox/topup', {
    wallet: walletId,
    amount: String(amount),
    currency,
  }).then(r => r.data)
}
