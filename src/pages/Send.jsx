import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, User, Building2 } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import { useApp } from '../context/AppContext'
import { createPayoutQuote, createPayout } from '../api/transfers'
import { resolveEmail, formatAmount } from '../utils'
import { showToast } from '../components/Toast'

// ─── Bank Payout ────────────────────────────────────────────────────────────

function BankPayoutFlow({ wallet, addTransfer, kycOk }) {
  const [step, setStep] = useState(1)
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')
  const [quote, setQuote] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const recipientAccountId = import.meta.env.VITE_RECIPIENT_ACCOUNT_ID
  const navigate = useNavigate()

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
        toAccountId: recipientAccountId,
        toCurrency: 'EUR',
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
        toId: recipientAccountId,
        toCurrency: 'EUR',
      })
      const transfer = {
        id: tx.id ?? `txn_${Date.now()}`,
        type: 'offramp',
        state: tx.state ?? 'pending',
        from: { identifier: wallet.id, amount, currency: 'USDC' },
        to: { identifier: recipientAccountId },
        createdAt: new Date().toISOString(),
      }
      addTransfer(transfer)
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
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
          <CheckCircle2 size={32} className="text-green-400" />
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
          <div><p className="text-xs text-gray-500">Amount</p><p className="text-sm text-gray-200">{formatAmount(amount, 'USDC')}</p></div>
          {quote && (
            <>
              <div><p className="text-xs text-gray-500">Fee</p><p className="text-sm text-gray-200">{quote.fee ? `${quote.fee.amount} ${quote.fee.currency}` : '—'}</p></div>
              <div><p className="text-xs text-gray-500">You receive</p><p className="text-sm font-semibold text-white">{quote.destination_amount} EUR</p></div>
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
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#374151] flex items-center justify-center flex-shrink-0">
            <Building2 size={18} className="text-gray-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-200">Demo Recipient</p>
            <p className="text-xs text-gray-500 font-mono">{recipientAccountId ? `${recipientAccountId.slice(0, 12)}…` : 'racc_demo'}</p>
          </div>
        </div>
      </Card>

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
            className="w-full bg-[#1F2937] border border-[#374151] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#F97316] transition-colors duration-150 pr-16"
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
          className="w-full bg-[#1F2937] border border-[#374151] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#F97316] transition-colors duration-150"
        />
      </div>

      <Button
        fullWidth
        onClick={handleReview}
        loading={loading}
        disabled={!kycOk || !amount}
      >
        Review
      </Button>
      {!kycOk && (
        <p className="text-xs text-amber-400 text-center">Verification required to send funds</p>
      )}
    </div>
  )
}

// ─── P2P Transfer ────────────────────────────────────────────────────────────

function P2PFlow({ wallet, addTransfer, kycOk }) {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [resolvedWalletId, setResolvedWalletId] = useState(null)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const demoEmail = import.meta.env.VITE_DEMO_EMAIL
  const recipientWalletId = import.meta.env.VITE_RECIPIENT_WALLET_ID

  function handleEmailChange(e) {
    const val = e.target.value
    setEmail(val)
    const resolved = resolveEmail(val, demoEmail, recipientWalletId)
    setResolvedWalletId(resolved)
  }

  function handleEmailBlur() {
    if (email && !resolvedWalletId) {
      showToast('User not found. Try ' + (demoEmail ?? 'the demo email'), 'error')
      setEmail('')
    }
  }

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
        toId: resolvedWalletId,
        toCurrency: 'USDC',
      })
      const transfer = {
        id: tx.id ?? `txn_${Date.now()}`,
        type: 'wallet_to_wallet',
        state: tx.state ?? 'pending',
        from: { identifier: wallet.id, amount, currency: 'USDC' },
        to: { identifier: resolvedWalletId },
        createdAt: new Date().toISOString(),
      }
      addTransfer(transfer)
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
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
          <CheckCircle2 size={32} className="text-green-400" />
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
          <div><p className="text-xs text-gray-500">To</p><p className="text-sm text-gray-200">{email}</p></div>
          <div><p className="text-xs text-gray-500">Wallet</p><p className="text-sm font-mono text-gray-400 text-xs">{resolvedWalletId}</p></div>
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
        <label className="block text-xs text-gray-500 mb-1.5" htmlFor="p2p-email">Recipient email</label>
        <input
          id="p2p-email"
          type="email"
          placeholder={demoEmail ?? 'email@example.com'}
          value={email}
          onChange={handleEmailChange}
          onBlur={handleEmailBlur}
          className="w-full bg-[#1F2937] border border-[#374151] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#F97316] transition-colors duration-150"
        />
      </div>

      {resolvedWalletId && (
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F97316]/20 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-[#F97316]">AK</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-200">Arthur K.</p>
              <p className="text-xs text-green-400">✓ User found</p>
            </div>
          </div>
        </Card>
      )}

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
            className="w-full bg-[#1F2937] border border-[#374151] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#F97316] transition-colors duration-150 pr-16"
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
          className="w-full bg-[#1F2937] border border-[#374151] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#F97316] transition-colors duration-150"
        />
      </div>

      <Button
        fullWidth
        onClick={() => setStep(2)}
        disabled={!kycOk || !resolvedWalletId || !amount}
      >
        Review
      </Button>
      {!kycOk && (
        <p className="text-xs text-amber-400 text-center">Verification required to send funds</p>
      )}
    </div>
  )
}

// ─── Send page ───────────────────────────────────────────────────────────────

export default function Send() {
  const { wallet, addTransfer, customer } = useApp()
  const navigate = useNavigate()
  const [mode, setMode] = useState('bank')
  const kycOk = customer?.status === 'approved'

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-28 space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-[#1F2937] transition-colors duration-150 cursor-pointer text-gray-400 hover:text-white">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-white">Send</h1>
      </div>

      {/* Segmented control */}
      <div className="flex gap-1 bg-[#1F2937] rounded-xl p-1">
        {[
          { id: 'bank', label: 'Bank payout', icon: Building2 },
          { id: 'p2p', label: 'P2P Transfer', icon: User },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setMode(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-colors duration-150 cursor-pointer ${
              mode === id
                ? 'bg-[#374151] text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {mode === 'bank'
        ? <BankPayoutFlow wallet={wallet} addTransfer={addTransfer} kycOk={kycOk} />
        : <P2PFlow wallet={wallet} addTransfer={addTransfer} kycOk={kycOk} />}
    </div>
  )
}
