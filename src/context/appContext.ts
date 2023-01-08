import { createContext } from 'react'
import type { Account, AppMode, Customer, DataSource, Transfer, Wallet } from '@/data/types'

export interface AppContextValue {
  mode: AppMode
  source: DataSource
  customerId: string
  customer: Customer | null
  wallet: Wallet | null
  accounts: Account[]
  transferLog: Transfer[]
  loading: boolean
  error: string | null
  addTransfer: (transfer: Transfer) => void
  refreshWallet: () => void
  refreshCustomer: () => void
  reload: () => void
}

export const AppContext = createContext<AppContextValue | null>(null)
