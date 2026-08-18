import { createContext } from 'react'
import type { Account, AppMode, Customer, DataSource, Transfer, Wallet } from '@/data/types'
import type { AvailableRail } from '@/support'
import type { FinancialProvider, ProviderAccount } from '@/financial/swipeluxV3'
import type { FinancialRuntime, OperationReceipt } from '@/financial/runtime'

export interface AppContextValue {
  mode: AppMode
  source: DataSource
  financialProvider: FinancialProvider
  financialRuntime: FinancialRuntime
  availableRails: AvailableRail[]
  financialAccounts: ProviderAccount[]
  operationReceipts: OperationReceipt[]
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
