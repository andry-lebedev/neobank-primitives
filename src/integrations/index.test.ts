import { describe, it, expect, beforeEach } from 'vitest'
import * as integrations from './index'

describe('integration slots', () => {
  beforeEach(() => localStorage.clear())

  it('exposes the fixed slot contract', () => {
    expect(typeof integrations.track).toBe('function')
    expect(typeof integrations.onSession).toBe('function')
    expect(typeof integrations.notify).toBe('function')
    expect(typeof integrations.resolveCustomerId).toBe('function')
    expect(typeof integrations.setCustomerId).toBe('function')
  })

  it('customer id round-trips through localStorage', () => {
    expect(integrations.resolveCustomerId()).toBe('')
    integrations.setCustomerId('cust_123')
    expect(integrations.resolveCustomerId()).toBe('cust_123')
  })
})
