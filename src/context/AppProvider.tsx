import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AppContext } from './appContext'
import { getSource } from '@/data'
import { getMode } from '@/data/mode'
import { demoStore } from '@/data/demo/store'
import { emitAction, onAction } from '@/lib/events'
import { onSession, resolveCustomerId } from '@/integrations'
import { availableRails as selectAvailableRails, type AvailableRail } from '@/support'
import { createDemoFinancialProvider } from '@/financial/demoProvider'
import { swipeluxV3 } from '@/financial/swipeluxV3'
import type { ProviderAccount } from '@/financial/swipeluxV3'
import { createInteractivePolicy } from '@/financial/defaultPolicy'
import { createFinancialRuntime, type OperationReceipt } from '@/financial/runtime'
import { createStorageJournal } from '@/financial/journal'
import { receiptToTransfer } from '@/financial/receipts'
import type { Account, Customer, Transfer, Wallet } from '@/data/types'

const POLL_MS = 5_000
const TERMINAL = new Set(['completed', 'failed'])

export function AppProvider({ children }: { children: ReactNode }) {
  const mode = getMode()
  const [source, setSource] = useState(getSource)
  const customerId = mode === 'demo' ? demoStore.getActiveCustomerId() : resolveCustomerId()

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transferLog, setTransferLog] = useState<Transfer[]>([])
  const [loading, setLoading] = useState(Boolean(customerId))
  const [error, setError] = useState<string | null>(null)
  const [availableRails, setAvailableRails] = useState<AvailableRail[]>([])
  const [financialAccounts, setFinancialAccounts] = useState<ProviderAccount[]>([])
  const [operationReceipts, setOperationReceipts] = useState<OperationReceipt[]>([])
  const sessionSent = useRef(false)
  const transferLogRef = useRef(transferLog)
  const operationReceiptsRef = useRef(operationReceipts)

  const refreshWallet = useCallback(() => {
    if (!customerId) return
    source.listWallets(customerId)
      .then(ws => (ws.length ? source.getWallet(customerId, ws[0].id) : null))
      .then(w => { if (w) setWallet(w) })
      .catch(() => {})
  }, [source, customerId])

  const financialProvider = useMemo(
    () => mode === 'live' ? swipeluxV3 : createDemoFinancialProvider(source),
    [mode, source],
  )
  const journal = useMemo(
    () => createStorageJournal(localStorage, `swipelux_financial_journal:${mode}:${customerId || 'anonymous'}`),
    [mode, customerId],
  )
  const handleReceipt = useCallback((receipt: OperationReceipt) => {
    setOperationReceipts(previous => [receipt, ...previous.filter(item => item.id !== receipt.id)])
    const transfer = receiptToTransfer(receipt)
    setTransferLog(previous => [transfer, ...previous.filter(item => item.id !== transfer.id)])
    emitAction({ type: 'operation.receipt', receipt })
    emitAction({ type: 'transfer.updated', transfer })
  }, [])
  const financialRuntime = useMemo(
    () => createFinancialRuntime({
      provider: financialProvider,
      policy: createInteractivePolicy(),
      journal,
      onReceipt: handleReceipt,
    }),
    [financialProvider, journal, handleReceipt],
  )

  const reload = useCallback(() => {
    sessionSent.current = false
    setCustomer(null); setWallet(null); setAccounts([]); setTransferLog([]); setOperationReceipts([]); setAvailableRails([]); setFinancialAccounts([])
    setSource(getSource())
  }, [])

  // Mode switch (Go live / disconnect) reloads the whole tree.
  useEffect(() => onAction(e => { if (e.type === 'mode.changed') reload() }), [reload])

  // Initial load.
  useEffect(() => {
    let cancelled = false
    if (!customerId) {
      queueMicrotask(() => { if (!cancelled) setLoading(false) })
      return () => { cancelled = true }
    }
    queueMicrotask(() => {
      if (!cancelled) { setLoading(true); setError(null) }
    })

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
        const receipts = journal.listReceipts()
        const receiptTransfers = receipts.map(receiptToTransfer)
        const receiptIds = new Set(receiptTransfers.map(transfer => transfer.id))
        setCustomer(cust); setWallet(wal); setAccounts(accs)
        setOperationReceipts(receipts)
        setTransferLog([...receiptTransfers, ...txns.filter(transfer => !receiptIds.has(transfer.id))])
        if (!sessionSent.current) { sessionSent.current = true; onSession(cust) }
      })
      .catch(() => { if (!cancelled) setError('Failed to load your account.') })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [source, customerId, journal])

  useEffect(() => {
    let cancelled = false
    if (!customerId) {
      queueMicrotask(() => {
        if (!cancelled) { setAvailableRails([]); setFinancialAccounts([]) }
      })
      return () => { cancelled = true }
    }
    financialProvider.supportedCapabilities(customerId)
      .then(capabilities => { if (!cancelled) setAvailableRails(selectAvailableRails(capabilities)) })
      .catch(() => { if (!cancelled) setAvailableRails([]) })
    financialProvider.listAccounts(customerId)
      .then(providerAccounts => { if (!cancelled) setFinancialAccounts(providerAccounts) })
      .catch(() => { if (!cancelled) setFinancialAccounts([]) })
    return () => { cancelled = true }
  }, [financialProvider, customerId])

  // Keep the log in sync with lifecycle events (demo store emits these itself).
  useEffect(() => onAction(e => {
    if (e.type === 'transfer.updated') {
      setTransferLog(prev => prev.map(t => (t.id === e.transfer.id ? e.transfer : t)))
      if (e.transfer.state === 'completed') refreshWallet()
    }
  }), [refreshWallet])

  useEffect(() => { transferLogRef.current = transferLog }, [transferLog])
  useEffect(() => { operationReceiptsRef.current = operationReceipts }, [operationReceipts])

  useEffect(() => {
    const id = setInterval(() => {
      operationReceiptsRef.current
        .filter(receipt => !TERMINAL.has(receipt.status) && receipt.status !== 'canceled')
        .forEach(receipt => { financialRuntime.refresh(receipt.id).catch(() => {}) })
    }, POLL_MS)
    return () => clearInterval(id)
  }, [financialRuntime])

  // Live mode: poll non-terminal transfers so the explainer animates there too.
  useEffect(() => {
    if (mode !== 'live') return
    const id = setInterval(() => {
      const runtimeIds = new Set(operationReceiptsRef.current.map(receipt => receipt.id))
      transferLogRef.current.filter(t => !runtimeIds.has(t.id) && !TERMINAL.has(t.state)).forEach(t => {
        source.getTransfer(t.id).then(fresh => {
          if (fresh.state !== t.state) {
            setTransferLog(prev => prev.map(x => (x.id === fresh.id ? fresh : x)))
            emitAction({ type: 'transfer.updated', transfer: fresh })
          }
        }).catch(() => {})
      })
    }, POLL_MS)
    return () => clearInterval(id)
  }, [mode, source])

  const addTransfer = useCallback((t: Transfer) => setTransferLog(prev => [t, ...prev.filter(item => item.id !== t.id)]), [])

  const refreshCustomer = useCallback(() => {
    if (!customerId) return
    source.getCustomer(customerId).then(c => { if (c) setCustomer(c) }).catch(() => {})
  }, [source, customerId])

  return (
    <AppContext.Provider value={{
      mode,
      source,
      financialProvider,
      financialRuntime,
      availableRails,
      financialAccounts,
      operationReceipts,
      customerId,
      customer,
      wallet,
      accounts,
      transferLog,
      loading,
      error,
      addTransfer,
      refreshWallet,
      refreshCustomer,
      reload,
    }}>
      {children}
    </AppContext.Provider>
  )
}
