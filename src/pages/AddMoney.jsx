import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Share2, QrCode } from 'lucide-react'
import Card from '../components/Card'
import CopyField from '../components/CopyField'
import { useApp } from '../context/AppContext'
import { showToast } from '../components/Toast'

const TABS = ['SEPA', 'SWIFT', 'Stablecoin']

function SepaTab({ account }) {
  if (!account) return <p className="text-sm text-gray-500 p-4">No SEPA account available.</p>
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
      <p className="text-xs text-gray-500 leading-relaxed">
        Send a bank transfer to the account above. Include the payment reference in the memo field so your funds are credited automatically. Funds typically arrive within 1–2 business days.
      </p>
    </div>
  )
}

function SwiftTab({ account }) {
  if (!account) return <p className="text-sm text-gray-500 p-4">No SWIFT account available.</p>
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
      <p className="text-xs text-gray-500 leading-relaxed">
        Use these details for international wire transfers. Funds typically arrive within 1–3 business days.
      </p>
    </div>
  )
}

function StablecoinTab({ wallet }) {
  return (
    <div className="space-y-4">
      <Card className="p-5">
        <p className="text-xs text-gray-500 mb-3">Send USDC or other stablecoins to this address</p>
        <CopyField label="Wallet address" value={wallet?.address} />
        {wallet?.chain && <CopyField label="Network" value={wallet.chain.toUpperCase()} />}
      </Card>
      <div className="flex justify-center">
        <div className="w-32 h-32 border-2 border-dashed border-[#374151] rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-600">
          <QrCode size={28} className="opacity-40" />
          <span className="text-[10px]">QR code</span>
        </div>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed text-center">
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
    let text = ''
    if (activeTab === 'SEPA' && account) {
      text = `IBAN: ${account.iban}\nBIC: ${account.bic}\nBank: ${account.bankName ?? ''}\nReference: ${account.paymentReference ?? ''}`
    } else if (activeTab === 'SWIFT' && account) {
      text = `Account: ${account.accountNumber}\nSWIFT: ${account.swiftCode}\nBank: ${account.bankName ?? ''}`
    } else {
      text = `Wallet address: ${wallet?.address ?? ''}\nNetwork: ${wallet?.chain?.toUpperCase() ?? ''}`
    }
    navigator.clipboard.writeText(text)
    showToast('Account details copied to clipboard')
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-28 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-[#1F2937] transition-colors duration-150 cursor-pointer text-gray-400 hover:text-white">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-white">Add money</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#1F2937] rounded-xl p-1">
        {availableTabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors duration-150 cursor-pointer ${
              activeTab === tab
                ? 'bg-[#374151] text-white'
                : 'text-gray-500 hover:text-gray-300'
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
        className="w-full flex items-center justify-center gap-2 bg-[#1F2937] hover:bg-[#374151] border border-[#374151] rounded-xl py-3 text-sm text-gray-300 transition-colors duration-150 cursor-pointer"
      >
        <Share2 size={16} />
        Share details
      </button>
    </div>
  )
}
