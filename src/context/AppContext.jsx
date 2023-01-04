import { useEffect, useState } from 'react'
import { getCustomer } from '../api/customers'
import { listWallets, getWallet } from '../api/wallets'
import { listAccounts } from '../api/accounts'
import { listTransfers } from '../api/transfers'
import { resolveCustomerId, onSession } from '../integrations'
import { AppContext } from './appContext'

export function AppProvider({ children }) {
  const hasCustomerId = Boolean(resolveCustomerId())
  const [customer, setCustomer] = useState(null)
  const [wallet, setWallet] = useState(null)
  const [accounts, setAccounts] = useState([])
  const [transferLog, setTransferLog] = useState([])
  const [loading, setLoading] = useState(hasCustomerId)
  const [error, setError] = useState(null)
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

  function addTransfer(transfer) {
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

  return (
    <AppContext.Provider
      value={{ customer, wallet, accounts, transferLog, addTransfer, refreshWallet, loading, error, loggedOut, setLoggedOut }}
    >
      {children}
    </AppContext.Provider>
  )
}
