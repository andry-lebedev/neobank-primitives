import { Link } from 'react-router-dom'
import { CheckCircle2, Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { ApprovalRequiredOutcome, OperationReceipt } from '@/financial/runtime'
import type { ProviderDestination, ProviderQuote, ProviderRecipient } from '@/financial/swipeluxV3'

export type BankSelection = {
  recipient: ProviderRecipient
  destination: ProviderDestination
}

type QuoteFlowProps = {
  approval: ApprovalRequiredOutcome | null
  busy: boolean
  canRequest: boolean
  confirmLabel: string
  error: string | null
  freshQuote: boolean
  onApprove: () => void
  onConfirm: () => void
  onRequest: () => void
  quote: ProviderQuote | null
}

type BankTransferFormProps = {
  amount: string
  currencyOptions: string[]
  flow: QuoteFlowProps
  newIban: string
  newName: string
  onAmountChange: (value: string) => void
  onCurrencyChange: (value: string) => void
  onIbanChange: (value: string) => void
  onNameChange: (value: string) => void
  onOpenRecipientForm: () => void
  onSaveRecipient: () => void
  onSelectRecipient: (recipient: ProviderRecipient) => void
  recipients: ProviderRecipient[]
  selected: BankSelection | null
  selectedCurrency: string
  showAdd: boolean
}

type CryptoTransferFormProps = {
  address: string
  amount: string
  flow: QuoteFlowProps
  name: string
  onAddressChange: (value: string) => void
  onAmountChange: (value: string) => void
  onNameChange: (value: string) => void
}

function recipientName(recipient: ProviderRecipient): string {
  return [recipient.firstName, recipient.lastName].filter(Boolean).join(' ')
    || recipient.companyName
    || recipient.id
}

function QuoteEvidence({ quote }: { quote: ProviderQuote | null }) {
  if (!quote) return null
  const fee = quote.fees?.[0]
  return (
    <div className="space-y-1 rounded-lg bg-muted p-3 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Fee</span>
        <span>{fee ? formatMoney(fee.amount, fee.currency) : '—'}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Rate</span>
        <span>{quote.rate}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Quote expires</span>
        <span>{new Date(quote.expiresAt).toLocaleTimeString()}</span>
      </div>
      <Separator />
      <div className="flex justify-between font-semibold">
        <span>Recipient gets</span>
        <span>{quote.out.amount ? formatMoney(quote.out.amount, quote.out.currency) : '—'}</span>
      </div>
    </div>
  )
}

function QuoteFlow({ approval, busy, canRequest, confirmLabel, error, freshQuote, onApprove, onConfirm, onRequest, quote }: QuoteFlowProps) {
  return (
    <>
      <QuoteEvidence quote={quote} />
      {approval && (
        <div className="space-y-2 rounded-lg border border-info p-3 text-sm">
          <p className="font-semibold">Human approval required</p>
          <p className="text-muted-foreground">{approval.decision.reasons.join(', ')}</p>
          <Button size="sm" disabled={busy} onClick={onApprove}>Approve and get quote</Button>
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {quote ? (
        <Button className="w-full" disabled={busy || !freshQuote} onClick={onConfirm}>
          {busy && <Loader2 className="size-4 animate-spin" />} {confirmLabel}
        </Button>
      ) : !approval ? (
        <Button className="w-full" disabled={!canRequest || busy} onClick={onRequest}>
          {busy && <Loader2 className="size-4 animate-spin" />} Get quote
        </Button>
      ) : null}
    </>
  )
}

export function BankTransferForm({
  amount,
  currencyOptions,
  flow,
  newIban,
  newName,
  onAmountChange,
  onCurrencyChange,
  onIbanChange,
  onNameChange,
  onOpenRecipientForm,
  onSaveRecipient,
  onSelectRecipient,
  recipients,
  selected,
  selectedCurrency,
  showAdd,
}: BankTransferFormProps) {
  return (
    <>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Recipient</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {recipients.map(recipient => (
            <button
              key={recipient.id}
              type="button"
              onClick={() => onSelectRecipient(recipient)}
              className={cn('w-full rounded-lg border px-3 py-2 text-left text-sm font-medium', selected?.recipient.id === recipient.id ? 'border-ring bg-accent' : 'hover:bg-accent')}
            >
              {recipientName(recipient)}
            </button>
          ))}
          {showAdd ? (
            <div className="space-y-2 rounded-lg border p-3">
              <Input placeholder="Full name" value={newName} onChange={event => onNameChange(event.target.value)} />
              <Input placeholder="IBAN" value={newIban} onChange={event => onIbanChange(event.target.value)} />
              <Button size="sm" disabled={flow.busy} onClick={onSaveRecipient}>Save recipient</Button>
            </div>
          ) : (
            <Button variant="ghost" size="sm" className="gap-1" onClick={onOpenRecipientForm}>
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
              <Input id="amount" inputMode="decimal" placeholder="0.00" value={amount} onChange={event => onAmountChange(event.target.value)} />
              <select
                aria-label="Currency"
                value={selectedCurrency}
                onChange={event => onCurrencyChange(event.target.value)}
                className="rounded-md border bg-card px-2 text-sm font-semibold"
              >
                {currencyOptions.map(option => <option key={option}>{option}</option>)}
              </select>
            </div>
          </div>
          <QuoteFlow {...flow} />
        </CardContent>
      </Card>
    </>
  )
}

export function CryptoTransferForm({ address, amount, flow, name, onAddressChange, onAmountChange, onNameChange }: CryptoTransferFormProps) {
  return (
    <Card>
      <CardContent className="space-y-3 pt-4">
        <div className="space-y-1.5">
          <Label htmlFor="crypto-name">Recipient name</Label>
          <Input id="crypto-name" value={name} onChange={event => onNameChange(event.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="address">Wallet address</Label>
          <Input id="address" placeholder="0x…" value={address} onChange={event => onAddressChange(event.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="crypto-amount">Amount (USDC)</Label>
          <Input id="crypto-amount" inputMode="decimal" placeholder="0.00" value={amount} onChange={event => onAmountChange(event.target.value)} />
        </div>
        <QuoteFlow {...flow} />
      </CardContent>
    </Card>
  )
}

export function TransferAccepted({ receipt }: { receipt: OperationReceipt }) {
  return (
    <div className="flex flex-col items-center gap-4 pt-16 text-center">
      <CheckCircle2 className="size-14 text-success" />
      <h1 className="text-xl font-extrabold">Transfer accepted by provider</h1>
      <div className="space-y-1 text-sm text-muted-foreground">
        <p>{receipt.id} · state: {receipt.evidence.providerState}</p>
        <p>Policy: {receipt.policy.decision}{receipt.approval ? ` · approved by ${receipt.approval.approverId}` : ''}</p>
        <p>Quote: {receipt.quote.id} · expires {new Date(receipt.quote.expiresAt).toLocaleTimeString()}</p>
      </div>
      <Button asChild variant="outline"><Link to="/">Back home</Link></Button>
    </div>
  )
}
