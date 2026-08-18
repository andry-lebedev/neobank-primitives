import { useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CopyField } from '@/components/CopyField'
import { useApp } from '@/context/useApp'
import { notify, track } from '@/integrations'
import { brand } from '../brand.config'
import { configureInboundFunding, type InboundFundingReceipt } from '@/financial/funding'

export default function AddMoney() {
  const { source, financialProvider, mode, customerId, wallet, accounts, availableRails, financialAccounts, addTransfer } = useApp()
  const [busy, setBusy] = useState(false)
  const [fundingReceipt, setFundingReceipt] = useState<InboundFundingReceipt | null>(null)
  const account = accounts.find(a => a.source === 'virtual') ?? accounts[0]
  const primaryBalance = wallet?.balances?.find(b => b.currency === brand.currency) ?? wallet?.balances?.[0]
  const simulateCurrency = primaryBalance?.currency ?? brand.currency
  const payinRail = availableRails.find(rail => rail.method === 'sepa' && rail.directions.includes('payin'))
  const settlementAccount = financialAccounts.find(item => item.type === 'bank' && item.status === 'ready' && item.method === 'sepa')
  const targetAccount = financialAccounts.find(item => item.type === 'wallet' && item.status === 'ready')

  async function enableAutomaticCredit() {
    if (!settlementAccount || !targetAccount) return
    setBusy(true)
    try {
      const result = await configureInboundFunding({
        provider: financialProvider,
        customerId,
        settlementAccountId: settlementAccount.id,
        targetAccountId: targetAccount.id,
      })
      setFundingReceipt(result)
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not create funding rule', 'error')
    } finally {
      setBusy(false)
    }
  }

  async function simulate() {
    if (!wallet) return
    setBusy(true)
    try {
      const transfer = await source.topup({ walletId: wallet.id, amount: 1000, currency: simulateCurrency })
      addTransfer(transfer)
      track('addmoney.simulated', {})
      notify(`Deposit created with state ${transfer.state}`)
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
            <CardDescription>
              {payinRail
                ? `Eligible pay-in rail: ${payinRail.method} (capability ${payinRail.capabilityId}).`
                : 'No eligible SEPA pay-in capability has been returned for this customer.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {account.accountHolderName && <CopyField label="Account holder" value={account.accountHolderName} />}
            {account.iban && <CopyField label="IBAN" value={account.iban} />}
            {account.bic && <CopyField label="BIC" value={account.bic} />}
            {account.paymentReference && <CopyField label="Payment reference" value={account.paymentReference} />}
            {fundingReceipt ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Active rule {fundingReceipt.ruleId} · source: {fundingReceipt.source}
              </p>
            ) : (
              <Button
                className="mt-2"
                size="sm"
                variant="outline"
                disabled={busy || !payinRail || !settlementAccount || !targetAccount}
                onClick={enableAutomaticCredit}
              >
                Enable automatic credit
              </Button>
            )}
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
              {' '}Custody: {wallet.custody?.type ?? 'not reported'}{wallet.custody?.custodianName ? ` by ${wallet.custody.custodianName}` : ''}.
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
            {mode === 'demo' ? 'Simulate an incoming deposit; its returned state appears in Activity.' : 'Create a sandbox top-up and track the returned transfer state.'}
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
