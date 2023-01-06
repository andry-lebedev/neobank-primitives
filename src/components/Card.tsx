import type { MouseEventHandler, ReactNode } from 'react'

interface CardProps {
  children?: ReactNode
  className?: string
  onClick?: MouseEventHandler<HTMLDivElement>
}

export default function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl bg-card border border-card-hover shadow-sm ${onClick ? 'cursor-pointer hover:bg-card-hover transition-colors duration-150' : ''} ${className}`}
    >
      {children}
    </div>
  )
}
