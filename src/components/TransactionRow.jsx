import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from 'lucide-react'
import Badge from './Badge'
import { formatAmount, relativeTime } from '../utils'

function getDirection(transfer) {
  if (transfer.type === 'onramp') return 'in'
  if (transfer.type === 'offramp') return 'out'
  return 'p2p'
}

function getDescription(transfer) {
  if (transfer.type === 'onramp') {
    const rail = (transfer.from?.rail ?? 'bank transfer').toUpperCase()
    return `Received via ${rail}`
  }
  if (transfer.type === 'offramp') return 'Bank payout'
  return 'P2P Transfer'
}

export default function TransactionRow({ transfer, onClick }) {
  const direction = getDirection(transfer)
  const isIn = direction === 'in'
  const amount = transfer.from?.amount ?? '0'
  const currency = transfer.from?.currency ?? 'USDC'

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 py-3 rounded-xl hover:bg-[#1F2937] px-2 -mx-2 transition-colors duration-150 cursor-pointer text-left"
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
        isIn ? 'bg-green-500/15' : direction === 'p2p' ? 'bg-blue-500/15' : 'bg-red-500/15'
      }`}>
        {isIn
          ? <ArrowDownLeft size={18} className="text-green-400" />
          : direction === 'p2p'
          ? <ArrowLeftRight size={18} className="text-blue-400" />
          : <ArrowUpRight size={18} className="text-red-400" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-200 truncate">{getDescription(transfer)}</p>
        <p className="text-xs text-gray-500 mt-0.5">{relativeTime(transfer.createdAt)}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={`text-sm font-semibold ${isIn ? 'text-green-400' : 'text-red-400'}`}>
          {isIn ? '+' : '−'}{formatAmount(amount, currency)}
        </p>
        <Badge status={transfer.state} className="mt-0.5" />
      </div>
    </button>
  )
}
