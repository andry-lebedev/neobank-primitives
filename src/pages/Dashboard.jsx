import { useNavigate } from 'react-router-dom'
import { Bell, ArrowDownLeft, Send, History, AlertTriangle } from 'lucide-react'
import { useState } from 'react'
import Card from '../components/Card'
import Skeleton from '../components/Skeleton'
import TransactionRow from '../components/TransactionRow'
import CopyField from '../components/CopyField'
import { useApp } from '../context/AppContext'
import { formatBalance, getVirtualAccount } from '../utils'

function BalanceCard({ wallet }) {
  const balance = wallet?.balances?.[0]
  return (
    <Card className="p-5">
      <p className="text-xs text-gray-500 mb-1">Total balance</p>
      <p className="text-4xl font-bold text-white tracking-tight">
        {balance ? formatBalance(balance.amount) : '0.00'}
      </p>
      <p className="text-sm text-gray-400 mt-1">{balance?.currency ?? 'USDC'}</p>
      <div className="mt-4 pt-4 border-t border-[#374151]">
        <CopyField label="Wallet ID" value={wallet?.id} />
      </div>
    </Card>
  )
}

function AccountCard({ account }) {
  if (!account) return null
  return (
    <Card className="p-5">
      <p className="text-xs text-gray-500 mb-3">Virtual bank account</p>
      {account.type === 'sepa' ? (
        <>
          <CopyField label="IBAN" value={account.iban} />
          <CopyField label="BIC" value={account.bic} />
          {account.bankName && <CopyField label="Bank" value={account.bankName} />}
          {account.paymentReference && <CopyField label="Reference" value={account.paymentReference} />}
        </>
      ) : (
        <>
          <CopyField label="Account number" value={account.accountNumber} />
          <CopyField label="SWIFT" value={account.swiftCode} />
          {account.bankName && <CopyField label="Bank" value={account.bankName} />}
        </>
      )}
    </Card>
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-[#1F2937] border border-[#374151] p-5 space-y-3">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-10 w-40" />
      <Skeleton className="h-3 w-12" />
    </div>
  )
}

export default function Dashboard() {
  const { customer, wallet, accounts, transferLog, loading, error } = useApp()
  const navigate = useNavigate()
  const virtualAccount = getVirtualAccount(accounts)
  const recentTxns = transferLog.slice(0, 5)
  const kycOk = customer?.status === 'approved'

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-28 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-xs text-gray-500">{greeting}</p>
          <h1 className="text-xl font-bold text-white">
            {loading ? 'Loading…' : customer?.firstName ?? 'Welcome'}
          </h1>
        </div>
        <button className="p-2 rounded-full hover:bg-[#1F2937] transition-colors duration-150 cursor-pointer text-gray-400 hover:text-white" aria-label="Notifications">
          <Bell size={22} />
        </button>
      </div>

      {/* Boot error banner */}
      {error && (
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
          <AlertTriangle size={16} className="text-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-300">{error}</p>
        </div>
      )}

      {/* KYC banner */}
      {!loading && !kycOk && (
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
          <AlertTriangle size={16} className="text-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-300">
            Your account is under review. Sending is disabled until verification is complete.
          </p>
        </div>
      )}

      {/* Balance card */}
      {loading ? <SkeletonCard /> : <BalanceCard wallet={wallet} />}

      {/* Virtual account card */}
      {loading
        ? <SkeletonCard />
        : virtualAccount && <AccountCard account={virtualAccount} />}

      {/* Quick actions */}
      <div className="flex gap-3">
        {[
          { label: 'Add money', icon: ArrowDownLeft, to: '/add-money', always: true },
          { label: 'Send', icon: Send, to: '/send', always: false },
          { label: 'History', icon: History, to: '/history', always: true },
        ].map(({ label, icon: Icon, to, always }) => (
          <button
            key={to}
            onClick={() => navigate(to)}
            disabled={!always && !kycOk}
            className="flex-1 flex flex-col items-center gap-1.5 bg-[#1F2937] hover:bg-[#374151] border border-[#374151] rounded-2xl py-3 transition-colors duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Icon size={20} className="text-[#F97316]" />
            <span className="text-xs text-gray-300">{label}</span>
          </button>
        ))}
      </div>

      {/* Recent activity */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 mb-3">Recent activity</h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-2 w-20" />
                </div>
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        ) : recentTxns.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            <History size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">No transactions yet. Add money to get started.</p>
          </div>
        ) : (
          <div>
            {recentTxns.map(t => (
              <TransactionRow
                key={t.id}
                transfer={t}
                onClick={() => navigate('/history')}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
