import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useApp } from '@/context/useApp'
import { setCustomerId } from '@/integrations'
import { brand } from '../brand.config'
import type { Customer } from '@/data/types'

// Live mode with a key but no customer yet. Session entry, NOT auth.
export default function LiveEntry() {
  const { source, reload } = useApp()
  const navigate = useNavigate()
  const [id, setId] = useState('')
  const [customers, setCustomers] = useState<Customer[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    source.listCustomers()
      .then(list => { if (!cancelled) setCustomers(list) })
      .catch(() => { if (!cancelled) setCustomers([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [source])

  function pick(customerId: string) {
    setCustomerId(customerId)
    reload()
  }

  const name = (c: Customer) => [c.personal?.firstName, c.personal?.lastName].filter(Boolean).join(' ') || c.id

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-5 px-4 py-10">
      <div className="text-center">
        <img src={brand.logoSrc} alt="" className="mx-auto mb-3 size-12 rounded-xl" />
        <h1 className="text-xl font-extrabold">You're live</h1>
        <p className="text-sm text-muted-foreground">Connected to the Swipelux sandbox. Whose account should we open?</p>
      </div>

      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="text-sm">Your customers</CardTitle>
          <CardDescription>Pick a customer in your workspace to open the app as them.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading customers…
            </p>
          )}
          {!loading && customers?.length === 0 && (
            <p className="text-sm text-muted-foreground">No customers in this workspace yet — onboard your first below.</p>
          )}
          {customers?.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => pick(c.id)}
              className="flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left hover:bg-accent"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                <UserRound className="size-4 text-muted-foreground" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{name(c)}</span>
                <span className="block truncate text-xs text-muted-foreground">{c.type ?? 'individual'} · {c.id}</span>
              </span>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="text-sm">New customer</CardTitle>
          <CardDescription>Run the full onboarding: customer → KYC → wallet → IBAN.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={() => navigate('/onboarding')}>Start onboarding</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="text-sm">Have an id?</CardTitle>
          <CardDescription>Load a specific customer by its Swipelux id.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="cust">Customer id</Label>
          <Input id="cust" placeholder="cus_…" value={id} onChange={e => setId(e.target.value)} />
          <Button variant="outline" className="w-full" disabled={!id.trim()} onClick={() => pick(id.trim())}>
            Continue
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
