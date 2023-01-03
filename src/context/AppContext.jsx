import { createContext, useContext, useEffect, useState } from 'react'
import { getCustomer } from '../api/customers'
import { listWallets, getWallet } from '../api/wallets'
import { listAccounts } from '../api/accounts'
import { MOCK_CUSTOMER, MOCK_WALLET, MOCK_IBAN, MOCK_TRANSFERS } from '../mocks'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [customer, setCustomer] = useState(null)
  const [wallet, setWallet] = useState(null)
  const [accounts, setAccounts] = useState([])
  const [transferLog, setTransferLog] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [loggedOut, setLoggedOut] = useState(false)

  useEffect(() => {
    const customerId = import.meta.env.VITE_CUSTOMER_ID
    if (!customerId) {
      // No customer ID configured — use mocks entirely
      setCustomer(MOCK_CUSTOMER)
      setWallet(MOCK_WALLET)
      setAccounts([MOCK_IBAN])
      setTransferLog(MOCK_TRANSFERS)
      setLoading(false)
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

    Promise.all([
      getCustomer(customerId).catch(() => MOCK_CUSTOMER),
      fetchWallet(),
      fetchAccounts(),
    ])
      .then(([cust, wal, accs]) => {
        setCustomer(cust)
        setWallet(wal)
        setAccounts(accs)
        setTransferLog(MOCK_TRANSFERS)
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

  return (
    <AppContext.Provider
      value={{
        customer,
        wallet,
        accounts,
        transferLog,
        addTransfer,
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

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
