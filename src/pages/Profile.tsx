import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, LogOut, Shield } from 'lucide-react'
import Card from '../components/Card'
import Badge from '../components/Badge'
import CopyField from '../components/CopyField'
import Button from '../components/Button'
import { useApp } from '../context/useApp'
import { getKycLabel, getVirtualAccount, needsKyc } from '../utils'
import { initiateKyc } from '../api/customers'
import { track, notify } from '../integrations'
import axios from 'axios'
import type { Account, VerificationStatus } from '../types'

interface KycInfo {
  label: string
  color: string
  description: string
}

function Avatar({ firstName, lastName }: { firstName?: string; lastName?: string }) {
  const initials = [firstName?.[0], lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?'
  return (
    <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
      <span className="text-xl font-bold text-fg-strong">{initials}</span>
    </div>
  )
}

function LoggedOutScreen() {
  return (
    <div className="min-h-screen bg-base flex flex-col items-center justify-center gap-6 px-4">
      <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center">
        <LogOut size={28} className="text-muted" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-bold text-fg-strong">You've been signed out</h2>
        <p className="text-sm text-muted mt-1">Your session has ended.</p>
      </div>
      <Button onClick={() => window.location.reload()}>Sign back in</Button>
    </div>
  )
}

export default function Profile() {
  const { customer, wallet, accounts, loggedOut, setLoggedOut, refreshCustomer } = useApp()
  const navigate = useNavigate()
  const verificationStatus = customer?.verificationStatus
  const firstName = customer?.personal?.firstName ?? ''
  const lastName = customer?.personal?.lastName ?? ''
  const kycInfo: KycInfo = getKycLabel(verificationStatus)
  const virtualAccount: Account | null = getVirtualAccount(accounts)
  const [kycLoading, setKycLoading] = useState(false)
  const canVerify = needsKyc(verificationStatus)

  async function handleVerify() {
    if (!customer?.id) return
    setKycLoading(true)
    try {
      const { verificationUrl } = await initiateKyc(customer.id, 'simplified')
      track('kyc_initiated', { customerId: customer.id, level: 'simplified' })
      if (verificationUrl) {
        window.open(verificationUrl, '_blank', 'noopener')
      }
    } catch (e) {
      const message = axios.isAxiosError<{ message?: string }>(e) ? e.response?.data?.message : undefined
      notify(message ?? 'Could not start verification', 'error')
    } finally {
      setKycLoading(false)
    }
  }

  if (loggedOut) return <LoggedOutScreen />

  const kycDescriptions: Record<VerificationStatus, string> = {
    not_started: 'Identity verification has not been initiated.',
    pending: 'Your identity is being reviewed. This usually takes 1–2 business days.',
    approved: 'Your identity has been verified.',
    rejected: 'We could not verify your identity. Please contact support.',
  }

  const kycBorderColors: Record<string, string> = {
    green: 'border-success/30',
    amber: 'border-warning/30',
    red: 'border-danger/30',
    gray: 'border-card-hover',
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-28 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-card transition-colors duration-150 cursor-pointer text-muted hover:text-fg-strong">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-fg-strong">Profile</h1>
      </div>

      {/* Identity */}
      <div className="flex items-center gap-4">
        <Avatar firstName={firstName} lastName={lastName} />
        <div>
          <p className="text-lg font-bold text-fg-strong">
            {customer ? `${firstName} ${lastName}`.trim() || '—' : '—'}
          </p>
          <p className="text-sm text-muted">{customer?.personal?.email ?? '—'}</p>
          {customer?.personal?.phone && <p className="text-sm text-subtle">{customer.personal.phone}</p>}
        </div>
      </div>

      {/* KYC status */}
      <Card className={`p-5 border ${kycBorderColors[kycInfo.color] ?? 'border-card-hover'}`}>
        <div className="flex items-center gap-2 mb-2">
          <Shield size={16} className={kycInfo.color === 'green' ? 'text-success' : kycInfo.color === 'amber' ? 'text-warning' : kycInfo.color === 'red' ? 'text-danger' : 'text-muted'} />
          <span className="text-sm font-semibold text-fg-strong">Identity verification</span>
        </div>
        <Badge status={verificationStatus ?? 'not_started'} className="mb-2" />
        <p className="text-xs text-muted mt-1 leading-relaxed">
          {kycDescriptions[verificationStatus ?? 'not_started'] ?? kycDescriptions.not_started}
        </p>
        {canVerify && (
          <Button
            fullWidth
            loading={kycLoading}
            onClick={handleVerify}
            className="mt-3"
          >
            <Shield size={15} />
            Verify identity
          </Button>
        )}
        {verificationStatus === 'pending' && (
          <Button
            variant="ghost"
            fullWidth
            onClick={refreshCustomer}
            className="mt-3"
          >
            Refresh status
          </Button>
        )}
      </Card>

      {/* Account details */}
      <Card className="p-5">
        <p className="text-xs text-subtle font-semibold uppercase tracking-wide mb-3">Account details</p>
        <CopyField label="Customer ID" value={customer?.id} />
        {customer?.type && (
          <div className="py-2.5 border-b border-card-hover last:border-0">
            <p className="text-xs text-subtle mb-0.5">Account type</p>
            <span className="text-xs bg-card-hover text-fg-muted rounded-full px-2 py-0.5 capitalize">
              {customer.type}
            </span>
          </div>
        )}
      </Card>

      {/* Wallet */}
      {wallet && (
        <Card className="p-5">
          <p className="text-xs text-subtle font-semibold uppercase tracking-wide mb-3">Wallet</p>
          <CopyField label="Wallet ID" value={wallet.id} />
          <CopyField label="Address" value={wallet.address} />
          {wallet.chain && <CopyField label="Network" value={wallet.chain.toUpperCase()} />}
        </Card>
      )}

      {/* Virtual account */}
      {virtualAccount && (
        <Card className="p-5">
          <p className="text-xs text-subtle font-semibold uppercase tracking-wide mb-3">Virtual bank account</p>
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
        className="border border-danger/20"
      >
        <LogOut size={15} />
        Log out
      </Button>
    </div>
  )
}
