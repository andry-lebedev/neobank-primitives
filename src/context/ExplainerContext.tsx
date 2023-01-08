import { createContext, useContext, useState, type ReactNode } from 'react'
import { brand } from '../brand.config'

interface ExplainerContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
}

const ExplainerContext = createContext<ExplainerContextValue | null>(null)

export function ExplainerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(brand.explainerDefaultOn)
  return (
    <ExplainerContext.Provider value={{ open, setOpen, toggle: () => setOpen(o => !o) }}>
      {children}
    </ExplainerContext.Provider>
  )
}

export function useExplainer(): ExplainerContextValue {
  const ctx = useContext(ExplainerContext)
  if (!ctx) throw new Error('useExplainer must be used inside <ExplainerProvider>')
  return ctx
}
