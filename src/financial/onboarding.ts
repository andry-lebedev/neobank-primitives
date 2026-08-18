import type {
  Account,
  AppMode,
  CreateCustomerInput,
  Customer,
  DataSource,
  Wallet,
} from '@/data/types'
import type { VerificationResult } from './swipeluxV3'

export type OnboardingStepCode =
  | 'customer_created'
  | 'identity_verified'
  | 'wallet_provisioned'
  | 'bank_account_issued'

export interface OnboardingStep {
  code: OnboardingStepCode
  status: 'completed'
  resourceId: string
  source: 'demo_adapter' | 'swipelux_api'
  completedAt: string
}

export interface OnboardingReceipt {
  status: 'completed'
  customer: Customer
  wallet: Wallet
  account: Account
  steps: OnboardingStep[]
}

export interface ProvisionCustomerInput {
  source: DataSource
  mode: AppMode
  input: CreateCustomerInput
  verificationProvider?: {
    simulateVerification(customerId: string, status: 'approved' | 'rejected'): Promise<VerificationResult>
  }
  pollIntervalMs?: number
  verificationTimeoutMs?: number
  onStep?: (step: OnboardingStep) => void
}

const wait = (milliseconds: number) => new Promise(resolve => setTimeout(resolve, milliseconds))

async function waitForApproval(
  source: DataSource,
  customerId: string,
  pollIntervalMs: number,
  timeoutMs: number,
): Promise<Customer> {
  const startedAt = Date.now()
  while (Date.now() - startedAt <= timeoutMs) {
    const customer = await source.getCustomer(customerId)
    if (customer.verificationStatus === 'approved') return customer
    if (customer.verificationStatus === 'rejected') throw new Error('Identity verification was rejected.')
    await wait(pollIntervalMs)
  }
  throw new Error('Identity verification did not complete before the timeout.')
}

export async function provisionCustomer({
  source,
  mode,
  input,
  verificationProvider,
  pollIntervalMs = 500,
  verificationTimeoutMs = 30_000,
  onStep,
}: ProvisionCustomerInput): Promise<OnboardingReceipt> {
  const evidenceSource = mode === 'live' ? 'swipelux_api' : 'demo_adapter'
  const steps: OnboardingStep[] = []
  const complete = (code: OnboardingStepCode, resourceId: string) => {
    const step: OnboardingStep = {
      code,
      resourceId,
      status: 'completed',
      source: evidenceSource,
      completedAt: new Date().toISOString(),
    }
    steps.push(step)
    onStep?.({ ...step })
  }

  const createdCustomer = await source.createCustomer(input)
  complete('customer_created', createdCustomer.id)

  await source.initiateKyc(createdCustomer.id)
  if (mode === 'live') {
    if (!verificationProvider) throw new Error('Live sandbox verification provider is required.')
    const verification = await verificationProvider.simulateVerification(createdCustomer.id, 'approved')
    if (verification.status !== 'approved') throw new Error('Identity verification was rejected.')
  }
  const customer = await waitForApproval(source, createdCustomer.id, pollIntervalMs, verificationTimeoutMs)
  complete('identity_verified', customer.id)

  const wallet = await source.createWallet(customer.id)
  complete('wallet_provisioned', wallet.id)

  const account = await source.createAccount(customer.id, {
    type: 'sepa',
    currency: 'EUR',
    country: 'IE',
    targetWallet: wallet.id,
    label: 'Main EUR account',
  })
  complete('bank_account_issued', account.id)

  return { status: 'completed', customer, wallet, account, steps }
}
