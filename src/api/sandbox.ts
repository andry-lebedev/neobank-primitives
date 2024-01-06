import client from './client'
import type { SandboxTopupInput, SandboxTopupResult } from './transfers'

export function topup({ walletId, amount, currency = 'USDC' }: SandboxTopupInput): Promise<SandboxTopupResult> {
  return client.post('/v1/sandbox/topup', {
    wallet: walletId,
    amount: String(amount),
    currency,
  }).then(r => r.data)
}
