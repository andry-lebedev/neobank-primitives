import { useEffect, useState, type ReactNode } from 'react'
import { getCustomer } from '../api/customers'
import { listWallets, getWallet } from '../api/wallets'
import { listAccounts } from '../api/accounts'
import { listTransfers } from '../api/transfers'
import { resolveCustomerId, onSession } from '../integrations'
import { AppContext } from './appContext'
import type { Customer, Wallet, Account, Transfer } from '../types'

export function AppProvider({ children }: { children: ReactNode }) {
  const hasCustomerId = Boolean(resolveCustomerId())
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transferLog, setTransferLog] = useState<Transfer[]>([])
  const [loading, setLoading] = useState(hasCustomerId)
  const [error, setError] = useState<string | null>(null)
  const [loggedOut, setLoggedOut] = useState(false)

  useEffect(() => {
    const customerId = resolveCustomerId()
    if (!customerId) return

    const fetchWallet = () =>
      listWallets(customerId).then(({ wallets }) => {
        if (!wallets?.length) return null
        return getWallet(customerId, wallets[0].id).catch(() => null)
      })

    const fetchAccounts = () =>
      listAccounts(customerId).then(({ accounts }) => accounts ?? [])

    const fetchTransfers = () =>
      listTransfers(customerId).then(data => (Array.isArray(data) ? data : data?.transfers ?? []))

    Promise.all([
      getCustomer(customerId),
      fetchWallet(),
      fetchAccounts(),
      fetchTransfers(),
    ])
      .then(([cust, wal, accs, txns]) => {
        setCustomer(cust)
        onSession(cust)
        setWallet(wal)
        setAccounts(accs)
        setTransferLog(txns)
      })
      .catch(() => setError('Failed to load your account.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    function onFocus() {
      const customerId = resolveCustomerId()
      if (!customerId) return
      getCustomer(customerId).then(c => { if (c) setCustomer(c) }).catch(() => {})
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  function addTransfer(transfer: Transfer) {
    setTransferLog(prev => [transfer, ...prev])
  }

  function refreshWallet() {
    const customerId = resolveCustomerId()
    if (!customerId) return
    listWallets(customerId)
      .then(({ wallets }) => {
        if (!wallets?.length) return null
        return getWallet(customerId, wallets[0].id)
      })
      .then(wal => { if (wal) setWallet(wal) })
      .catch(() => {})
  }

  function refreshCustomer() {
    const customerId = resolveCustomerId()
    if (!customerId) return
    getCustomer(customerId)
      .then(c => { if (c) setCustomer(c) })
      .catch(() => {})
  }

  return (
    <AppContext.Provider
      value={{ customer, wallet, accounts, transferLog, addTransfer, refreshWallet, refreshCustomer, loading, error, loggedOut, setLoggedOut }}
    >
      {children}
    </AppContext.Provider>
  )
}
