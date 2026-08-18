import type { AuditEvent, OperationReceipt } from './runtime'

export interface FinancialJournal {
  saveReceipt(receipt: OperationReceipt): void
  getReceipt(transferId: string): OperationReceipt | undefined
  listReceipts(): OperationReceipt[]
  appendAudit(event: AuditEvent): void
  listAudit(): AuditEvent[]
}

interface JournalState {
  version: 1
  receipts: Record<string, OperationReceipt>
  audit: AuditEvent[]
}

type JournalStorage = Pick<Storage, 'getItem' | 'setItem'>

const emptyState = (): JournalState => ({ version: 1, receipts: {}, audit: [] })
const clone = <T>(value: T): T => structuredClone(value)

function parseState(raw: string | null): JournalState {
  if (!raw) return emptyState()
  try {
    const parsed = JSON.parse(raw) as Partial<JournalState>
    if (parsed.version !== 1 || !parsed.receipts || !Array.isArray(parsed.audit)) return emptyState()
    return parsed as JournalState
  } catch {
    return emptyState()
  }
}

export function createStorageJournal(storage: JournalStorage, key = 'swipelux_financial_journal'): FinancialJournal {
  const read = () => parseState(storage.getItem(key))
  const write = (state: JournalState) => storage.setItem(key, JSON.stringify(state))
  return {
    saveReceipt(receipt) {
      const state = read()
      state.receipts[receipt.id] = clone(receipt)
      write(state)
    },
    getReceipt(transferId) {
      const receipt = read().receipts[transferId]
      return receipt ? clone(receipt) : undefined
    },
    listReceipts() {
      return Object.values(read().receipts).map(clone)
    },
    appendAudit(event) {
      const state = read()
      state.audit.push(clone(event))
      write(state)
    },
    listAudit() {
      return read().audit.map(clone)
    },
  }
}

export function createMemoryJournal(): FinancialJournal {
  const state = emptyState()
  return {
    saveReceipt(receipt) {
      state.receipts[receipt.id] = clone(receipt)
    },
    getReceipt(transferId) {
      const receipt = state.receipts[transferId]
      return receipt ? clone(receipt) : undefined
    },
    listReceipts() {
      return Object.values(state.receipts).map(clone)
    },
    appendAudit(event) {
      state.audit.push(clone(event))
    },
    listAudit() {
      return state.audit.map(clone)
    },
  }
}
