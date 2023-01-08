import { useContext } from 'react'
import { ExplainerContext } from './explainerContext'
import type { ExplainerContextValue } from './explainerContext'

export function useExplainer(): ExplainerContextValue {
  const ctx = useContext(ExplainerContext)
  if (!ctx) throw new Error('useExplainer must be used inside <ExplainerProvider>')
  return ctx
}
