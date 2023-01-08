import { useState, type ReactNode } from 'react'
import { brand } from '../brand.config'
import { ExplainerContext } from './explainerContext'

export function ExplainerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(brand.explainerDefaultOn)
  return (
    <ExplainerContext.Provider value={{ open, setOpen, toggle: () => setOpen(o => !o) }}>
      {children}
    </ExplainerContext.Provider>
  )
}
