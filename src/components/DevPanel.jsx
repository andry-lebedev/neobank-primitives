import { useEffect, useRef, useState } from 'react'
import { X, Activity, Database, ChevronDown, ChevronRight, Terminal } from 'lucide-react'
import { addDevListener, removeDevListener } from '../api/client'
import { useApp } from '../context/AppContext'

const METHOD_COLORS = {
  GET:    'bg-blue-500/20 text-blue-400',
  POST:   'bg-orange-500/20 text-orange-400',
  PATCH:  'bg-purple-500/20 text-purple-400',
  PUT:    'bg-purple-500/20 text-purple-400',
  DELETE: 'bg-red-500/20 text-red-400',
}

function RequestEntry({ entry, isNew }) {
  const [expanded, setExpanded] = useState(false)
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <div
      className={`border-b border-[#374151] last:border-0 ${
        !prefersReduced && isNew ? 'animate-slide-in-top' : ''
      }`}
    >
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-2 p-3 hover:bg-[#1F2937] transition-colors duration-150 cursor-pointer text-left"
      >
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${METHOD_COLORS[entry.method] ?? 'bg-gray-500/20 text-gray-400'}`}>
          {entry.method}
        </span>
        <span className="flex-1 text-xs text-gray-300 font-mono truncate">
          {entry.url?.replace(/^\/v[12]/, '')}
        </span>
        <span className="flex-shrink-0 flex items-center gap-1.5">
          {entry.status === 'pending' ? (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          ) : entry.status === 'success' ? (
            <span className="text-[10px] text-green-400 font-mono">{entry.statusCode}</span>
          ) : (
            <span className="text-[10px] text-red-400 font-mono">{entry.statusCode ?? 'ERR'}</span>
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
              <pre className="text-[11px] text-gray-300 bg-[#111827] rounded-lg p-2 overflow-x-auto leading-relaxed">
                {JSON.stringify(entry.requestBody, null, 2)}
              </pre>
            </div>
          )}
          {entry.responseBody && (
            <div>
              <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wide">Response</p>
              <pre className="text-[11px] text-gray-300 bg-[#111827] rounded-lg p-2 overflow-x-auto leading-relaxed max-h-48">
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
    <div className="border-b border-[#374151] last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 p-3 hover:bg-[#1F2937] transition-colors duration-150 cursor-pointer text-left"
      >
        {open ? <ChevronDown size={13} className="text-gray-500" /> : <ChevronRight size={13} className="text-gray-500" />}
        <span className="text-xs font-medium text-gray-300">{title}</span>
      </button>
      {open && (
        <pre className="text-[11px] text-gray-300 bg-[#111827] rounded-lg mx-3 mb-3 p-2 overflow-x-auto leading-relaxed max-h-40">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  )
}

export default function DevPanel() {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('requests')
  const [requests, setRequests] = useState([])
  const [newIds, setNewIds] = useState(new Set())
  const [unread, setUnread] = useState(0)
  const { customer, wallet, transferLog } = useApp()

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

  const stateSnapshot = {
    customer: customer ? { id: customer.id, name: `${customer.firstName} ${customer.lastName}`, status: customer.status } : null,
    wallet: wallet ? { id: wallet.id, address: wallet.address?.slice(0, 10) + '…', balances: wallet.balances } : null,
    transferLog: transferLog.map(t => ({ id: t.id, type: t.type, state: t.state })),
  }

  return (
    <>
      {/* FAB toggle */}
      <button
        onClick={open ? () => setOpen(false) : handleOpen}
        className="fixed bottom-20 right-4 md:bottom-6 z-50 w-12 h-12 rounded-full bg-[#F97316] hover:bg-[#EA6C0A] text-white flex items-center justify-center shadow-lg transition-colors duration-150 cursor-pointer"
        aria-label="Toggle developer panel"
      >
        {open ? <X size={20} /> : <Terminal size={20} />}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Panel — desktop: right slide-in, mobile: bottom sheet */}
      <div
        className={`fixed z-40 bg-[#0F172A] border-[#374151] flex flex-col transition-transform duration-300 ease-in-out
          md:top-0 md:right-0 md:h-full md:w-96 md:border-l
          bottom-0 left-0 right-0 h-[65vh] rounded-t-2xl border-t md:rounded-none
          ${open
            ? 'translate-y-0 md:translate-x-0'
            : 'translate-y-full md:translate-y-0 md:translate-x-full'
          }
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#374151] flex-shrink-0">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-[#F97316]" />
            <span className="text-sm font-semibold text-white">Dev Panel</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg hover:bg-[#1F2937] transition-colors duration-150 cursor-pointer text-gray-400 hover:text-white"
            aria-label="Close dev panel"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#374151] flex-shrink-0">
          {[
            { id: 'requests', label: 'Requests', icon: Activity },
            { id: 'state', label: 'State', icon: Database },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors duration-150 cursor-pointer border-b-2 ${
                activeTab === id
                  ? 'border-[#F97316] text-[#F97316]'
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
        </div>
      </div>
    </>
  )
}
