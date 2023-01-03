import { useNavigate } from 'react-router-dom'
import { ArrowLeft, LogOut, Shield } from 'lucide-react'
import Card from '../components/Card'
import Badge from '../components/Badge'
import CopyField from '../components/CopyField'
import Button from '../components/Button'
import { useApp } from '../context/AppContext'
import { getKycLabel, getVirtualAccount } from '../utils'

function Avatar({ firstName, lastName }) {
  const initials = [firstName?.[0], lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?'
  return (
    <div className="w-16 h-16 rounded-full bg-[#F97316]/20 flex items-center justify-center">
      <span className="text-xl font-bold text-white">{initials}</span>
    </div>
  )
}

function LoggedOutScreen() {
  return (
    <div className="min-h-screen bg-[#111827] flex flex-col items-center justify-center gap-6 px-4">
      <div className="w-16 h-16 rounded-full bg-[#1F2937] flex items-center justify-center">
        <LogOut size={28} className="text-gray-400" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-bold text-white">You've been signed out</h2>
        <p className="text-sm text-gray-400 mt-1">Your session has ended.</p>
      </div>
      <Button onClick={() => window.location.reload()}>Sign back in</Button>
    </div>
  )
}

export default function Profile() {
  const { customer, wallet, accounts, loggedOut, setLoggedOut } = useApp()
  const navigate = useNavigate()
  const kycInfo = getKycLabel(customer?.status)
  const virtualAccount = getVirtualAccount(accounts)

  if (loggedOut) return <LoggedOutScreen />

  const kycDescriptions = {
    not_started: 'Identity verification has not been initiated.',
    pending: 'Your identity is being reviewed. This usually takes 1–2 business days.',
    approved: 'Your identity has been verified.',
    rejected: 'We could not verify your identity. Please contact support.',
  }

  const kycBorderColors = {
    green: 'border-green-500/30',
    amber: 'border-amber-500/30',
    red: 'border-red-500/30',
    gray: 'border-[#374151]',
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-28 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-[#1F2937] transition-colors duration-150 cursor-pointer text-gray-400 hover:text-white">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-white">Profile</h1>
      </div>

      {/* Identity */}
      <div className="flex items-center gap-4">
        <Avatar firstName={customer?.firstName} lastName={customer?.lastName} />
        <div>
          <p className="text-lg font-bold text-white">
            {customer ? `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim() : '—'}
          </p>
          <p className="text-sm text-gray-400">{customer?.email ?? '—'}</p>
          {customer?.phone && <p className="text-sm text-gray-500">{customer.phone}</p>}
        </div>
      </div>

      {/* KYC status */}
      <Card className={`p-5 border ${kycBorderColors[kycInfo.color] ?? 'border-[#374151]'}`}>
        <div className="flex items-center gap-2 mb-2">
          <Shield size={16} className={kycInfo.color === 'green' ? 'text-green-400' : kycInfo.color === 'amber' ? 'text-amber-400' : kycInfo.color === 'red' ? 'text-red-400' : 'text-gray-400'} />
          <span className="text-sm font-semibold text-white">Identity verification</span>
        </div>
        <Badge status={customer?.status ?? 'not_started'} className="mb-2" />
        <p className="text-xs text-gray-400 mt-1 leading-relaxed">
          {kycDescriptions[customer?.status] ?? kycDescriptions.not_started}
        </p>
      </Card>

      {/* Account details */}
      <Card className="p-5">
        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-3">Account details</p>
        <CopyField label="Customer ID" value={customer?.id} />
        {customer?.type && (
          <div className="py-2.5 border-b border-[#374151] last:border-0">
            <p className="text-xs text-gray-500 mb-0.5">Account type</p>
            <span className="text-xs bg-[#374151] text-gray-300 rounded-full px-2 py-0.5 capitalize">
              {customer.type}
            </span>
          </div>
        )}
      </Card>

      {/* Wallet */}
      {wallet && (
        <Card className="p-5">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-3">Wallet</p>
          <CopyField label="Wallet ID" value={wallet.id} />
          <CopyField label="Address" value={wallet.address} />
          {wallet.chain && <CopyField label="Network" value={wallet.chain.toUpperCase()} />}
        </Card>
      )}

      {/* Virtual account */}
      {virtualAccount && (
        <Card className="p-5">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-3">Virtual bank account</p>
          {virtualAccount.type === 'sepa' ? (
            <>
              <CopyField label="IBAN" value={virtualAccount.iban} />
              <CopyField label="BIC" value={virtualAccount.bic} />
              {virtualAccount.paymentReference && (
                <CopyField label="Reference" value={virtualAccount.paymentReference} />
              )}
            </>
          ) : (
            <>
              <CopyField label="Account number" value={virtualAccount.accountNumber} />
              <CopyField label="SWIFT" value={virtualAccount.swiftCode} />
            </>
          )}
        </Card>
      )}

      {/* Log out */}
      <Button
        variant="danger"
        fullWidth
        onClick={() => setLoggedOut(true)}
        className="border border-red-500/20"
      >
        <LogOut size={15} />
        Log out
      </Button>
    </div>
  )
}
