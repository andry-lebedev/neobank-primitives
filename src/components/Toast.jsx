import { useEffect, useState } from 'react'
import { X, AlertCircle, CheckCircle2 } from 'lucide-react'

function ToastItem({ id, message, type, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(id), 4000)
    return () => clearTimeout(t)
  }, [id, onDismiss])

  return (
    <div className="flex items-start gap-3 bg-[#1F2937] border border-[#374151] rounded-xl p-4 shadow-xl min-w-64 max-w-80">
      {type === 'error'
        ? <AlertCircle size={18} className="text-red-400 mt-0.5 flex-shrink-0" />
        : <CheckCircle2 size={18} className="text-green-400 mt-0.5 flex-shrink-0" />}
      <p className="text-sm text-gray-200 flex-1 leading-relaxed">{message}</p>
      <button
        onClick={() => onDismiss(id)}
        className="text-gray-500 hover:text-gray-300 cursor-pointer transition-colors duration-150 flex-shrink-0"
        aria-label="Dismiss notification"
      >
        <X size={15} />
      </button>
    </div>
  )
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    function onError(e) {
      setToasts(prev => [...prev, { id: Date.now() + Math.random(), message: e.detail.message, type: 'error' }])
    }
    function onSuccess(e) {
      setToasts(prev => [...prev, { id: Date.now() + Math.random(), message: e.detail.message, type: 'success' }])
    }
    window.addEventListener('api-error', onError)
    window.addEventListener('api-success', onSuccess)
    return () => {
      window.removeEventListener('api-error', onError)
      window.removeEventListener('api-success', onSuccess)
    }
  }, [])

  function dismiss(id) {
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
