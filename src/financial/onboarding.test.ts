import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createDemoSource } from '@/data/demo/source'
import { demoStore } from '@/data/demo/store'
import { provisionCustomer } from './onboarding'

describe('verified onboarding', () => {
  beforeEach(() => {
    localStorage.clear()
    demoStore.reset()
  })

  it('waits for approved verification before provisioning wallet and bank account', async () => {
    const source = createDemoSource({ latencyMs: 0, kycMs: 20 })
    const onStep = vi.fn()
    const onboarding = provisionCustomer({
      source,
      mode: 'demo',
      input: { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' },
      pollIntervalMs: 5,
      verificationTimeoutMs: 100,
      onStep,
    })

    const receipt = await onboarding

    expect(receipt.status).toBe('completed')
    expect(receipt.customer.verificationStatus).toBe('approved')
    expect(receipt.wallet.id).toMatch(/^wal_/)
    expect(receipt.wallet.custody).toEqual({ type: 'custodial', custodianName: 'Swipelux Sandbox' })
    expect(receipt.account.iban).toMatch(/^IE/)
    expect(receipt.steps.map(step => step.code)).toEqual([
      'customer_created',
      'identity_verified',
      'wallet_provisioned',
      'bank_account_issued',
    ])
    expect(onStep.mock.calls.map(([step]) => step.code)).toEqual(receipt.steps.map(step => step.code))
  })

  it('does not provision financial accounts when verification is rejected', async () => {
    const base = createDemoSource({ latencyMs: 0, kycMs: 20 })
    const source = {
      ...base,
      getCustomer: async (id: string) => ({ ...await base.getCustomer(id), verificationStatus: 'rejected' as const }),
    }

    await expect(provisionCustomer({
      source,
      mode: 'demo',
      input: { firstName: 'Grace', lastName: 'Hopper', email: 'grace@example.com' },
      pollIntervalMs: 5,
      verificationTimeoutMs: 100,
    })).rejects.toThrow('Identity verification was rejected')

    const customer = (await base.listCustomers()).find(item => item.personal?.email === 'grace@example.com')
    expect(customer).toBeDefined()
    await expect(base.listWallets(customer!.id)).resolves.toEqual([])
    await expect(base.listAccounts(customer!.id)).resolves.toEqual([])
  })

  it('requires sandbox verification evidence when onboarding through the live adapter', async () => {
    const verificationProvider = {
      simulateVerification: vi.fn(async (customerId: string) => ({
        customerId,
        customerType: 'individual',
        previousStatus: 'pending',
        status: 'approved' as const,
        reason: null,
      })),
    }

    const receipt = await provisionCustomer({
      source: createDemoSource({ latencyMs: 0, kycMs: 20 }),
      mode: 'live',
      input: { firstName: 'Katherine', lastName: 'Johnson', email: 'katherine@example.com' },
      verificationProvider,
      pollIntervalMs: 5,
      verificationTimeoutMs: 100,
    })

    expect(verificationProvider.simulateVerification).toHaveBeenCalledWith(receipt.customer.id, 'approved')
    expect(receipt.steps[1]).toMatchObject({ code: 'identity_verified', source: 'swipelux_api' })
  })
})
