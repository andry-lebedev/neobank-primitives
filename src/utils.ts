import type { VerificationStatus } from './types'

export function formatBalance(amount: string | number): string {
  const num = parseFloat(String(amount))
  if (isNaN(num)) return '0.00'
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function formatAmount(amount: string | number | undefined, currency?: string): string {
  const num = parseFloat(String(amount))
  const formatted = isNaN(num)
    ? '0.00'
    : num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return currency ? `${formatted} ${currency}` : formatted
}

export function truncateAddress(address: string | null | undefined, chars = 4): string {
  if (!address) return ''
  if (address.length <= chars * 2 + 3) return address
  return `${address.slice(0, chars + 2)}…${address.slice(-chars)}`
}

export function canSend(verificationStatus?: VerificationStatus): boolean {
  return verificationStatus !== 'rejected'
}

// Can the customer start/restart identity verification right now?
// pending = in review (wait), approved = done. Everything else can initiate.
export function needsKyc(verificationStatus?: VerificationStatus): boolean {
  return verificationStatus !== 'pending' && verificationStatus !== 'approved'
}

export function kycBanner(verificationStatus?: VerificationStatus): string | null {
  switch (verificationStatus) {
    case 'approved': return null
    case 'pending': return 'Verification under review — some limits may apply.'
    case 'rejected': return 'Verification failed. Sending is disabled — contact support.'
    default: return 'Verify your identity to lift limits.'
  }
}

export function relativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function groupByDate<T extends { createdAt: string }>(transfers: T[]): Record<string, T[]> {
  const now = new Date()
  const todayStr = now.toDateString()
  const yesterdayStr = new Date(now.getTime() - 86400000).toDateString()
  const groups: Record<string, T[]> = {}
  for (const t of [...transfers].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())) {
    const d = new Date(t.createdAt)
    let label: string
    if (d.toDateString() === todayStr) label = 'Today'
    else if (d.toDateString() === yesterdayStr) label = 'Yesterday'
    else label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    if (!groups[label]) groups[label] = []
    groups[label].push(t)
  }
  return groups
}

export interface KycLabel {
  label: string
  color: string
  description: string
}

export function getKycLabel(status?: string): KycLabel {
  const map: Record<string, KycLabel> = {
    not_started: { label: 'Not started', color: 'gray', description: 'Identity verification has not been initiated.' },
    pending: { label: 'Under review', color: 'amber', description: 'Your identity is being reviewed. This usually takes 1–2 business days.' },
    approved: { label: 'Verified', color: 'green', description: 'Your identity has been verified.' },
    rejected: { label: 'Action required', color: 'red', description: 'We could not verify your identity. Please contact support.' },
  }
  return (status ? map[status] : undefined) ?? map.not_started
}

export function getVirtualAccount<T extends { source?: string; type?: string }>(accounts: T[]): T | null {
  return accounts.find(a => a.source === 'virtual' && a.type === 'sepa')
    ?? accounts.find(a => a.source === 'virtual' && a.type === 'swift')
    ?? accounts.find(a => a.source === 'virtual')
    ?? null
}
