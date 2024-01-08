import { describe, it, expect, vi } from 'vitest'
import { emitAction, onAction, type ActionEvent } from './events'

describe('action event bus', () => {
  it('delivers events to subscribers and unsubscribes cleanly', () => {
    const seen: ActionEvent[] = []
    const off = onAction(e => seen.push(e))
    emitAction({ type: 'kyc.started' })
    off()
    emitAction({ type: 'kyc.approved' })
    expect(seen).toEqual([{ type: 'kyc.started' }])
  })

  it('a throwing listener does not block others', () => {
    const bad = vi.fn(() => { throw new Error('boom') })
    const good = vi.fn()
    const off1 = onAction(bad)
    const off2 = onAction(good)
    emitAction({ type: 'kyc.started' })
    expect(good).toHaveBeenCalledOnce()
    off1(); off2()
  })
})
