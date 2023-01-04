import { useEffect, useState } from 'react'
import { getCustomer } from '../api/customers'
import { listWallets, getWallet } from '../api/wallets'
import { listAccounts } from '../api/accounts'
import { listTransfers } from '../api/transfers'
import { MOCK_CUSTOMER, MOCK_WALLET, MOCK_IBAN, MOCK_TRANSFERS } from '../mocks'
import { AppContext } from './appContext'

function resolveCustomerId() {
  return localStorage.getItem('swipelux_customer_id') ?? import.meta.env.VITE_CUSTOMER_ID
}

export function AppProvider({ children }) {
  const hasCustomerId = Boolean(resolveCustomerId())
  const [customer, setCustomer] = useState(hasCustomerId ? null : MOCK_CUSTOMER)
  const [wallet, setWallet] = useState(hasCustomerId ? null : MOCK_WALLET)
  const [accounts, setAccounts] = useState(hasCustomerId ? [] : [MOCK_IBAN])
  const [transferLog, setTransferLog] = useState(hasCustomerId ? [] : MOCK_TRANSFERS)
  const [loading, setLoading] = useState(hasCustomerId)
  const [error, setError] = useState(null)
  const [loggedOut, setLoggedOut] = useState(false)

  useEffect(() => {
    const customerId = resolveCustomerId()
    if (!customerId) {
      return
    }

    const fetchWallet = () =>
      listWallets(customerId)
        .then(({ wallets }) => {
          if (!wallets?.length) return MOCK_WALLET
          return getWallet(customerId, wallets[0].id).catch(() => MOCK_WALLET)
        })
        .catch(() => MOCK_WALLET)

    const fetchAccounts = () =>
      listAccounts(customerId)
        .then(({ accounts }) => (accounts?.length ? accounts : [MOCK_IBAN]))
        .catch(() => [MOCK_IBAN])

    const fetchTransfers = () =>
      listTransfers(customerId)
        .then(data => (Array.isArray(data) && data.length ? data : MOCK_TRANSFERS))
        .catch(() => MOCK_TRANSFERS)

    Promise.all([
      getCustomer(customerId).catch(() => MOCK_CUSTOMER),
      fetchWallet(),
      fetchAccounts(),
      fetchTransfers(),
    ])
      .then(([cust, wal, accs, txns]) => {
        setCustomer(cust)
        setWallet(wal)
        setAccounts(accs)
        setTransferLog(txns)
      })
      .catch(() => {
        setError('Failed to load account. Using demo data.')
        setCustomer(MOCK_CUSTOMER)
        setWallet(MOCK_WALLET)
        setAccounts([MOCK_IBAN])
        setTransferLog(MOCK_TRANSFERS)
      })
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
        if (!wallets?.length) return
        return getWallet(customerId, wallets[0].id)
      })
      .then(wal => { if (wal) setWallet(wal) })
      .catch(() => {})
  }

  return (
    <AppContext.Provider
      value={{
        customer,
        wallet,
        accounts,
        transferLog,
        addTransfer,
        refreshWallet,
        loading,
        error,
        loggedOut,
        setLoggedOut,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}
