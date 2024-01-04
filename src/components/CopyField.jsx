import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export default function CopyField({ label, value }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    if (!value) return
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-card-hover last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        <p className="text-sm text-gray-200 font-mono truncate">{value ?? '—'}</p>
      </div>
      <button
        onClick={handleCopy}
        className="ml-3 flex-shrink-0 p-1.5 rounded-lg hover:bg-card-hover transition-colors duration-150 cursor-pointer"
        aria-label={`Copy ${label}`}
      >
        {copied
          ? <Check size={15} className="text-success transition-colors duration-150" />
          : <Copy size={15} className="text-gray-400" />}
      </button>
    </div>
  )
}
