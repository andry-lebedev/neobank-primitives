import { Link, useNavigate } from 'react-router-dom'
import { ArrowDownToLine, ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { CopyField } from '@/components/CopyField'
import { TransactionRow } from '@/components/TransactionRow'
import { useApp } from '@/context/useApp'
import { formatMoney } from '@/lib/format'
import { brand } from '../brand.config'

export default function Home() {
  const { customer, wallet, accounts, transferLog, loading, error } = useApp()
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }
  if (error) return <p className="text-sm text-destructive">{error}</p>

  const balances = wallet?.balances ?? []
  const primary = balances.find(b => b.currency === brand.currency) ?? balances[0]
  const secondary = balances.filter(b => b !== primary)
  const account = accounts.find(a => a.source === 'virtual') ?? accounts[0]
  const recent = transferLog.slice(0, 5)

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-extrabold tracking-tight">
        {brand.greeting}, {customer?.personal?.firstName ?? 'there'}
      </h1>

      <div className="text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total balance</p>
        <p className="text-4xl font-extrabold tracking-tight">
          {primary ? formatMoney(primary.amount, primary.currency) : formatMoney(0)}
        </p>
        {secondary.length > 0 && (
          <p className="mt-1 text-sm text-muted-foreground">
            {secondary.map(b => formatMoney(b.amount, b.currency)).join(' · ')}
          </p>
        )}
      </div>

      <div className="flex gap-3">
        {brand.features.send && (
          <Button asChild className="flex-1 gap-1.5">
            <Link to="/send"><ArrowUpRight className="size-4" /> Send</Link>
          </Button>
        )}
        {brand.features.addMoney && (
          <Button asChild variant="outline" className="flex-1 gap-1.5">
            <Link to="/add-money"><ArrowDownToLine className="size-4" /> Add money</Link>
          </Button>
        )}
      </div>

      {account?.iban && (
        <Card className="py-0">
          <CardContent className="px-4 py-1">
            <CopyField label={account.label ?? 'Your IBAN'} value={account.iban} />
          </CardContent>
        </Card>
      )}

      <Card className="py-0">
        <CardContent className="px-2 py-2">
          <div className="flex items-center justify-between px-2 pt-1">
            <h2 className="text-sm font-bold">Recent activity</h2>
            {brand.features.activity && (
              <Link to="/activity" className="text-xs font-semibold text-muted-foreground hover:text-foreground">View all</Link>
            )}
          </div>
          {recent.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            recent.map(t => (
              <TransactionRow key={t.id} transfer={t} onClick={() => brand.features.activity && navigate('/activity')} />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
