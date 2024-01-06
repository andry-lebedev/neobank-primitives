const VARIANTS = {
  pending:        'bg-warning/20 text-warning',
  in_progress:    'bg-warning/20 text-warning',
  awaiting_funds: 'bg-warning/20 text-warning',
  completed:      'bg-success/20 text-success',
  approved:       'bg-success/20 text-success',
  failed:         'bg-danger/20 text-danger',
  rejected:       'bg-danger/20 text-danger',
  not_started:    'bg-subtle/20 text-muted',
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
  const variant = VARIANTS[status] ?? 'bg-subtle/20 text-muted'
  const text = label ?? LABELS[status] ?? status
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${variant} ${className}`}>
      {text}
    </span>
  )
}
