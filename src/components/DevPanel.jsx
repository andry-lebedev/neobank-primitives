import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Activity, Database, ChevronDown, ChevronRight, Terminal, Zap, UserPlus } from 'lucide-react'
import { addDevListener, removeDevListener } from '../api/client'
import { sandboxTopup } from '../api/transfers'
import { useApp } from '../context/useApp'

const METHOD_COLORS = {
  GET:    'bg-info/20 text-info',
  POST:   'bg-accent/20 text-accent',
  PATCH:  'bg-purple-500/20 text-purple-400',
  PUT:    'bg-purple-500/20 text-purple-400',
  DELETE: 'bg-danger/20 text-danger',
}

function RequestEntry({ entry, isNew }) {
  const [expanded, setExpanded] = useState(false)
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <div
      className={`border-b border-card-hover last:border-0 ${
        !prefersReduced && isNew ? 'animate-slide-in-top' : ''
      }`}
    >
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-2 p-3 hover:bg-card transition-colors duration-150 cursor-pointer text-left"
      >
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${METHOD_COLORS[entry.method] ?? 'bg-gray-500/20 text-gray-400'}`}>
          {entry.method}
        </span>
        <span className="flex-1 text-xs text-gray-300 font-mono truncate">
          {entry.url?.replace(/^\/v[12]/, '')}
        </span>
        <span className="flex-shrink-0 flex items-center gap-1.5">
          {entry.status === 'pending' ? (
            <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
          ) : entry.status === 'success' ? (
            <span className="text-[10px] text-success font-mono">{entry.statusCode}</span>
          ) : (
            <span className="text-[10px] text-danger font-mono">{entry.statusCode ?? 'ERR'}</span>
          )}
          {entry.durationMs != null && (
            <span className="text-[10px] text-gray-500 font-mono">{entry.durationMs}ms</span>
          )}
          {expanded
            ? <ChevronDown size={13} className="text-gray-500" />
            : <ChevronRight size={13} className="text-gray-500" />}
        </span>
      </button>
      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          {entry.requestBody && (
            <div>
              <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wide">Request</p>
              <pre className="text-[11px] text-gray-300 bg-base rounded-lg p-2 overflow-x-auto leading-relaxed">
                {JSON.stringify(entry.requestBody, null, 2)}
              </pre>
            </div>
          )}
          {entry.responseBody && (
            <div>
              <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wide">Response</p>
              <pre className="text-[11px] text-gray-300 bg-base rounded-lg p-2 overflow-x-auto leading-relaxed max-h-48">
                {JSON.stringify(entry.responseBody, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function StateSection({ title, data }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="border-b border-card-hover last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 p-3 hover:bg-card transition-colors duration-150 cursor-pointer text-left"
      >
        {open ? <ChevronDown size={13} className="text-gray-500" /> : <ChevronRight size={13} className="text-gray-500" />}
        <span className="text-xs font-medium text-gray-300">{title}</span>
      </button>
      {open && (
        <pre className="text-[11px] text-gray-300 bg-base rounded-lg mx-3 mb-3 p-2 overflow-x-auto leading-relaxed max-h-40">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  )
}

const TOPUP_AMOUNTS = ['100', '500', '1000', '5000']

export default function DevPanel() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('requests')
  const [requests, setRequests] = useState([])
  const [newIds, setNewIds] = useState(new Set())
  const [unread, setUnread] = useState(0)
  const [topupAmount, setTopupAmount] = useState('1000')
  const [topupState, setTopupState] = useState('idle') // idle | loading | success | error
  const [topupMsg, setTopupMsg] = useState('')
  const { customer, wallet, transferLog, addTransfer, refreshWallet } = useApp()

  async function handleTopup() {
    const walletId = wallet?.id
    if (!walletId) return
    setTopupState('loading')
    setTopupMsg('')
    try {
      const result = await sandboxTopup({ walletId, amount: topupAmount, currency: 'USDC' })
      addTransfer({
        id: result.id,
        type: 'onramp',
        state: result.state,
        from: { rail: result.from?.rail ?? 'sandbox', currency: 'USDC', amount: topupAmount },
        to: { identifier: walletId },
        createdAt: new Date().toISOString(),
      })
      refreshWallet()
      setTopupState('success')
      setTopupMsg(`+${topupAmount} USDC · tx ${result.id}`)
      setTimeout(() => setTopupState('idle'), 3000)
    } catch (e) {
      setTopupState('error')
      setTopupMsg(e?.response?.data?.message ?? e.message ?? 'Topup failed')
      setTimeout(() => setTopupState('idle'), 4000)
    }
  }

  useEffect(() => {
    function handleEvent({ type, entry }) {
      if (type === 'request') {
        setRequests(prev => [entry, ...prev].slice(0, 50))
        setNewIds(prev => new Set([...prev, entry.id]))
        setTimeout(() => {
          setNewIds(prev => { const n = new Set(prev); n.delete(entry.id); return n })
        }, 400)
        setUnread(n => n + 1)
      } else if (type === 'response') {
        setRequests(prev => prev.map(r => r.id === entry.id ? entry : r))
      }
    }
    addDevListener(handleEvent)
    return () => removeDevListener(handleEvent)
  }, [])

  function handleOpen() {
    setOpen(true)
    setUnread(0)
  }

  function handleCreateCustomer() {
    setOpen(false)
    navigate('/onboarding')
  }

  const stateSnapshot = {
    customer: customer
      ? { id: customer.id, name: `${customer.personal?.firstName ?? ''} ${customer.personal?.lastName ?? ''}`.trim(), status: customer.verificationStatus }
      : null,
    wallet: wallet ? { id: wallet.id, address: wallet.address?.slice(0, 10) + '…', balances: wallet.balances } : null,
    transferLog: transferLog.map(t => ({ id: t.id, type: t.type, state: t.state })),
  }

  return (
    <>
      {/* FAB toggle */}
      <button
        onClick={open ? () => setOpen(false) : handleOpen}
        className="fixed bottom-20 right-4 md:bottom-6 z-50 w-12 h-12 rounded-full bg-accent hover:bg-accent-hover text-white flex items-center justify-center shadow-lg transition-colors duration-150 cursor-pointer"
        aria-label="Toggle developer panel"
      >
        {open ? <X size={20} /> : <Terminal size={20} />}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Panel — desktop: right slide-in, mobile: bottom sheet */}
      <div
        className={`fixed z-40 bg-[#0F172A] border-card-hover flex flex-col transition-transform duration-300 ease-in-out
          md:top-0 md:right-0 md:bottom-auto md:left-auto md:h-full md:w-96 md:border-l
          bottom-0 left-0 right-0 h-[65vh] rounded-t-2xl border-t md:rounded-none
          ${open
            ? 'max-md:translate-y-0 md:translate-x-0'
            : 'max-md:translate-y-full md:translate-x-full'
          }
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-card-hover flex-shrink-0">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-accent" />
            <span className="text-sm font-semibold text-white">Dev Panel</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg hover:bg-card transition-colors duration-150 cursor-pointer text-gray-400 hover:text-white"
            aria-label="Close dev panel"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-card-hover flex-shrink-0">
          {[
            { id: 'requests', label: 'Requests', icon: Activity },
            { id: 'state', label: 'State', icon: Database },
            { id: 'topup', label: 'Topup', icon: Zap },
            { id: 'actions', label: 'Actions', icon: UserPlus },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors duration-150 cursor-pointer border-b-2 ${
                activeTab === id
                  ? 'border-accent text-accent'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'requests' && (
            requests.length === 0
              ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-600 text-xs">
                  <Activity size={24} className="mb-2 opacity-40" />
                  No requests yet
                </div>
              )
              : requests.map(entry => (
                <RequestEntry
                  key={entry.id}
                  entry={entry}
                  isNew={newIds.has(entry.id)}
                />
              ))
          )}
          {activeTab === 'state' && (
            <div>
              <StateSection title="Customer" data={stateSnapshot.customer} />
              <StateSection title="Wallet" data={stateSnapshot.wallet} />
              <StateSection title="Transfer Log" data={stateSnapshot.transferLog} />
            </div>
          )}
          {activeTab === 'topup' && (
            <div className="p-4 space-y-4">
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-2">Amount (USDC)</p>
                <div className="grid grid-cols-4 gap-1.5 mb-3">
                  {TOPUP_AMOUNTS.map(a => (
                    <button
                      key={a}
                      onClick={() => setTopupAmount(a)}
                      className={`py-1.5 rounded-lg text-xs font-medium transition-colors duration-150 cursor-pointer ${
                        topupAmount === a
                          ? 'bg-accent text-white'
                          : 'bg-card text-gray-400 hover:text-white'
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={topupAmount}
                  onChange={e => setTopupAmount(e.target.value)}
                  className="w-full bg-base border border-card-hover rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-accent transition-colors duration-150"
                  placeholder="Custom amount"
                  min="1"
                />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Target wallet</p>
                <p className="text-[11px] text-gray-400 font-mono truncate">{wallet?.id || '—'}</p>
              </div>
              <button
                onClick={handleTopup}
                disabled={topupState === 'loading' || !topupAmount}
                className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white rounded-xl py-3 text-sm font-medium transition-colors duration-150 cursor-pointer"
              >
                <Zap size={14} />
                {topupState === 'loading' ? 'Crediting…' : `Credit ${topupAmount} USDC`}
              </button>
              {topupMsg && (
                <p className={`text-xs text-center font-mono ${topupState === 'error' ? 'text-danger' : 'text-success'}`}>
                  {topupMsg}
                </p>
              )}
              <p className="text-[10px] text-gray-600 text-center">Sandbox only · no real funds move</p>
            </div>
          )}
          {activeTab === 'actions' && (
            <div className="p-4 space-y-4">
              <button
                onClick={handleCreateCustomer}
                className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white rounded-xl py-3 text-sm font-medium transition-colors duration-150 cursor-pointer"
              >
                <UserPlus size={14} />
                Create customer
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
