import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface Toast { id: number; message: string; kind: 'success' | 'error' }

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([])
  useEffect(() => {
    let id = 0
    const onToast = (e: Event) => {
      const { message, kind } = (e as CustomEvent<{ message: string; kind: 'success' | 'error' }>).detail
      const toast = { id: ++id, message, kind }
      setToasts(prev => [...prev, toast])
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toast.id)), 4000)
    }
    window.addEventListener('app-toast', onToast)
    return () => window.removeEventListener('app-toast', onToast)
  }, [])
  return (
    <div className="pointer-events-none fixed bottom-20 left-1/2 z-50 flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4 md:bottom-6">
      {toasts.map(t => (
        <div key={t.id} role="status" className={cn(
          'pointer-events-auto rounded-lg border bg-card px-4 py-3 text-sm shadow-lg',
          t.kind === 'error' ? 'border-destructive/30 text-destructive' : 'border-border text-foreground',
        )}>
          {t.message}
        </div>
      ))}
    </div>
  )
}
