import { ArrowDownLeft, ArrowUpRight, Repeat } from 'lucide-react'
import { formatDate, formatMoney, transferTitle } from '@/lib/format'
import { StatusBadge } from './StatusBadge'
import { cn } from '@/lib/utils'
import type { Transfer } from '@/data/types'

export function TransactionRow({ transfer, onClick }: { transfer: Transfer; onClick?: () => void }) {
  const incoming = transfer.type === 'onramp'
  const leg = incoming ? transfer.to : transfer.from
  const counterparty = (incoming ? transfer.from?.identifier : transfer.to?.identifier) ?? transferTitle(transfer)
  const amount = leg?.amount != null ? formatMoney(leg.amount, leg.currency ?? 'EUR') : ''
  const Icon = transfer.type === 'wallet_to_wallet' ? Repeat : incoming ? ArrowDownLeft : ArrowUpRight

  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left hover:bg-accent">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
        <Icon className="size-4 text-muted-foreground" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{transferTitle(transfer)}</span>
        <span className="block truncate text-xs text-muted-foreground">{counterparty} · {formatDate(transfer.createdAt)}</span>
      </span>
      <span className="flex flex-col items-end gap-1">
        <span className={cn('text-sm font-semibold tabular-nums', incoming ? 'text-success' : 'text-foreground')}>
          {incoming ? '+' : '−'}{amount}
        </span>
        {transfer.state !== 'completed' && <StatusBadge state={transfer.state} />}
      </span>
    </button>
  )
}
