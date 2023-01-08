import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { StatusBadge } from '@/components/StatusBadge'
import { TransactionRow } from '@/components/TransactionRow'
import { useApp } from '@/context/useApp'
import { formatMoney, transferTitle } from '@/lib/format'
import { brand } from '../brand.config'
import type { Transfer } from '@/data/types'

export default function Activity() {
  const { transferLog } = useApp()
  const [selected, setSelected] = useState<Transfer | null>(null)

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-extrabold tracking-tight">Activity</h1>

      <Card>
        <CardContent className="py-2">
          {transferLog.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No transfers yet.</p>
          ) : (
            transferLog.map(t => <TransactionRow key={t.id} transfer={t} onClick={() => setSelected(t)} />)
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(selected)} onOpenChange={open => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-md">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between gap-2">
                  {transferTitle(selected)} <StatusBadge state={selected.state} />
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-2 text-sm">
                {selected.from && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">From</span>
                    <span className="text-right">
                      {selected.from.identifier ?? 'Your wallet'}
                      {selected.from.amount != null && <> · {formatMoney(selected.from.amount, selected.from.currency ?? brand.currency)}</>}
                    </span>
                  </div>
                )}
                {selected.to && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">To</span>
                    <span className="text-right">
                      {selected.to.identifier ?? 'Your balance'}
                      {selected.to.amount != null && <> · {formatMoney(selected.to.amount, selected.to.currency ?? brand.currency)}</>}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{new Date(selected.createdAt).toLocaleString(brand.locale)}</span>
                </div>
                {selected.failureReason && (
                  <p className="rounded-md bg-destructive/10 p-2 text-destructive">{selected.failureReason}</p>
                )}
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transfer id</span>
                  <span className="font-mono text-xs">{selected.id}</span>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
