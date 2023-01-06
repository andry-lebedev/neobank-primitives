import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Share2, QrCode } from 'lucide-react'
import Card from '../components/Card'
import CopyField from '../components/CopyField'
import { useApp } from '../context/useApp'
import { showToast } from '../components/showToast'

function SepaTab({ account }) {
  if (!account) return <p className="text-sm text-subtle p-4">No SEPA account available.</p>
  return (
    <div className="space-y-4">
      <Card className="p-5">
        <CopyField label="IBAN" value={account.iban} />
        <CopyField label="BIC / SWIFT" value={account.bic} />
        {account.bankName && <CopyField label="Bank name" value={account.bankName} />}
        {account.accountHolderName && <CopyField label="Account holder" value={account.accountHolderName} />}
        {account.paymentReference && <CopyField label="Payment reference" value={account.paymentReference} />}
        {account.currency && <CopyField label="Currency" value={account.currency} />}
      </Card>
      <p className="text-xs text-subtle leading-relaxed">
        Send a bank transfer to the account above. Include the payment reference in the memo field so your funds are credited automatically. Funds typically arrive within 1–2 business days.
      </p>
    </div>
  )
}

function SwiftTab({ account }) {
  if (!account) return <p className="text-sm text-subtle p-4">No SWIFT account available.</p>
  return (
    <div className="space-y-4">
      <Card className="p-5">
        <CopyField label="Account number" value={account.accountNumber} />
        <CopyField label="SWIFT / BIC" value={account.swiftCode} />
        {account.bankName && <CopyField label="Bank name" value={account.bankName} />}
        {account.accountHolderName && <CopyField label="Account holder" value={account.accountHolderName} />}
        {account.routingNumber && <CopyField label="Routing number" value={account.routingNumber} />}
        {account.bankAddress && <CopyField label="Bank address" value={account.bankAddress} />}
      </Card>
      <p className="text-xs text-subtle leading-relaxed">
        Use these details for international wire transfers. Funds typically arrive within 1–3 business days.
      </p>
    </div>
  )
}

function StablecoinTab({ wallet }) {
  return (
    <div className="space-y-4">
      <Card className="p-5">
        <p className="text-xs text-subtle mb-3">Send USDC or other stablecoins to this address</p>
        {wallet?.address ? (
          <>
            <CopyField label="Wallet address" value={wallet.address} />
            {wallet?.chain && <CopyField label="Network" value={wallet.chain.toUpperCase()} />}
          </>
        ) : (
          <p className="text-sm text-subtle p-4">No wallet yet.</p>
        )}
      </Card>
      <div className="flex justify-center">
        <div className="w-32 h-32 border-2 border-dashed border-card-hover rounded-2xl flex flex-col items-center justify-center gap-2 text-faint">
          <QrCode size={28} className="opacity-40" />
          <span className="text-[10px]">QR code</span>
        </div>
      </div>
      <p className="text-xs text-subtle leading-relaxed text-center">
        Only send assets on the {wallet?.chain?.toUpperCase() ?? 'Polygon'} network to this address.
      </p>
    </div>
  )
}

export default function AddMoney() {
  const { accounts, wallet } = useApp()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('SEPA')

  const sepaAccount = accounts.find(a => a.source === 'virtual' && a.type === 'sepa')
  const swiftAccount = accounts.find(a => a.source === 'virtual' && a.type === 'swift')

  const availableTabs = [
    sepaAccount && 'SEPA',
    swiftAccount && 'SWIFT',
    'Stablecoin',
  ].filter(Boolean)

  function handleShare() {
    const account = activeTab === 'SEPA' ? sepaAccount : swiftAccount
    if (!account && activeTab !== 'Stablecoin') return
    if (activeTab === 'Stablecoin' && !wallet?.address) return
    let lines = []
    if (activeTab === 'SEPA' && account) {
      if (account.iban) lines.push(`IBAN: ${account.iban}`)
      if (account.bic) lines.push(`BIC: ${account.bic}`)
      if (account.bankName) lines.push(`Bank: ${account.bankName}`)
      if (account.accountHolderName) lines.push(`Account holder: ${account.accountHolderName}`)
      if (account.paymentReference) lines.push(`Reference: ${account.paymentReference}`)
      if (account.currency) lines.push(`Currency: ${account.currency}`)
    } else if (activeTab === 'SWIFT' && account) {
      if (account.accountNumber) lines.push(`Account: ${account.accountNumber}`)
      if (account.swiftCode) lines.push(`SWIFT: ${account.swiftCode}`)
      if (account.bankName) lines.push(`Bank: ${account.bankName}`)
      if (account.accountHolderName) lines.push(`Account holder: ${account.accountHolderName}`)
      if (account.routingNumber) lines.push(`Routing: ${account.routingNumber}`)
      if (account.bankAddress) lines.push(`Address: ${account.bankAddress}`)
    } else {
      if (wallet?.address) lines.push(`Wallet address: ${wallet.address}`)
      if (wallet?.chain) lines.push(`Network: ${wallet.chain.toUpperCase()}`)
    }
    navigator.clipboard.writeText(lines.join('\n'))
    showToast('Account details copied to clipboard')
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-28 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-card transition-colors duration-150 cursor-pointer text-muted hover:text-fg-strong">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-fg-strong">Add money</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-card rounded-xl p-1">
        {availableTabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors duration-150 cursor-pointer ${
              activeTab === tab
                ? 'bg-card-hover text-fg-strong'
                : 'text-subtle hover:text-fg-muted'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'SEPA' && <SepaTab account={sepaAccount} />}
      {activeTab === 'SWIFT' && <SwiftTab account={swiftAccount} />}
      {activeTab === 'Stablecoin' && <StablecoinTab wallet={wallet} />}

      {/* Share button */}
      <button
        onClick={handleShare}
        className="w-full flex items-center justify-center gap-2 bg-card hover:bg-card-hover border border-card-hover rounded-xl py-3 text-sm text-fg-muted transition-colors duration-150 cursor-pointer"
      >
        <Share2 size={16} />
        Share details
      </button>
    </div>
  )
}
