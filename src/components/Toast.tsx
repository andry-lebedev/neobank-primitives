import { useEffect, useState } from 'react'
import { X, AlertCircle, CheckCircle2 } from 'lucide-react'

type ToastType = 'success' | 'error'

interface ToastData {
  id: number
  message: string
  type: ToastType
}

interface ToastItemProps extends ToastData {
  onDismiss: (id: number) => void
}

function ToastItem({ id, message, type, onDismiss }: ToastItemProps) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(id), 4000)
    return () => clearTimeout(t)
  }, [id, onDismiss])

  return (
    <div className="flex items-start gap-3 bg-card border border-card-hover rounded-xl p-4 shadow-xl min-w-64 max-w-80">
      {type === 'error'
        ? <AlertCircle size={18} className="text-danger mt-0.5 flex-shrink-0" />
        : <CheckCircle2 size={18} className="text-success mt-0.5 flex-shrink-0" />}
      <p className="text-sm text-fg flex-1 leading-relaxed">{message}</p>
      <button
        onClick={() => onDismiss(id)}
        className="text-subtle hover:text-fg-muted cursor-pointer transition-colors duration-150 flex-shrink-0"
        aria-label="Dismiss notification"
      >
        <X size={15} />
      </button>
    </div>
  )
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastData[]>([])

  useEffect(() => {
    function onError(e: Event) {
      const { message } = (e as CustomEvent<{ message: string }>).detail
      setToasts(prev => [...prev, { id: Date.now() + Math.random(), message, type: 'error' }])
    }
    function onSuccess(e: Event) {
      const { message } = (e as CustomEvent<{ message: string }>).detail
      setToasts(prev => [...prev, { id: Date.now() + Math.random(), message, type: 'success' }])
    }
    window.addEventListener('api-error', onError)
    window.addEventListener('api-success', onSuccess)
    return () => {
      window.removeEventListener('api-error', onError)
      window.removeEventListener('api-success', onSuccess)
    }
  }, [])

  function dismiss(id: number) {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  if (!toasts.length) return null

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map(t => (
        <ToastItem key={t.id} {...t} onDismiss={dismiss} />
      ))}
    </div>
  )
}
