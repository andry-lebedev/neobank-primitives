import { describe, it, expect, vi, beforeEach } from 'vitest'
import { track, onSession, notify, resolveCustomerId } from './index'

describe('integration slots', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('exposes the named slots as functions', () => {
    expect(typeof track).toBe('function')
    expect(typeof onSession).toBe('function')
    expect(typeof notify).toBe('function')
    expect(typeof resolveCustomerId).toBe('function')
  })

  it('track and onSession are safe no-ops (do not throw)', () => {
    expect(() => track('test_event', { a: 1 })).not.toThrow()
    expect(() => onSession({ id: 'cust_1' })).not.toThrow()
  })

  it('notify dispatches an api-success event by default', () => {
    const handler = vi.fn()
    window.addEventListener('api-success', handler)
    notify('hello')
    expect(handler).toHaveBeenCalled()
    window.removeEventListener('api-success', handler)
  })

  it('resolveCustomerId prefers localStorage over env', () => {
    localStorage.setItem('swipelux_customer_id', 'cust_stored')
    expect(resolveCustomerId()).toBe('cust_stored')
  })
})
