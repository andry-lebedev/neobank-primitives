import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, User, Building2 } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import { useApp } from '../context/useApp'
import { createPayoutQuote, createPayout } from '../api/transfers'
import { listRecipients, createRecipient, listRecipientAccounts, createRecipientAccount } from '../api/recipients'
import { formatAmount, canSend, kycBanner } from '../utils'
import { showToast } from '../components/showToast'

function BankPayoutFlow({ wallet, addTransfer, refreshWallet, kycOk, customer }) {
  const [step, setStep] = useState(1)
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')
  const [quote, setQuote] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [recipients, setRecipients] = useState([])
  const [recipientAccounts, setRecipientAccounts] = useState([])
  const [selectedRecipientId, setSelectedRecipientId] = useState('')
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [iban, setIban] = useState('')
  const [accountHolderName, setAccountHolderName] = useState('')
  const [country, setCountry] = useState('EE')
  const [currency, setCurrency] = useState('EUR')
  const navigate = useNavigate()
  const customerId = customer?.id
  const selectedAccount = recipientAccounts.find(a => a.id === selectedAccountId)
  const toCurrency = selectedAccount?.details?.currency ?? selectedAccount?.currency ?? 'EUR'

  useEffect(() => {
    if (!customerId) return
    listRecipients(customerId)
      .then(data => {
        const list = data?.recipients ?? (Array.isArray(data) ? data : [])
        setRecipients(list)
        setShowAddForm(list.length === 0)
      })
      .catch(() => {})
  }, [customerId])

  useEffect(() => {
    if (!customerId || !selectedRecipientId) return
    listRecipientAccounts(customerId, selectedRecipientId)
      .then(data => setRecipientAccounts(data?.accounts ?? (Array.isArray(data) ? data : [])))
      .catch(() => {})
  }, [customerId, selectedRecipientId])

  function handleSelectRecipient(recipientId) {
    setSelectedRecipientId(recipientId)
    setRecipientAccounts([])
    setSelectedAccountId('')
  }

  async function handleAddRecipient() {
    if (!customerId) return
    setLoading(true)
    try {
      const rec = await createRecipient(customerId, { type: 'individual', firstName, lastName, email })
      const account = await createRecipientAccount(customerId, rec.id, {
        rail: 'sepa',
        details: { iban, accountHolderName, country, currency },
      })
      const data = await listRecipients(customerId)
      const list = data?.recipients ?? (Array.isArray(data) ? data : [])
      setRecipients(list)
      setSelectedRecipientId(rec.id)
      setRecipientAccounts(account ? [account] : [])
      setSelectedAccountId(account?.id ?? '')
      setShowAddForm(false)
    } catch {
      // Error toast already fired
    } finally {
      setLoading(false)
    }
  }

  async function handleReview() {
    if (!amount || isNaN(Number(amount)) || Number(amount) < 0.1) {
      showToast('Enter a valid amount (min 0.1)', 'error')
      return
    }
    setLoading(true)
    try {
      const q = await createPayoutQuote({
        fromWalletId: wallet.id,
        amount: Number(amount),
        currency: 'USDC',
        toAccountId: selectedAccountId,
        toCurrency,
      })
      setQuote(q)
      setStep(2)
    } catch {
      // Error toast already fired by axios interceptor
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirm() {
    setLoading(true)
    try {
      const tx = await createPayout({
        fromWalletId: wallet.id,
        amount: Number(amount),
        currency: 'USDC',
        toId: selectedAccountId,
        toCurrency,
      })
      const transfer = {
        id: tx.id ?? `txn_${Date.now()}`,
        type: 'offramp',
        state: tx.state ?? 'pending',
        from: { identifier: wallet.id, amount, currency: 'USDC' },
        to: { identifier: selectedAccountId },
        createdAt: new Date().toISOString(),
      }
      addTransfer(transfer)
      refreshWallet()
      setResult(transfer)
      showToast('Transfer initiated successfully')
      setStep(3)
    } catch {
      // Error toast already fired
    } finally {
      setLoading(false)
    }
  }

  if (step === 3 && result) {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto">
          <CheckCircle2 size={32} className="text-success" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Transfer initiated</h2>
          <p className="text-sm text-gray-400 mt-1">Your bank payout is being processed</p>
        </div>
        <Card className="p-4 text-left">
          <p className="text-xs text-gray-500 mb-0.5">Transaction ID</p>
          <p className="text-sm font-mono text-gray-200 break-all">{result.id}</p>
          <p className="text-xs text-gray-500 mt-3 mb-0.5">Amount</p>
          <p className="text-sm text-gray-200">{formatAmount(amount, 'USDC')}</p>
          <p className="text-xs text-gray-500 mt-3 mb-0.5">Estimated arrival</p>
          <p className="text-sm text-gray-200">1–2 business days</p>
        </Card>
        <Button fullWidth onClick={() => navigate('/')}>Back to home</Button>
      </div>
    )
  }

  if (step === 2) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Review transfer</h2>
        <Card className="p-5 space-y-3">
          <div><p className="text-xs text-gray-500">From</p><p className="text-sm text-gray-200 font-mono">{wallet?.id}</p></div>
          <div><p className="text-xs text-gray-500">To account</p><p className="text-sm text-gray-200 font-mono">{selectedAccountId}</p></div>
          <div><p className="text-xs text-gray-500">Amount</p><p className="text-sm text-gray-200">{formatAmount(amount, 'USDC')}</p></div>
          {quote && (
            <>
              <div><p className="text-xs text-gray-500">Fee</p><p className="text-sm text-gray-200">{quote.fee ? `${quote.fee.amount} ${quote.fee.currency}` : '—'}</p></div>
              <div><p className="text-xs text-gray-500">You receive</p><p className="text-sm font-semibold text-white">{quote.destination_amount} {toCurrency}</p></div>
              <div><p className="text-xs text-gray-500">Rate</p><p className="text-sm text-gray-200">{quote.rate}</p></div>
            </>
          )}
          <div><p className="text-xs text-gray-500">Estimated arrival</p><p className="text-sm text-gray-200">1–2 business days</p></div>
          {memo && <div><p className="text-xs text-gray-500">Memo</p><p className="text-sm text-gray-200">{memo}</p></div>}
        </Card>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => setStep(1)} className="flex-1">Back</Button>
          <Button onClick={handleConfirm} loading={loading} className="flex-1">Confirm &amp; Send</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-gray-500 mb-1.5" htmlFor="bank-recipient">Recipient</label>
        <select
          id="bank-recipient"
          value={selectedRecipientId}
          onChange={e => handleSelectRecipient(e.target.value)}
          className="w-full bg-card border border-card-hover rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent transition-colors duration-150"
        >
          <option value="">Select recipient</option>
          {recipients.map(r => (
            <option key={r.id} value={r.id}>{`${r.firstName ?? r.companyName ?? ''} ${r.lastName ?? ''}`.trim() || r.id}</option>
          ))}
        </select>
      </div>

      {selectedRecipientId && (
        <div>
          <label className="block text-xs text-gray-500 mb-1.5" htmlFor="bank-recipient-account">Recipient account</label>
          <select
            id="bank-recipient-account"
            value={selectedAccountId}
            onChange={e => setSelectedAccountId(e.target.value)}
            className="w-full bg-card border border-card-hover rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent transition-colors duration-150"
          >
            <option value="">Select account</option>
            {recipientAccounts.map(a => (
              <option key={a.id} value={a.id}>{a.details?.iban ?? a.iban ?? a.id}</option>
            ))}
          </select>
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowAddForm(show => !show)}
        className="text-sm text-accent hover:text-accent-hover cursor-pointer"
      >
        + Add recipient
      </button>

      {showAddForm && (
        <Card className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name" className="bg-card border border-card-hover rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accent" />
            <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name" className="bg-card border border-card-hover rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accent" />
          </div>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" className="w-full bg-card border border-card-hover rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accent" />
          <input value={iban} onChange={e => setIban(e.target.value)} placeholder="IBAN" className="w-full bg-card border border-card-hover rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accent font-mono" />
          <input value={accountHolderName} onChange={e => setAccountHolderName(e.target.value)} placeholder="Account holder name" className="w-full bg-card border border-card-hover rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accent" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={country} onChange={e => setCountry(e.target.value.toUpperCase())} placeholder="Country" className="bg-card border border-card-hover rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accent" />
            <input value={currency} onChange={e => setCurrency(e.target.value.toUpperCase())} placeholder="Currency" className="bg-card border border-card-hover rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accent" />
          </div>
          <Button fullWidth onClick={handleAddRecipient} loading={loading}>Save recipient</Button>
        </Card>
      )}

      <div>
        <label className="block text-xs text-gray-500 mb-1.5" htmlFor="bank-amount">Amount</label>
        <div className="relative">
          <input
            id="bank-amount"
            type="number"
            min="0.1"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-full bg-card border border-card-hover rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors duration-150 pr-16"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">USDC</span>
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1.5" htmlFor="bank-memo">Memo (optional)</label>
        <input
          id="bank-memo"
          type="text"
          placeholder="Payment reference"
          value={memo}
          onChange={e => setMemo(e.target.value)}
          className="w-full bg-card border border-card-hover rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors duration-150"
        />
      </div>

      <Button
        fullWidth
        onClick={handleReview}
        loading={loading}
        disabled={!kycOk || !amount || !selectedAccountId || !wallet}
      >
        Review
      </Button>
    </div>
  )
}

function P2PFlow({ wallet, addTransfer, refreshWallet, kycOk }) {
  const [step, setStep] = useState(1)
  const [destWalletId, setDestWalletId] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const walletIdValid = /^wal_[a-zA-Z0-9]+$/.test(destWalletId)

  async function handleConfirm() {
    if (!amount || isNaN(Number(amount)) || Number(amount) < 0.1) {
      showToast('Enter a valid amount (min 0.1)', 'error')
      return
    }
    setLoading(true)
    try {
      const tx = await createPayout({
        fromWalletId: wallet.id,
        amount: Number(amount),
        currency: 'USDC',
        toId: destWalletId,
        toCurrency: 'USDC',
      })
      const transfer = {
        id: tx.id ?? `txn_${Date.now()}`,
        type: 'wallet_to_wallet',
        state: tx.state ?? 'pending',
        from: { identifier: wallet.id, amount, currency: 'USDC' },
        to: { identifier: destWalletId },
        createdAt: new Date().toISOString(),
      }
      addTransfer(transfer)
      refreshWallet()
      setResult(transfer)
      showToast('P2P transfer initiated')
      setStep(3)
    } catch {
      // Error toast already fired
    } finally {
      setLoading(false)
    }
  }

  if (step === 3 && result) {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto">
          <CheckCircle2 size={32} className="text-success" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Transfer sent</h2>
          <p className="text-sm text-gray-400 mt-1">Your P2P transfer is being processed</p>
        </div>
        <Card className="p-4 text-left">
          <p className="text-xs text-gray-500 mb-0.5">Transaction ID</p>
          <p className="text-sm font-mono text-gray-200 break-all">{result.id}</p>
          <p className="text-xs text-gray-500 mt-3 mb-0.5">Amount</p>
          <p className="text-sm text-gray-200">{formatAmount(amount, 'USDC')}</p>
        </Card>
        <Button fullWidth onClick={() => navigate('/')}>Back to home</Button>
      </div>
    )
  }

  if (step === 2) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Review transfer</h2>
        <Card className="p-5 space-y-3">
          <div><p className="text-xs text-gray-500">To wallet</p><p className="text-sm font-mono text-gray-400 text-xs">{destWalletId}</p></div>
          <div><p className="text-xs text-gray-500">Amount</p><p className="text-sm font-semibold text-white">{formatAmount(amount, 'USDC')}</p></div>
          {note && <div><p className="text-xs text-gray-500">Note</p><p className="text-sm text-gray-200">{note}</p></div>}
        </Card>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => setStep(1)} className="flex-1">Back</Button>
          <Button onClick={handleConfirm} loading={loading} className="flex-1">Confirm &amp; Send</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-gray-500 mb-1.5" htmlFor="p2p-wallet">Recipient wallet ID</label>
        <input
          id="p2p-wallet"
          type="text"
          placeholder="wal_..."
          value={destWalletId}
          onChange={e => setDestWalletId(e.target.value.trim())}
          className="w-full bg-card border border-card-hover rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors duration-150 font-mono"
        />
        {destWalletId && !walletIdValid && <p className="text-xs text-danger mt-1">Enter a valid wallet ID (wal_...)</p>}
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1.5" htmlFor="p2p-amount">Amount</label>
        <div className="relative">
          <input
            id="p2p-amount"
            type="number"
            min="0.1"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-full bg-card border border-card-hover rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors duration-150 pr-16"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">USDC</span>
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1.5" htmlFor="p2p-note">Note (optional)</label>
        <input
          id="p2p-note"
          type="text"
          placeholder="What's this for?"
          value={note}
          onChange={e => setNote(e.target.value)}
          className="w-full bg-card border border-card-hover rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors duration-150"
        />
      </div>

      <Button
        fullWidth
        onClick={() => setStep(2)}
        disabled={!kycOk || !walletIdValid || !amount || !wallet}
      >
        Review
      </Button>
    </div>
  )
}

export default function Send() {
  const { wallet, addTransfer, refreshWallet, customer } = useApp()
  const navigate = useNavigate()
  const [mode, setMode] = useState('bank')
  const status = customer?.verificationStatus
  const kycOk = canSend(status)
  const banner = kycBanner(status)

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-28 space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-card transition-colors duration-150 cursor-pointer text-gray-400 hover:text-white">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-white">Send</h1>
      </div>

      <div className="flex gap-1 bg-card rounded-xl p-1">
        {[
          { id: 'bank', label: 'Bank payout', icon: Building2 },
          { id: 'p2p', label: 'P2P Transfer', icon: User },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setMode(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-colors duration-150 cursor-pointer ${
              mode === id
                ? 'bg-card-hover text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {banner && (
        <p className={`text-xs text-center ${status === 'rejected' ? 'text-danger' : 'text-warning'}`}>{banner}</p>
      )}

      {mode === 'bank'
        ? <BankPayoutFlow wallet={wallet} addTransfer={addTransfer} refreshWallet={refreshWallet} kycOk={kycOk} customer={customer} />
        : <P2PFlow wallet={wallet} addTransfer={addTransfer} refreshWallet={refreshWallet} kycOk={kycOk} />}
    </div>
  )
}
