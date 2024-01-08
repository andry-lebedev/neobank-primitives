import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { TransferState, VerificationStatus } from '@/data/types'

const LABELS: Record<string, string> = {
  pending: 'Pending', in_progress: 'Processing', awaiting_funds: 'Awaiting funds',
  completed: 'Completed', failed: 'Failed',
  not_started: 'Not verified', approved: 'Verified', rejected: 'Rejected',
}

export function StatusBadge({ state }: { state: TransferState | VerificationStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'border-transparent bg-muted text-muted-foreground',
        (state === 'completed' || state === 'approved') && 'bg-success/10 text-success',
        (state === 'failed' || state === 'rejected') && 'bg-destructive/10 text-destructive',
        (state === 'pending' || state === 'in_progress') && 'bg-info/10 text-info',
      )}
    >
      {LABELS[state] ?? state}
    </Badge>
  )
}
