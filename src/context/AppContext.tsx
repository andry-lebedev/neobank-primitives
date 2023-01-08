import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AppContext } from './appContext'
import { getSource } from '@/data'
import { getMode } from '@/data/mode'
import { DEMO_CUSTOMER_ID } from '@/data/demo/fixtures'
import { emitAction, onAction } from '@/lib/events'
import { onSession, resolveCustomerId } from '@/integrations'
import type { Account, Customer, Transfer, Wallet } from '@/data/types'

const POLL_MS = 5_000
const TERMINAL = new Set(['completed', 'failed'])

export function AppProvider({ children }: { children: ReactNode }) {
  const [generation, setGeneration] = useState(0) // bump to reload everything
  const mode = getMode()
  const source = useMemo(() => getSource(), [generation]) // eslint-disable-line react-hooks/exhaustive-deps
  const customerId = mode === 'demo' ? DEMO_CUSTOMER_ID : resolveCustomerId()

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transferLog, setTransferLog] = useState<Transfer[]>([])
  const [loading, setLoading] = useState(Boolean(customerId))
  const [error, setError] = useState<string | null>(null)
  const sessionSent = useRef(false)

  const reload = useCallback(() => {
    sessionSent.current = false
    setCustomer(null); setWallet(null); setAccounts([]); setTransferLog([])
    setGeneration(g => g + 1)
  }, [])

  // Mode switch (Go live / disconnect) reloads the whole tree.
  useEffect(() => onAction(e => { if (e.type === 'mode.changed') reload() }), [reload])

  // Initial load.
  useEffect(() => {
    if (!customerId) { setLoading(false); return }
    let cancelled = false
    setLoading(true); setError(null)

    const fetchWallet = () =>
      source.listWallets(customerId).then(wallets => {
        if (!wallets.length) return null
        return source.getWallet(customerId, wallets[0].id).catch(() => wallets[0])
      })

    Promise.all([
      source.getCustomer(customerId),
      fetchWallet(),
      source.listAccounts(customerId),
      source.listTransfers(customerId),
    ])
      .then(([cust, wal, accs, txns]) => {
        if (cancelled) return
        setCustomer(cust); setWallet(wal); setAccounts(accs); setTransferLog(txns)
        if (!sessionSent.current) { sessionSent.current = true; onSession(cust) }
      })
      .catch(() => { if (!cancelled) setError('Failed to load your account.') })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [source, customerId, generation])

  // Keep the log in sync with lifecycle events (demo store emits these itself).
  useEffect(() => onAction(e => {
    if (e.type === 'transfer.updated') {
      setTransferLog(prev => prev.map(t => (t.id === e.transfer.id ? e.transfer : t)))
      if (e.transfer.state === 'completed') refreshWalletRef.current()
    }
  }), [])

  // Live mode: poll non-terminal transfers so the explainer animates there too.
  useEffect(() => {
    if (mode !== 'live') return
    const id = setInterval(() => {
      transferLog.filter(t => !TERMINAL.has(t.state)).forEach(t => {
        source.getTransfer(t.id).then(fresh => {
          if (fresh.state !== t.state) {
            setTransferLog(prev => prev.map(x => (x.id === fresh.id ? fresh : x)))
            emitAction({ type: 'transfer.updated', transfer: fresh })
          }
        }).catch(() => {})
      })
    }, POLL_MS)
    return () => clearInterval(id)
  }, [mode, source, transferLog])

  const addTransfer = useCallback((t: Transfer) => setTransferLog(prev => [t, ...prev]), [])

  const refreshWallet = useCallback(() => {
    if (!customerId) return
    source.listWallets(customerId)
      .then(ws => (ws.length ? source.getWallet(customerId, ws[0].id) : null))
      .then(w => { if (w) setWallet(w) })
      .catch(() => {})
  }, [source, customerId])
  const refreshWalletRef = useRef(refreshWallet)
  useEffect(() => { refreshWalletRef.current = refreshWallet }, [refreshWallet])

  const refreshCustomer = useCallback(() => {
    if (!customerId) return
    source.getCustomer(customerId).then(c => { if (c) setCustomer(c) }).catch(() => {})
  }, [source, customerId])

  return (
    <AppContext.Provider value={{ mode, source, customerId, customer, wallet, accounts, transferLog, loading, error, addTransfer, refreshWallet, refreshCustomer, reload }}>
      {children}
    </AppContext.Provider>
  )
}
