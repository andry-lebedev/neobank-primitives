import type { ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'

type ButtonVariant = 'primary' | 'ghost' | 'danger'

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-accent hover:bg-accent-hover text-fg-strong',
  ghost:   'bg-transparent hover:bg-card-hover text-fg-muted',
  danger:  'bg-transparent hover:bg-danger/10 text-danger',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  loading?: boolean
  fullWidth?: boolean
}

export default function Button({
  children,
  variant = 'primary',
  loading = false,
  className = '',
  fullWidth = false,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant] ?? VARIANTS.primary} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin flex-shrink-0" />}
      {children}
    </button>
  )
}
