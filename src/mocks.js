export const MOCK_CUSTOMER = {
  id: 'cust_demo_001',
  firstName: 'Arthur',
  lastName: 'Kupriyanov',
  email: 'ak@swipelux.com',
  phone: '+1 555 0100',
  status: 'approved',
}

export const MOCK_WALLET = {
  id: 'wlt_demo_001',
  chain: 'polygon',
  address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
  type: 'custodial',
  balances: [{ currency: 'USDC', amount: '2500.00' }],
  createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
}

export const MOCK_IBAN = {
  id: 'acc_demo_001',
  type: 'sepa',
  source: 'virtual',
  iban: 'EE38 2200 2210 2014 5685',
  bic: 'HABAEE2X',
  bankName: 'Swedbank',
  accountHolderName: 'Arthur Kupriyanov',
  paymentReference: 'SWPLX-DEMO-001',
  currency: 'EUR',
  country: 'EE',
  createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
}

export const MOCK_TRANSFERS = [
  {
    id: 'txn_001',
    type: 'onramp',
    state: 'completed',
    from: { currency: 'EUR', amount: '500', rail: 'sepa' },
    to: { identifier: 'wlt_demo_001' },
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'txn_002',
    type: 'offramp',
    state: 'completed',
    from: { identifier: 'wlt_demo_001', amount: '200', currency: 'USDC' },
    to: { identifier: 'acc_demo_001' },
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'txn_003',
    type: 'wallet_to_wallet',
    state: 'pending',
    from: { identifier: 'wlt_demo_001', amount: '50', currency: 'USDC' },
    to: { identifier: 'wlt_demo_002' },
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
]
