import type { DataSource, Transfer, TransferState } from '@/data/types'
import type { SupportedCapability } from '@/support'
import type {
  FinancialProvider,
  DestinationRequest,
  FundingRule,
  FundingRuleRequest,
  ProviderQuote,
  ProviderAccount,
  ProviderDestination,
  ProviderRecipient,
  ProviderTransfer,
  QuoteRequest,
  RecipientRequest,
  VerificationResult,
  WebhookRegistration,
  WebhookRequest,
} from './swipeluxV3'

export interface DemoFinancialProviderOptions {
  now?: () => Date
  createId?: (prefix: string) => string
}

interface DemoQuoteRecord {
  quote: ProviderQuote
  request: QuoteRequest
  executed: boolean
}

interface DemoTransferRecord {
  quoteId: string
  customerId: string
  capabilityId: string
  method: string
}

const DEMO_CAPABILITIES: SupportedCapability[] = [
  {
    id: 'sepa_demo',
    method: 'sepa',
    availability: 'available',
    directions: ['payin', 'payout'],
    eligibility: { eligible: true },
  },
  {
    id: 'stablecoin_transfers_demo',
    method: 'stablecoin_transfers',
    availability: 'available',
    directions: ['payout'],
    eligibility: { eligible: true },
  },
]

function providerState(state: TransferState): string {
  if (state === 'pending' || state === 'in_progress') return 'processing'
  return state
}

function toProviderTransfer(transfer: Transfer, record: DemoTransferRecord): ProviderTransfer {
  return {
    id: transfer.id,
    quoteId: record.quoteId,
    state: providerState(transfer.state),
    customerId: record.customerId,
    capabilityId: record.capabilityId,
    method: record.method,
    stateDetail: transfer.failureReason ? { code: 'demo_failure', message: transfer.failureReason } : null,
    openTaskIds: [],
    references: { returnedTransferId: null },
    timestamps: {
      createdAt: transfer.createdAt,
      updatedAt: transfer.updatedAt ?? transfer.createdAt,
      fundsReceivedAt: null,
      completedAt: transfer.completedAt ?? null,
      failedAt: transfer.state === 'failed' ? transfer.updatedAt ?? transfer.createdAt : null,
      returnedAt: null,
      settledAt: transfer.completedAt ?? null,
    },
  }
}

export function createDemoFinancialProvider(
  source: DataSource,
  {
    now = () => new Date(),
    createId = prefix => `${prefix}_demo_${Date.now().toString(36)}`,
  }: DemoFinancialProviderOptions = {},
): FinancialProvider {
  const quotes = new Map<string, DemoQuoteRecord>()
  const transfers = new Map<string, DemoTransferRecord>()
  const walletDestinations = new Map<string, ProviderDestination[]>()
  const destinationsById = new Map<string, ProviderDestination>()

  const destinationKey = (customerId: string, recipientId: string) => `${customerId}:${recipientId}`

  const toProviderRecipient = (recipient: Awaited<ReturnType<DataSource['listRecipients']>>[number]): ProviderRecipient => ({
    id: recipient.id,
    type: recipient.type ?? 'individual',
    relationship: 'other',
    firstName: recipient.firstName,
    lastName: recipient.lastName,
    companyName: recipient.companyName,
    email: recipient.email,
    status: 'ready',
  })

  const toProviderDestination = (
    account: Awaited<ReturnType<DataSource['listRecipientAccounts']>>[number],
  ): ProviderDestination => ({
    id: account.id,
    type: 'sepa',
    currency: account.currency ?? account.details?.currency ?? 'EUR',
    details: {
      iban: account.iban ?? account.details?.iban,
      accountHolderName: account.details?.accountHolderName,
      country: account.details?.country,
    },
    status: 'ready',
  })

  return {
    async supportedCapabilities(customerId) {
      await source.getCustomer(customerId)
      return DEMO_CAPABILITIES.map(capability => ({
        ...capability,
        directions: [...capability.directions],
        eligibility: capability.eligibility ? { ...capability.eligibility } : undefined,
      }))
    },

    async listAccounts(customerId): Promise<ProviderAccount[]> {
      const [wallets, bankAccounts] = await Promise.all([
        source.listWallets(customerId),
        source.listAccounts(customerId),
      ])
      const walletAccounts = wallets.flatMap(wallet => (wallet.balances ?? []).map(balance => ({
        id: wallet.id,
        type: 'wallet' as const,
        origin: 'issued' as const,
        status: 'ready',
        currency: balance.currency,
        details: { network: wallet.chain, address: wallet.address },
        openTaskIds: [],
      })))
      return [
        ...walletAccounts,
        ...bankAccounts.map(account => ({
          id: account.id,
          type: 'bank' as const,
          origin: 'issued' as const,
          status: 'ready',
          currency: account.currency ?? 'EUR',
          method: account.type ?? 'sepa',
          details: {
            iban: account.iban,
            bic: account.bic,
            accountHolderName: account.accountHolderName,
            reference: account.paymentReference,
          },
          openTaskIds: [],
        })),
      ]
    },

    async listRecipients(customerId) {
      return (await source.listRecipients(customerId)).map(toProviderRecipient)
    },

    async createRecipient(customerId: string, input: RecipientRequest) {
      const recipient = await source.createRecipient(customerId, input.type === 'individual'
        ? {
            type: 'individual',
            firstName: input.firstName,
            lastName: input.lastName,
            email: input.email,
          }
        : { type: 'business', companyName: input.companyName, email: input.email })
      return { ...toProviderRecipient(recipient), relationship: input.relationship }
    },

    async listDestinations(customerId, recipientId) {
      const bankDestinations = (await source.listRecipientAccounts(customerId, recipientId)).map(toProviderDestination)
      const wallet = walletDestinations.get(destinationKey(customerId, recipientId)) ?? []
      const result = [...bankDestinations, ...wallet]
      result.forEach(destination => destinationsById.set(destination.id, destination))
      return result.map(destination => ({ ...destination, details: { ...destination.details } }))
    },

    async createDestination(customerId: string, recipientId: string, input: DestinationRequest) {
      if (input.type === 'sepa') {
        const account = await source.createRecipientAccount(customerId, recipientId, {
          rail: 'sepa',
          details: {
            iban: input.details.iban,
            accountHolderName: input.details.accountHolderName,
            country: input.details.country,
            currency: input.currency,
          },
        })
        const destination = toProviderDestination(account)
        destinationsById.set(destination.id, destination)
        return destination
      }
      const destination: ProviderDestination = {
        id: createId('destination'),
        status: 'ready',
        type: 'wallet',
        currency: input.currency,
        details: { ...input.details },
        ownership: { ...input.ownership },
        label: input.label,
      }
      const key = destinationKey(customerId, recipientId)
      walletDestinations.set(key, [...(walletDestinations.get(key) ?? []), destination])
      destinationsById.set(destination.id, destination)
      return { ...destination, details: { ...destination.details } }
    },

    async createQuote(request) {
      const capability = DEMO_CAPABILITIES.find(candidate => candidate.id === request.capabilityId)
      if (!capability) throw new Error(`Capability ${request.capabilityId} is not available in demo mode.`)
      const accountId = request.in.accountId
      const amount = Number(request.in.amount)
      if (!accountId || !Number.isFinite(amount) || amount <= 0) {
        throw new Error('Demo quotes require a source account and positive exact-in amount.')
      }
      const sourceQuote = await source.createPayoutQuote({
        fromWalletId: accountId,
        amount,
        currency: request.in.currency,
        toAccountId: request.destinationId,
        toCurrency: request.out.currency,
      })
      const createdAt = now()
      const quote: ProviderQuote = {
        id: createId('quote'),
        customerId: request.customerId,
        capabilityId: request.capabilityId,
        externalId: request.externalId,
        mode: 'exact_in',
        direction: capability.method === 'stablecoin_transfers' ? 'stablecoin_move' : 'stablecoin_to_fiat',
        destinationId: request.destinationId,
        destination: { type: 'destination', id: request.destinationId },
        in: { ...request.in, amount: amount.toFixed(2) },
        out: { ...request.out, amount: String(sourceQuote.destination_amount ?? '') },
        rate: String(sourceQuote.rate ?? '1'),
        fees: sourceQuote.fee
          ? [{ beneficiary: 'service', amount: String(sourceQuote.fee.amount), currency: sourceQuote.fee.currency }]
          : [],
        status: 'active',
        transferId: null,
        createdAt: createdAt.toISOString(),
        expiresAt: new Date(createdAt.getTime() + 5 * 60_000).toISOString(),
      }
      quotes.set(quote.id, { quote, request, executed: false })
      return { ...quote, in: { ...quote.in }, out: { ...quote.out }, fees: quote.fees?.map(fee => ({ ...fee })) }
    },

    async executeQuote({ quoteId }) {
      const record = quotes.get(quoteId)
      if (!record) throw new Error(`Demo quote ${quoteId} was not found.`)
      if (record.executed) throw new Error(`Demo quote ${quoteId} has already been executed.`)
      if (now().getTime() >= new Date(record.quote.expiresAt).getTime()) {
        throw new Error(`Demo quote ${quoteId} has expired.`)
      }
      const accountId = record.request.in.accountId
      const amount = Number(record.request.in.amount)
      if (!accountId || !Number.isFinite(amount)) throw new Error(`Demo quote ${quoteId} is incomplete.`)
      const method = DEMO_CAPABILITIES.find(capability => capability.id === record.request.capabilityId)?.method ?? 'unknown'
      const destination = destinationsById.get(record.request.destinationId)
      const transfer = await source.createPayout({
        fromWalletId: accountId,
        amount,
        currency: record.request.in.currency,
        toId: destination?.type === 'wallet'
          ? destination.details.address ?? record.request.destinationId
          : record.request.destinationId,
        toCurrency: record.request.out.currency,
        kind: method === 'stablecoin_transfers' ? 'wallet' : 'bank',
      })
      record.executed = true
      record.quote.status = 'executed'
      record.quote.transferId = transfer.id
      const transferRecord = {
        quoteId,
        customerId: record.request.customerId,
        capabilityId: record.request.capabilityId,
        method,
      }
      transfers.set(transfer.id, transferRecord)
      return toProviderTransfer(transfer, transferRecord)
    },

    async getTransfer(transferId) {
      const record = transfers.get(transferId)
      if (!record) throw new Error(`Demo transfer ${transferId} was not found.`)
      return toProviderTransfer(await source.getTransfer(transferId), record)
    },

    async createRule(_customerId: string, request: FundingRuleRequest): Promise<FundingRule> {
      return { id: createId('rule'), status: 'active', ...request }
    },

    async createWebhook(request: WebhookRequest): Promise<WebhookRegistration> {
      return { id: createId('webhook'), status: 'active', ...request, events: [...request.events] }
    },

    async simulateVerification(customerId, status): Promise<VerificationResult> {
      const customer = await source.getCustomer(customerId)
      return {
        customerId,
        customerType: customer.type ?? 'individual',
        previousStatus: customer.verificationStatus ?? 'not_started',
        status,
        reason: status === 'rejected' ? 'demo_rejection' : null,
      }
    },
  }
}
