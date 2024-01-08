import { useState } from 'react'
import { Loader2, RotateCcw, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CopyField } from '@/components/CopyField'
import { GoLiveDialog } from '@/components/GoLiveDialog'
import { MakeItYours } from '@/components/MakeItYours'
import { StatusBadge } from '@/components/StatusBadge'
import { useApp } from '@/context/useApp'
import { demoStore } from '@/data/demo/store'
import { clearApiKey } from '@/data/mode'
import { notify } from '@/integrations'

export default function Profile() {
  const { source, mode, customer, customerId, wallet, accounts, reload, refreshCustomer } = useApp()
  const [busy, setBusy] = useState(false)
  const name = [customer?.personal?.firstName, customer?.personal?.lastName].filter(Boolean).join(' ')
  const verification = customer?.verificationStatus ?? 'not_started'

  async function verify() {
    setBusy(true)
    try {
      const session = await source.initiateKyc(customerId)
      if (session.verificationUrl) window.open(session.verificationUrl, '_blank')
      notify('Verification started')
      setTimeout(refreshCustomer, 5000)
    } catch (err) {
      notify(err instanceof Error ? err.message : 'KYC failed to start', 'error')
    } finally {
      setBusy(false)
    }
  }

  function resetDemo() {
    demoStore.reset()
    reload()
    notify('Demo reset')
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-extrabold tracking-tight">Profile</h1>

      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="flex items-center justify-between text-sm">
            <span>{name || 'Customer'}</span>
            <StatusBadge state={verification} />
          </CardTitle>
          <CardDescription>{customer?.personal?.email}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <CopyField label="Customer id" value={customerId} />
          {verification !== 'approved' && (
            <Button size="sm" variant="outline" disabled={busy} onClick={verify}>
              {busy && <Loader2 className="size-4 animate-spin" />} Verify identity
            </Button>
          )}
        </CardContent>
      </Card>

      {wallet && (
        <Card>
          <CardHeader className="pb-1"><CardTitle className="text-sm">Wallet</CardTitle></CardHeader>
          <CardContent>
            {wallet.address && <CopyField label={`Address (${wallet.chain ?? 'polygon'})`} value={wallet.address} />}
            {accounts.map(a => a.iban && <CopyField key={a.id} label={a.label ?? 'IBAN'} value={a.iban} />)}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="text-sm">Connection</CardTitle>
          <CardDescription>
            {mode === 'demo'
              ? 'Running on demo data. Connect a Swipelux sandbox API key to go live — that is the only configuration this app has.'
              : 'Connected to the Swipelux sandbox.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          {mode === 'demo' ? (
            <>
              <GoLiveDialog trigger={<Button size="sm" className="gap-1"><Zap className="size-3.5" /> Go live</Button>} />
              <Button size="sm" variant="outline" className="gap-1" onClick={resetDemo}>
                <RotateCcw className="size-3.5" /> Reset demo
              </Button>
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={() => { clearApiKey(); notify('Disconnected — back to demo data') }}>
              Disconnect
            </Button>
          )}
        </CardContent>
      </Card>

      <MakeItYours />
    </div>
  )
}
