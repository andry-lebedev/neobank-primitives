import client from './client'

export function getTransfer(id) {
  return client.get(`/v1/transfers/${id}`).then(r => r.data)
}

export function listTransfers(customerId) {
  return client.get('/v1/transfers', { params: { customerId } }).then(r => r.data)
}

export function createPayoutQuote({ fromWalletId, amount, currency = 'USDC', toAccountId, toCurrency }) {
  return client.post('/v1/payout/quote', {
    from: { id: fromWalletId, amount: Number(amount), currency },
    to: { id: toAccountId, currency: toCurrency },
  }).then(r => r.data)
}

export function createPayout({ fromWalletId, amount, currency = 'USDC', toId, toCurrency }) {
  return client.post('/v1/payout', {
    from: { id: fromWalletId, amount: Number(amount), currency },
    to: { id: toId, currency: toCurrency },
  }).then(r => r.data)
}

export function sandboxTopup({ walletId, amount = '1000', currency = 'USDC' }) {
  return client.post('/v1/sandbox/topup', { wallet: walletId, amount, currency }).then(r => r.data)
}
