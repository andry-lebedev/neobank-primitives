import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Loader2, Plus, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useApp } from '@/context/useApp'
import { demoStore } from '@/data/demo/store'
import { setCustomerId } from '@/integrations'
import { cn } from '@/lib/utils'
import type { Customer } from '@/data/types'

function nameOf(c: Customer): string {
  return [c.personal?.firstName, c.personal?.lastName].filter(Boolean).join(' ') || c.id
}

// "Log in as" picker. Demo: switch between seeded personas. Live: list the
// merchant's Swipelux customers (GET /v1/customers). Session entry, not auth.
export function CustomerSwitcher({ trigger }: { trigger: ReactNode }) {
  const { source, mode, customerId, reload } = useApp()
  const [open, setOpen] = useState(false)
  const [customers, setCustomers] = useState<Customer[] | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  function onOpenChange(next: boolean) {
    setOpen(next)
    if (next && !customers) {
      setLoading(true)
      source.listCustomers()
        .then(setCustomers)
        .catch(() => setCustomers([]))
        .finally(() => setLoading(false))
    }
  }

  function pick(id: string) {
    if (mode === 'demo') demoStore.setActiveCustomer(id)
    else setCustomerId(id)
    setOpen(false)
    reload()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'demo' ? 'Switch demo customer' : 'Choose a customer'}</DialogTitle>
          <DialogDescription>
            {mode === 'demo'
              ? 'Pick a seeded profile to explore the app as — session entry, not authentication.'
              : 'Customers in your Swipelux workspace. Picking one loads the app as them.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {loading && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading…
            </p>
          )}
          {!loading && customers?.length === 0 && (
            <p className="text-sm text-muted-foreground">No customers yet — onboard one to get started.</p>
          )}
          {customers?.map(c => {
            const active = c.id === customerId
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => pick(c.id)}
                className={cn('flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left', active ? 'border-ring bg-accent' : 'hover:bg-accent')}
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  <UserRound className="size-4 text-muted-foreground" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{nameOf(c)}</span>
                  <span className="block truncate text-xs text-muted-foreground">{c.type ?? 'individual'} · {c.id}</span>
                </span>
                {active && <Check className="size-4 shrink-0 text-success" />}
              </button>
            )
          })}
          <Button variant="outline" className="w-full gap-1" onClick={() => { setOpen(false); navigate('/onboarding') }}>
            <Plus className="size-4" /> Onboard a new customer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
