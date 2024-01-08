import { createContext } from 'react'

export interface ExplainerContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
}

export const ExplainerContext = createContext<ExplainerContextValue | null>(null)
