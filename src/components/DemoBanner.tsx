import { Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GoLiveDialog } from './GoLiveDialog'
import { useApp } from '@/context/useApp'

export function DemoBanner() {
  const { mode } = useApp()
  if (mode !== 'demo') return null
  return (
    <div className="flex items-center justify-center gap-3 border-b bg-secondary px-4 py-1.5 text-xs text-secondary-foreground">
      <span>Demo data — explore freely, nothing is real yet.</span>
      <GoLiveDialog
        trigger={
          <Button size="sm" variant="default" className="h-6 gap-1 px-2 text-xs">
            <Zap className="size-3" /> Go live
          </Button>
        }
      />
    </div>
  )
}
