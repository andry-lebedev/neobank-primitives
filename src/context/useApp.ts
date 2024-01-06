import { useContext } from 'react'
import { AppContext } from './appContext'
import type { AppContextValue } from '../types'

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
