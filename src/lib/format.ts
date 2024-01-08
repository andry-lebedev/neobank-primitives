import { brand } from '../brand.config'
import type { Transfer } from '@/data/types'

const FIAT = new Set(['EUR', 'USD', 'GBP', 'CHF', 'PLN', 'CZK'])

export function formatMoney(amount: string | number, currency: string = brand.currency): string {
  const value = typeof amount === 'string' ? Number(amount) : amount
  if (Number.isNaN(value)) return `${amount} ${currency}`
  if (FIAT.has(currency)) {
    return new Intl.NumberFormat(brand.locale, { style: 'currency', currency }).format(value)
  }
  // Crypto/stablecoin: plain number + symbol suffix
  return `${new Intl.NumberFormat(brand.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)} ${currency}`
}

export function formatDate(iso: string): string {
  const parts = new Intl.DateTimeFormat(brand.locale, { month: 'short', day: 'numeric' }).formatToParts(new Date(iso))
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value
  return [month, day].filter(Boolean).join(' ')
}

export function transferTitle(t: Transfer): string {
  switch (t.type) {
    case 'offramp': return 'Bank payout'
    case 'onramp': return 'Deposit'
    case 'wallet_to_wallet': return 'Wallet transfer'
  }
}
