import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useApp } from '@/context/useApp'
import { formatMoney } from '@/lib/format'
import { notify, track } from '@/integrations'
import { cn } from '@/lib/utils'
import type { Quote, Recipient, RecipientAccount } from '@/data/types'

type Tab = 'bank' | 'crypto'

export default function Send() {
  const { source, customerId, wallet, addTransfer } = useApp()
  const [tab, setTab] = useState<Tab>('bank')
  const defaultCurrency = wallet?.balances?.[0]?.currency ?? 'EUR'

  // bank flow state
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [selected, setSelected] = useState<{ recipient: Recipient; account: RecipientAccount } | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newIban, setNewIban] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<string | null>(null)
  const [quote, setQuote] = useState<Quote | null>(null)
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // crypto flow state
  const [address, setAddress] = useState('')
  const selectedCurrency = currency ?? defaultCurrency
  const amountNum = Number(amount)
  const validAmount = Number.isFinite(amountNum) && amountNum > 0
  const freshQuote = Boolean(quote && Number(quote.from?.amount) === amountNum && quote.from?.currency === selectedCurrency)

  useEffect(() => {
    if (!customerId) return
    source.listRecipients(customerId).then(setRecipients).catch(() => {})
  }, [source, customerId])

  useEffect(() => {
    if (!wallet) return
    const hasCurrency = currency ? wallet.balances?.some(b => b.currency === currency) : true
    if (!hasCurrency) setCurrency(null)
    setQuote(null)
  }, [wallet, currency])

  async function pickRecipient(recipient: Recipient) {
    setError(null)
    const accounts = await source.listRecipientAccounts(customerId, recipient.id).catch(() => [])
    if (!accounts.length) {
      setError('This recipient has no bank account yet.')
      return
    }
    setSelected({ recipient, account: accounts[0] })
    setQuote(null)
  }

  async function addRecipient() {
    if (!newName.trim() || !newIban.trim()) return
    setBusy(true); setError(null)
    try {
      const [firstName, ...rest] = newName.trim().split(' ')
      const recipient = await source.createRecipient(customerId, { firstName, lastName: rest.join(' ') })
      const account = await source.createRecipientAccount(customerId, recipient.id, {
        rail: 'sepa',
        details: { iban: newIban.trim(), accountHolderName: newName.trim(), currency: 'EUR' },
      })
      setRecipients(prev => [...prev, recipient])
      setSelected({ recipient, account })
      setShowAdd(false); setNewName(''); setNewIban('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add recipient.')
    } finally {
      setBusy(false)
    }
  }

  async function getQuote() {
    if (!wallet || !selected || !validAmount) return
    setBusy(true); setError(null)
    try {
      const q = await source.createPayoutQuote({
        fromWalletId: wallet.id, amount: amountNum, currency: selectedCurrency,
        toAccountId: selected.account.id, toCurrency: selected.account.currency ?? 'EUR',
      })
      setQuote({ ...q, from: { ...q.from, amount: amountNum, currency: selectedCurrency } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Quote failed.')
    } finally {
      setBusy(false)
    }
  }

  async function confirm() {
    if (!wallet || !selected || !validAmount || !freshQuote) return
    setBusy(true); setError(null)
    try {
      const transfer = await source.createPayout({
        fromWalletId: wallet.id, amount: amountNum, currency: selectedCurrency,
        toId: selected.account.id, toCurrency: selected.account.currency ?? 'EUR',
        kind: 'bank',
      })
      addTransfer(transfer)
      track('send.bank', { amount, currency: selectedCurrency })
      notify('Payout created')
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payout failed.')
    } finally {
      setBusy(false)
    }
  }

  async function sendCrypto() {
    if (!wallet || !address.trim() || !validAmount) return
    setBusy(true); setError(null)
    try {
      const transfer = await source.createPayout({
        fromWalletId: wallet.id, amount: amountNum, currency: 'USDC',
        toId: address.trim(), toCurrency: 'USDC',
        kind: 'wallet',
      })
      addTransfer(transfer)
      track('send.crypto', { amount })
      notify('Transfer created')
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transfer failed.')
    } finally {
      setBusy(false)
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-4 pt-16 text-center">
        <CheckCircle2 className="size-14 text-success" />
        <h1 className="text-xl font-extrabold">Money is on its way</h1>
        <p className="text-sm text-muted-foreground">
          Watch it settle in Activity — or flip on “How it works” to see what Swipelux does underneath.
        </p>
        <Button asChild variant="outline"><Link to="/">Back home</Link></Button>
      </div>
    )
  }

  const tabClass = (t: Tab) =>
    cn('flex-1 rounded-md px-3 py-1.5 text-sm font-semibold', tab === t ? 'bg-card shadow-sm' : 'text-muted-foreground')

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-extrabold tracking-tight">Send</h1>

      <div className="flex rounded-lg bg-muted p-1">
        <button type="button" className={tabClass('bank')} onClick={() => { setTab('bank'); setQuote(null) }}>Bank transfer</button>
        <button type="button" className={tabClass('crypto')} onClick={() => { setTab('crypto'); setQuote(null) }}>Crypto wallet</button>
      </div>

      {tab === 'bank' && (
        <>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Recipient</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {recipients.map(r => {
                const name = [r.firstName, r.lastName].filter(Boolean).join(' ') || r.companyName || r.id
                const active = selected?.recipient.id === r.id
                return (
                  <button
                    key={r.id} type="button" onClick={() => pickRecipient(r)}
                    className={cn('w-full rounded-lg border px-3 py-2 text-left text-sm font-medium', active ? 'border-ring bg-accent' : 'hover:bg-accent')}
                  >
                    {name}
                  </button>
                )
              })}
              {showAdd ? (
                <div className="space-y-2 rounded-lg border p-3">
                  <Input placeholder="Full name" value={newName} onChange={e => setNewName(e.target.value)} />
                  <Input placeholder="IBAN" value={newIban} onChange={e => setNewIban(e.target.value)} />
                  <Button size="sm" disabled={busy} onClick={addRecipient}>Save recipient</Button>
                </div>
              ) : (
                <Button variant="ghost" size="sm" className="gap-1" onClick={() => setShowAdd(true)}>
                  <Plus className="size-4" /> New recipient
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 pt-4">
              <div className="space-y-1.5">
                <Label htmlFor="amount">Amount</Label>
                <div className="flex gap-2">
                  <Input id="amount" inputMode="decimal" placeholder="0.00" value={amount} onChange={e => { setAmount(e.target.value); setQuote(null) }} />
                  <select
                    aria-label="Currency" value={selectedCurrency} onChange={e => { setCurrency(e.target.value); setQuote(null) }}
                    className="rounded-md border bg-card px-2 text-sm font-semibold"
                  >
                    {(wallet?.balances ?? [{ currency: defaultCurrency }]).map(b => <option key={b.currency}>{b.currency}</option>)}
                  </select>
                </div>
              </div>

              {quote ? (
                <div className="space-y-1 rounded-lg bg-muted p-3 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Fee</span><span>{quote.fee ? formatMoney(quote.fee.amount, quote.fee.currency) : '—'}</span></div>
                  {quote.rate != null && <div className="flex justify-between"><span className="text-muted-foreground">Rate</span><span>{quote.rate}</span></div>}
                  <Separator />
                  <div className="flex justify-between font-semibold"><span>Recipient gets</span><span>{quote.destination_amount != null ? formatMoney(quote.destination_amount, selected?.account.currency ?? 'EUR') : '—'}</span></div>
                </div>
              ) : null}

              {error && <p className="text-sm text-destructive">{error}</p>}

              {quote ? (
                <Button className="w-full" disabled={busy || !freshQuote} onClick={confirm}>
                  {busy && <Loader2 className="size-4 animate-spin" />} Confirm payout
                </Button>
              ) : (
                <Button className="w-full" disabled={!selected || !validAmount || busy} onClick={getQuote}>
                  {busy && <Loader2 className="size-4 animate-spin" />} Get quote
                </Button>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {tab === 'crypto' && (
        <Card>
          <CardContent className="space-y-3 pt-4">
            <div className="space-y-1.5">
              <Label htmlFor="address">Wallet address</Label>
              <Input id="address" placeholder="0x…" value={address} onChange={e => setAddress(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="crypto-amount">Amount (USDC)</Label>
              <Input id="crypto-amount" inputMode="decimal" placeholder="0.00" value={amount} onChange={e => { setAmount(e.target.value); setQuote(null) }} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button className="w-full" disabled={!address.trim() || !validAmount || busy} onClick={sendCrypto}>
              {busy && <Loader2 className="size-4 animate-spin" />} Send
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
