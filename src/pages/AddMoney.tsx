import { useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CopyField } from '@/components/CopyField'
import { useApp } from '@/context/useApp'
import { notify, track } from '@/integrations'
import { brand } from '../brand.config'

export default function AddMoney() {
  const { source, mode, wallet, accounts, addTransfer } = useApp()
  const [busy, setBusy] = useState(false)
  const account = accounts.find(a => a.source === 'virtual') ?? accounts[0]
  const primaryBalance = wallet?.balances?.find(b => b.currency === brand.currency) ?? wallet?.balances?.[0]
  const simulateCurrency = primaryBalance?.currency ?? brand.currency

  async function simulate() {
    if (!wallet) return
    setBusy(true)
    try {
      const transfer = await source.topup({ walletId: wallet.id, amount: 1000, currency: simulateCurrency })
      addTransfer(transfer)
      track('addmoney.simulated', {})
      notify('Deposit created — watch it settle')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Top-up failed', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-extrabold tracking-tight">Add money</h1>

      {account && (
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm">Bank transfer (SEPA)</CardTitle>
            <CardDescription>Send from any bank — funds land on your balance automatically.</CardDescription>
          </CardHeader>
          <CardContent>
            {account.accountHolderName && <CopyField label="Account holder" value={account.accountHolderName} />}
            {account.iban && <CopyField label="IBAN" value={account.iban} />}
            {account.bic && <CopyField label="BIC" value={account.bic} />}
            {account.paymentReference && <CopyField label="Payment reference" value={account.paymentReference} />}
          </CardContent>
        </Card>
      )}

      {wallet?.address && (
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm">Crypto deposit</CardTitle>
            <CardDescription>
              Send USDC on {wallet.chain ?? 'polygon'} to your wallet address.
              {mode === 'demo' && ' This is a demo address — funds are simulated, do not send real crypto.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CopyField label={mode === 'demo' ? 'Wallet address (demo)' : 'Wallet address'} value={wallet.address} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="flex items-center gap-2 text-sm"><Sparkles className="size-4" /> Try it now</CardTitle>
          <CardDescription>
            {mode === 'demo' ? 'Simulate an incoming deposit and watch it settle.' : 'Top-up: credits test funds to your wallet.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" disabled={busy || !wallet} onClick={simulate}>
            {busy && <Loader2 className="size-4 animate-spin" />} Simulate incoming deposit
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
