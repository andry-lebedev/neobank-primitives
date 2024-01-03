const VARIANTS = {
  pending:        'bg-amber-500/20 text-amber-400',
  in_progress:    'bg-amber-500/20 text-amber-400',
  awaiting_funds: 'bg-amber-500/20 text-amber-400',
  completed:      'bg-green-500/20 text-green-400',
  approved:       'bg-green-500/20 text-green-400',
  failed:         'bg-red-500/20 text-red-400',
  rejected:       'bg-red-500/20 text-red-400',
  not_started:    'bg-gray-500/20 text-gray-400',
}

const LABELS = {
  pending:        'Pending',
  in_progress:    'In Progress',
  awaiting_funds: 'Awaiting Funds',
  completed:      'Completed',
  approved:       'Verified',
  failed:         'Failed',
  rejected:       'Rejected',
  not_started:    'Not Started',
}

export default function Badge({ status, label, className = '' }) {
  const variant = VARIANTS[status] ?? 'bg-gray-500/20 text-gray-400'
  const text = label ?? LABELS[status] ?? status
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${variant} ${className}`}>
      {text}
    </span>
  )
}
