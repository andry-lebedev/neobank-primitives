import { useState, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { setApiKey, validateApiKey } from '@/data/mode'
import { clearCustomerId, setCustomerId } from '@/integrations'

export function GoLiveDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [key, setKey] = useState('')
  const [customerId, setCustomer] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function connect() {
    setBusy(true); setError(null)
    const ok = await validateApiKey(key.trim())
    setBusy(false)
    if (!ok) {
      setError('That key was rejected by the Swipelux sandbox. Check it and try again.')
      return
    }
    const id = customerId.trim()
    if (id) setCustomerId(id)
    else clearCustomerId() // blank → drop any prior key's customer; pick one after connecting
    setApiKey(key.trim()) // emits mode.changed → app reloads in live mode
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Go live</DialogTitle>
          <DialogDescription>
            Paste your Swipelux sandbox API key — the whole app switches to live data. No rebuild, no config files.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="api-key">API key</Label>
            <Input id="api-key" type="password" placeholder="sk_…" value={key} onChange={e => setKey(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="customer-id">Customer id (optional)</Label>
            <Input id="customer-id" placeholder="Load an existing customer, or onboard a new one after connecting" value={customerId} onChange={e => setCustomer(e.target.value)} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button className="w-full" disabled={!key.trim() || busy} onClick={connect}>
            {busy && <Loader2 className="size-4 animate-spin" />} Connect
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
