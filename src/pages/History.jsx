import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Inbox } from 'lucide-react'
import TransactionRow from '../components/TransactionRow'
import { useApp } from '../context/useApp'
import { groupByDate, formatAmount } from '../utils'

const DIRECTION_FILTERS = ['All', 'In', 'Out']
const STATUS_FILTERS = ['All', 'Completed', 'Pending', 'Failed']

function DetailPanel({ transfer, onClose }) {
  return (
    <div className="mt-2 mb-3 bg-[#111827] rounded-xl p-4 space-y-2 text-xs">
      <div className="flex justify-between">
        <span className="text-gray-500">Transaction ID</span>
        <span className="text-gray-300 font-mono break-all max-w-[60%] text-right">{transfer.id}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-500">Type</span>
        <span className="text-gray-300">{transfer.type}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-500">Status</span>
        <span className="text-gray-300">{transfer.state}</span>
      </div>
      {transfer.from?.rail && (
        <div className="flex justify-between">
          <span className="text-gray-500">Rail</span>
          <span className="text-gray-300 uppercase">{transfer.from.rail}</span>
        </div>
      )}
      <div className="flex justify-between">
        <span className="text-gray-500">Amount</span>
        <span className="text-gray-300">{formatAmount(transfer.from?.amount, transfer.from?.currency)}</span>
      </div>
      {transfer.from?.identifier && (
        <div className="flex justify-between">
          <span className="text-gray-500">From</span>
          <span className="text-gray-400 font-mono break-all max-w-[60%] text-right">{transfer.from.identifier}</span>
        </div>
      )}
      {transfer.to?.identifier && (
        <div className="flex justify-between">
          <span className="text-gray-500">To</span>
          <span className="text-gray-400 font-mono break-all max-w-[60%] text-right">{transfer.to.identifier}</span>
        </div>
      )}
      <div className="flex justify-between">
        <span className="text-gray-500">Date</span>
        <span className="text-gray-300">{new Date(transfer.createdAt).toLocaleString()}</span>
      </div>
      {transfer.failureReason && (
        <div className="flex justify-between">
          <span className="text-gray-500">Failure reason</span>
          <span className="text-danger">{transfer.failureReason}</span>
        </div>
      )}
      <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xs cursor-pointer transition-colors duration-150 pt-1">
        ↑ Collapse
      </button>
    </div>
  )
}

export default function History() {
  const { transferLog } = useApp()
  const navigate = useNavigate()
  const [dirFilter, setDirFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [expandedId, setExpandedId] = useState(null)

  function matchesDirection(t) {
    if (dirFilter === 'All') return true
    if (dirFilter === 'In') return t.type === 'onramp'
    if (dirFilter === 'Out') return t.type === 'offramp' || t.type === 'wallet_to_wallet'
    return true
  }

  function matchesStatus(t) {
    if (statusFilter === 'All') return true
    if (statusFilter === 'Completed') return t.state === 'completed'
    if (statusFilter === 'Pending') return ['pending', 'in_progress', 'awaiting_funds'].includes(t.state)
    if (statusFilter === 'Failed') return t.state === 'failed'
    return true
  }

  const filtered = [...transferLog]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .filter(t => matchesDirection(t) && matchesStatus(t))
  const grouped = groupByDate(filtered)
  const dateLabels = Object.keys(grouped).sort((a, b) => {
    const newestA = Math.max(...grouped[a].map(t => new Date(t.createdAt).getTime()))
    const newestB = Math.max(...grouped[b].map(t => new Date(t.createdAt).getTime()))
    return newestB - newestA
  })

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-28 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-[#1F2937] transition-colors duration-150 cursor-pointer text-gray-400 hover:text-white">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-white">Transaction history</h1>
      </div>

      {/* Direction filter */}
      <div className="flex gap-2">
        {DIRECTION_FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setDirFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors duration-150 cursor-pointer border ${
              dirFilter === f
                ? 'bg-[#F97316] border-[#F97316] text-white'
                : 'border-[#374151] text-gray-400 hover:text-gray-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors duration-150 cursor-pointer border ${
              statusFilter === f
                ? 'bg-[#1F2937] border-[#F97316] text-[#F97316]'
                : 'border-[#374151] text-gray-400 hover:text-gray-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-600">
          <Inbox size={40} className="mb-3 opacity-40" />
          <p className="text-sm">No transactions yet. Add money to get started.</p>
        </div>
      ) : (
        dateLabels.map(label => (
          <div key={label}>
            <h2 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">{label}</h2>
            {grouped[label].map(t => (
              <div key={t.id}>
                <TransactionRow
                  transfer={t}
                  onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                />
                {expandedId === t.id && (
                  <DetailPanel transfer={t} onClose={() => setExpandedId(null)} />
                )}
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  )
}
