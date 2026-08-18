import { useEffect, useState } from 'react'
import { useApp } from '@/context/useApp'
import { notify, track } from '@/integrations'
import { cn } from '@/lib/utils'
import { INTERACTIVE_AGENT_ID } from '@/financial/defaultPolicy'
import { receiptToTransfer } from '@/financial/receipts'
import type { ApprovalRequiredOutcome, OperationReceipt } from '@/financial/runtime'
import type { ProviderQuote, ProviderRecipient } from '@/financial/swipeluxV3'
import { BankTransferForm, CryptoTransferForm, TransferAccepted, type BankSelection } from './send/SendForms'

type Tab = 'bank' | 'crypto'

export default function Send() {
  const { financialProvider, financialRuntime, financialAccounts, customerId, wallet, addTransfer } = useApp()
  const [tab, setTab] = useState<Tab>('bank')
  const readySourceAccounts = financialAccounts.filter(account => account.type === 'wallet' && account.status === 'ready')
  const sourceCurrencies = [...new Set(readySourceAccounts.map(account => account.currency))]
  const defaultCurrency = sourceCurrencies[0] ?? wallet?.balances?.[0]?.currency ?? 'EUR'

  const [recipients, setRecipients] = useState<ProviderRecipient[]>([])
  const [selected, setSelected] = useState<BankSelection | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newIban, setNewIban] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<string | null>(null)
  const [quote, setQuote] = useState<ProviderQuote | null>(null)
  const [approval, setApproval] = useState<ApprovalRequiredOutcome | null>(null)
  const [busy, setBusy] = useState(false)
  const [receipt, setReceipt] = useState<OperationReceipt | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [cryptoName, setCryptoName] = useState('')
  const [address, setAddress] = useState('')
  const requestedCurrency = currency ?? defaultCurrency
  const selectedCurrency = wallet?.balances?.some(balance => balance.currency === requestedCurrency)
    ? requestedCurrency
    : defaultCurrency
  const amountNum = Number(amount)
  const validAmount = Number.isFinite(amountNum) && amountNum > 0
  const quoteCurrency = tab === 'crypto' ? 'USDC' : selectedCurrency
  const freshQuote = Boolean(
    quote
    && Number(quote.in.amount) === amountNum
    && quote.in.currency === quoteCurrency,
  )

  const clearAuthorization = () => {
    setQuote(null)
    setApproval(null)
  }

  useEffect(() => {
    if (!customerId) return
    financialProvider.listRecipients(customerId).then(setRecipients).catch(() => {})
  }, [financialProvider, customerId])

  useEffect(() => {
    if (selected || !customerId || !recipients.length) return
    let cancelled = false
    financialProvider.listDestinations(customerId, recipients[0].id)
      .then(destinations => {
        const destination = destinations.find(item => item.type === 'sepa' && (!item.status || item.status === 'ready' || item.status === 'active'))
        if (!cancelled && destination) setSelected({ recipient: recipients[0], destination })
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [recipients, selected, customerId, financialProvider])

  async function pickRecipient(recipient: ProviderRecipient) {
    setError(null)
    const destinations = await financialProvider.listDestinations(customerId, recipient.id).catch(() => [])
    const destination = destinations.find(item => item.type === 'sepa' && (!item.status || item.status === 'ready' || item.status === 'active'))
    if (!destination) {
      setError('This recipient has no ready SEPA destination.')
      return
    }
    setSelected({ recipient, destination })
    clearAuthorization()
  }

  async function addRecipient() {
    if (!newName.trim() || !newIban.trim()) return
    setBusy(true); setError(null)
    try {
      const [firstName, ...rest] = newName.trim().split(/\s+/)
      const recipient = await financialProvider.createRecipient(customerId, {
        type: 'individual', relationship: 'other', firstName, lastName: rest.join(' ') || 'Recipient',
      })
      const destination = await financialProvider.createDestination(customerId, recipient.id, {
        type: 'sepa',
        currency: 'EUR',
        details: {
          iban: newIban.trim(),
          accountHolderName: newName.trim(),
          country: newIban.trim().slice(0, 2).toUpperCase(),
        },
      })
      setRecipients(previous => [...previous, recipient])
      setSelected({ recipient, destination })
      setShowAdd(false); setNewName(''); setNewIban('')
      clearAuthorization()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not add recipient.')
    } finally {
      setBusy(false)
    }
  }

  async function requestQuote(destinationId: string, rail: 'sepa' | 'stablecoin_transfers', inCurrency: string, outCurrency: string) {
    if (!wallet || !validAmount) return
    const sourceAccount = readySourceAccounts.find(account => account.currency === inCurrency)
    if (!sourceAccount) {
      setError(`No ready provider wallet account supports ${inCurrency}.`)
      return
    }
    const outcome = await financialRuntime.quote({
      customerId,
      agentId: INTERACTIVE_AGENT_ID,
      amount: amountNum,
      currency: inCurrency,
      outCurrency,
      rail,
      sourceAccountId: sourceAccount.id,
      destinationId,
    })
    if (outcome.status === 'blocked') {
      setError(`Policy blocked this operation: ${outcome.decision.reasons.join(', ')}`)
      return
    }
    if (outcome.status === 'approval_required') {
      setApproval(outcome)
      setQuote(null)
      return
    }
    setApproval(null)
    setQuote(outcome.quote)
  }

  async function getBankQuote() {
    if (!selected) return
    setBusy(true); setError(null)
    try {
      await requestQuote(selected.destination.id, 'sepa', selectedCurrency, selected.destination.currency)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Quote failed.')
    } finally {
      setBusy(false)
    }
  }

  async function getCryptoQuote() {
    if (!cryptoName.trim() || !address.trim()) return
    setBusy(true); setError(null)
    try {
      const [firstName, ...rest] = cryptoName.trim().split(/\s+/)
      const recipient = await financialProvider.createRecipient(customerId, {
        type: 'individual', relationship: 'other', firstName, lastName: rest.join(' ') || 'Wallet',
      })
      const destination = await financialProvider.createDestination(customerId, recipient.id, {
        type: 'wallet',
        currency: 'USDC',
        details: { network: wallet?.chain ?? 'polygon', address: address.trim() },
        ownership: { type: 'self_custodied' },
        label: cryptoName.trim(),
      })
      if (destination.status && destination.status !== 'ready' && destination.status !== 'active') {
        throw new Error(`Wallet destination is ${destination.status}, not ready.`)
      }
      await requestQuote(destination.id, 'stablecoin_transfers', 'USDC', 'USDC')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Quote failed.')
    } finally {
      setBusy(false)
    }
  }

  async function approveQuote() {
    if (!approval) return
    setBusy(true); setError(null)
    try {
      const approved = await financialRuntime.approve(approval.requestId, 'account_owner')
      setApproval(null)
      setQuote(approved.quote)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Approval failed.')
    } finally {
      setBusy(false)
    }
  }

  async function confirm() {
    if (!quote || !freshQuote) return
    setBusy(true); setError(null)
    try {
      const result = await financialRuntime.execute(quote.id)
      addTransfer(receiptToTransfer(result))
      track(tab === 'crypto' ? 'send.crypto' : 'send.bank', { amount, currency: quoteCurrency })
      notify('Transfer accepted by provider')
      setReceipt(result)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Transfer failed.')
    } finally {
      setBusy(false)
    }
  }

  if (receipt) return <TransferAccepted receipt={receipt} />

  const tabClass = (value: Tab) =>
    cn('flex-1 rounded-md px-3 py-1.5 text-sm font-semibold', tab === value ? 'bg-card shadow-sm' : 'text-muted-foreground')

  const onAmountChange = (value: string) => {
    setAmount(value)
    clearAuthorization()
  }
  const currencyOptions = sourceCurrencies.length ? sourceCurrencies : [defaultCurrency]
  const sharedFlow = {
    approval,
    busy,
    error,
    freshQuote,
    onApprove: approveQuote,
    onConfirm: confirm,
    quote,
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-extrabold tracking-tight">Send</h1>
      <div className="flex rounded-lg bg-muted p-1">
        <button type="button" className={tabClass('bank')} onClick={() => { setTab('bank'); clearAuthorization() }}>Bank transfer</button>
        <button type="button" className={tabClass('crypto')} onClick={() => { setTab('crypto'); clearAuthorization() }}>Crypto wallet</button>
      </div>

      {tab === 'bank' ? (
        <BankTransferForm
          amount={amount}
          currencyOptions={currencyOptions}
          flow={{
            ...sharedFlow,
            canRequest: Boolean(selected) && validAmount,
            confirmLabel: 'Confirm payout',
            onRequest: getBankQuote,
          }}
          newIban={newIban}
          newName={newName}
          onAmountChange={onAmountChange}
          onCurrencyChange={value => { setCurrency(value); clearAuthorization() }}
          onIbanChange={setNewIban}
          onNameChange={setNewName}
          onOpenRecipientForm={() => setShowAdd(true)}
          onSaveRecipient={addRecipient}
          onSelectRecipient={pickRecipient}
          recipients={recipients}
          selected={selected}
          selectedCurrency={selectedCurrency}
          showAdd={showAdd}
        />
      ) : (
        <CryptoTransferForm
          address={address}
          amount={amount}
          flow={{
            ...sharedFlow,
            canRequest: Boolean(cryptoName.trim() && address.trim() && validAmount),
            confirmLabel: 'Confirm transfer',
            onRequest: getCryptoQuote,
          }}
          name={cryptoName}
          onAddressChange={value => { setAddress(value); clearAuthorization() }}
          onAmountChange={onAmountChange}
          onNameChange={value => { setCryptoName(value); clearAuthorization() }}
        />
      )}
    </div>
  )
}
