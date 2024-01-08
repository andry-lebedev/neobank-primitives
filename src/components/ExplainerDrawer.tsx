import { useEffect, useState } from 'react'
import { Check, CircleDot, ExternalLink, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useExplainer } from '@/context/useExplainer'
import { onAction } from '@/lib/events'
import { explainers, EVENT_FLOW, stepsDone, type FlowKey } from '../explainers'
import { cn } from '@/lib/utils'

interface ActiveFlow {
  key: FlowKey
  transferId: string | null
  done: number // -1 = failed at active step
  failureReason?: string
}

// Onboarding has no transfer to track — progress maps directly from events.
const ONBOARDING_DONE: Record<string, number> = {
  'customer.created': 1,
  'kyc.started': 1,
  'kyc.approved': 2,
  'wallet.provisioned': 3,
  'account.issued': 4,
}

export function ExplainerDrawer() {
  const { open, setOpen } = useExplainer()
  const [active, setActive] = useState<ActiveFlow | null>(null)
  // Drive the slide-in: mount translated off-screen, then flip to visible.
  const [shown, setShown] = useState(false)
  useEffect(() => {
    if (!open) { setShown(false); return }
    const id = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(id)
  }, [open])

  useEffect(() => onAction(e => {
    if (e.type === 'transfer.updated') {
      setActive(prev => {
        if (!prev || prev.transferId !== e.transfer.id) return prev
        return { ...prev, done: stepsDone(prev.key, e.transfer.state), failureReason: e.transfer.failureReason }
      })
      return
    }
    const key = EVENT_FLOW[e.type]
    if (!key) return
    setOpen(true) // an operation started — surface the explainer to narrate it
    if (key === 'onboarding') {
      setActive({ key, transferId: null, done: ONBOARDING_DONE[e.type] ?? 0 })
      return
    }
    const transfer = 'transfer' in e ? e.transfer : null
    setActive({
      key,
      transferId: transfer?.id ?? null,
      done: transfer ? stepsDone(key, transfer.state) : 1, // quoted → first step done
    })
  }), [setOpen])

  if (!open) return null
  const flow = active ? explainers[active.key] : null

  return (
    <aside
      className={cn(
        'fixed inset-x-0 bottom-16 z-40 max-h-[55vh] overflow-y-auto border-t bg-card p-5 transition-transform duration-200 ease-out',
        'md:inset-x-auto md:right-4 md:top-4 md:bottom-auto md:max-h-[calc(100vh-2rem)] md:w-[320px] md:rounded-2xl md:border md:shadow-2xl',
        shown ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-y-0 md:translate-x-[120%]',
      )}
    >
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-sm font-bold">What Swipelux just did</h2>
        <Button variant="ghost" size="sm" aria-label="Close explainer" onClick={() => setOpen(false)}>
          <X className="size-4" />
        </Button>
      </div>

      {!flow || !active ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Do something — send money, add funds, onboard — and this panel shows what Swipelux handles behind it.
        </p>
      ) : (
        <>
          <p className="mb-1 text-sm font-semibold">{flow.title}</p>
          <p className="mb-4 text-xs text-muted-foreground">{flow.subtitle}</p>
          <ol className="space-y-0">
            {flow.steps.map((step, i) => {
              const failed = active.done === -1
              const failIndex = flow.steps.length - 2 // conversion/processing step
              const isDone = !failed && i < active.done
              const isActive = !failed && i === active.done
              const isFailed = failed && i === failIndex
              return (
                <li key={step.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      data-testid={isDone ? 'step-done' : undefined}
                      className={cn(
                        'flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                        isDone && 'bg-success text-primary-foreground',
                        isActive && 'bg-info text-primary-foreground',
                        isFailed && 'bg-destructive text-primary-foreground',
                        !isDone && !isActive && !isFailed && 'bg-muted text-muted-foreground',
                      )}
                    >
                      {isDone ? <Check className="size-3" /> : isActive ? <CircleDot className="size-3" /> : isFailed ? <X className="size-3" /> : i + 1}
                    </span>
                    {i < flow.steps.length - 1 && <span className="w-px flex-1 bg-border" />}
                  </div>
                  <div className="pb-4">
                    <p className={cn('text-sm font-semibold', !isDone && !isActive && !isFailed && 'text-muted-foreground')}>{step.title}</p>
                    <p className="text-xs text-muted-foreground">{step.detail}</p>
                    {isFailed && active.failureReason && (
                      <p className="mt-1 text-xs text-destructive">{active.failureReason}</p>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
          <a href={flow.docsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-info hover:underline">
            View API docs <ExternalLink className="size-3" />
          </a>
        </>
      )}
    </aside>
  )
}
