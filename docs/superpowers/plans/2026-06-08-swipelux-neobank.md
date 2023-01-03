# Swipelux NeoBank Demo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Revolut-inspired neobank demo app over the Swipelux API, shown live during onboarding calls.

**Architecture:** React + Vite SPA. AppContext loads customer/wallet/accounts at boot (parallel fetches, mock fallback). No transaction list endpoint exists — history is built from session-state `transferLog` seeded with mocks. A DevPanel overlay intercepts all axios calls and displays them live with animations.

**Tech Stack:** React 18, Vite 5, Tailwind CSS 3, Axios, React Router v6, Lucide React, Vitest

---

## File Map

```
src/
  utils.js               # formatBalance, formatAmount, truncateAddress, resolveEmail,
                         # relativeTime, groupByDate, getKycLabel, getVirtualAccount
  utils.test.js          # Vitest tests for utils
  mocks.js               # MOCK_CUSTOMER, MOCK_WALLET, MOCK_IBAN, MOCK_TRANSFERS
  api/
    client.js            # axios instance + dev interceptors + listener registry
    customers.js         # getCustomer, getBalances
    wallets.js           # listWallets, getWallet
    accounts.js          # listAccounts
    transfers.js         # getTransfer, createPayoutQuote, createPayout
    sandbox.js           # topup
  context/
    AppContext.jsx        # AppProvider, useApp — customer/wallet/accounts/transferLog/loggedOut
  components/
    Card.jsx             # rounded-2xl dark card wrapper
    Badge.jsx            # status chip with variant map
    Button.jsx           # primary/ghost/danger variants with loading spinner
    Skeleton.jsx         # animate-pulse placeholder block
    CopyField.jsx        # label + value + copy icon, swaps to Check for 1.5s
    Toast.jsx            # ToastContainer (listens to custom events) + showToast helper
    TransactionRow.jsx   # direction icon, description, amount, status, relative time
    BottomNav.jsx        # fixed bottom 4-tab nav (mobile only)
    DevPanel.jsx         # slide-in overlay: Requests tab + State tab
  pages/
    Dashboard.jsx        # balance card, account card, quick actions, recent txns, KYC banner
    AddMoney.jsx         # SEPA/SWIFT/Stablecoin tabs with CopyFields
    Send.jsx             # Bank payout flow + P2P flow, each 3-step
    History.jsx          # filtered + grouped transfer list with expandable rows
    Profile.jsx          # KYC card, account details, logout
  App.jsx                # BrowserRouter + AppProvider + routes + overlay components
  main.jsx
  index.css
tailwind.config.js
postcss.config.js
.env.example
vite.config.js
```

---

## Task 1: Scaffold project

**Files:**
- Create: `package.json` (via npm create vite)
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `src/index.css`
- Create: `.env.example`
- Create: `.gitignore`

- [ ] **Step 1: Scaffold Vite project**

```bash
cd /home/bbx/swipelux/dummy-neobank
npm create vite@latest . -- --template react
```

Expected: created `src/`, `index.html`, `vite.config.js`, `package.json`

- [ ] **Step 2: Install dependencies**

```bash
npm install axios react-router-dom lucide-react
npm install -D tailwindcss@3 postcss autoprefixer vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
npx tailwindcss init -p
```

Expected: `node_modules/` created, `tailwind.config.js` and `postcss.config.js` generated

- [ ] **Step 3: Configure Tailwind**

Replace `tailwind.config.js` with:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        base: '#111827',
        card: '#1F2937',
        'card-hover': '#374151',
        accent: {
          DEFAULT: '#F97316',
          hover: '#EA6C0A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'slide-in-top': {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'slide-in-top': 'slide-in-top 200ms ease-out forwards',
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 4: Set up CSS and Inter font**

Replace `src/index.css` with:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    font-family: 'Inter', system-ui, sans-serif;
    background-color: #111827;
  }
  * {
    @apply border-[#374151];
  }
}
```

- [ ] **Step 5: Configure Vitest in vite.config.js**

Replace `vite.config.js` with:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.js'],
    globals: true,
  },
})
```

Create `src/setupTests.js`:

```js
import '@testing-library/jest-dom'
```

- [ ] **Step 6: Create .env.example**

```bash
cat > .env.example << 'EOF'
VITE_API_URL=http://localhost:3000
VITE_API_TOKEN=your-api-key-here
VITE_CUSTOMER_ID=cus_xxx
VITE_RECIPIENT_ACCOUNT_ID=racc_xxx
VITE_RECIPIENT_WALLET_ID=wal_xxx
VITE_DEMO_EMAIL=ak2@swipelux.com
EOF
cp .env.example .env
```

- [ ] **Step 7: Update index.html with viewport meta**

Replace `<head>` content in `index.html` with:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Swipelux</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 8: Git init and first commit**

```bash
git init
echo "node_modules/\n.env\ndist/" > .gitignore
git add .
git commit -m "chore: scaffold Vite + React + Tailwind + Vitest"
```

Expected: `[main (root-commit) xxxxxxx] chore: scaffold Vite + React + Tailwind + Vitest`

---

## Task 2: Utility functions (TDD)

**Files:**
- Create: `src/utils.js`
- Create: `src/utils.test.js`

- [ ] **Step 1: Write failing tests**

Create `src/utils.test.js`:

```js
import { describe, it, expect } from 'vitest'
import {
  formatBalance,
  formatAmount,
  truncateAddress,
  resolveEmail,
  relativeTime,
  groupByDate,
  getKycLabel,
  getVirtualAccount,
} from './utils'

describe('formatBalance', () => {
  it('formats numeric string with 2 decimals', () => {
    expect(formatBalance('2500.00')).toBe('2,500.00')
  })
  it('handles number input', () => {
    expect(formatBalance(1000)).toBe('1,000.00')
  })
  it('returns 0.00 for invalid', () => {
    expect(formatBalance('')).toBe('0.00')
  })
})

describe('formatAmount', () => {
  it('formats amount with currency suffix', () => {
    expect(formatAmount('200', 'USDC')).toBe('200.00 USDC')
  })
  it('handles missing currency', () => {
    expect(formatAmount('50')).toBe('50.00')
  })
})

describe('truncateAddress', () => {
  it('truncates long address at 6 chars each side', () => {
    const addr = '0x71C7656EC7ab88b098defB751B7401B5f6d8976F'
    expect(truncateAddress(addr)).toBe('0x71C7…976F')
  })
  it('returns short strings unchanged', () => {
    expect(truncateAddress('short')).toBe('short')
  })
  it('returns empty string for null', () => {
    expect(truncateAddress(null)).toBe('')
  })
})

describe('resolveEmail', () => {
  it('resolves demo email to wallet ID', () => {
    expect(resolveEmail('ak2@swipelux.com', 'ak2@swipelux.com', 'wal_abc')).toBe('wal_abc')
  })
  it('returns null for unknown email', () => {
    expect(resolveEmail('other@x.com', 'ak2@swipelux.com', 'wal_abc')).toBeNull()
  })
  it('is case-insensitive', () => {
    expect(resolveEmail('AK2@SWIPELUX.COM', 'ak2@swipelux.com', 'wal_abc')).toBe('wal_abc')
  })
  it('returns null for empty email', () => {
    expect(resolveEmail('', 'ak2@swipelux.com', 'wal_abc')).toBeNull()
  })
})

describe('getKycLabel', () => {
  it('returns green for approved', () => {
    expect(getKycLabel('approved').color).toBe('green')
  })
  it('returns amber for pending', () => {
    expect(getKycLabel('pending').color).toBe('amber')
  })
  it('returns red for rejected', () => {
    expect(getKycLabel('rejected').color).toBe('red')
  })
  it('falls back gracefully for unknown status', () => {
    expect(getKycLabel('unknown').color).toBe('gray')
  })
})

describe('getVirtualAccount', () => {
  it('prefers SEPA over SWIFT', () => {
    const accounts = [
      { source: 'virtual', type: 'swift', swiftCode: 'ABC' },
      { source: 'virtual', type: 'sepa', iban: 'EE38' },
    ]
    expect(getVirtualAccount(accounts).type).toBe('sepa')
  })
  it('falls back to SWIFT if no SEPA', () => {
    const accounts = [{ source: 'virtual', type: 'swift', swiftCode: 'ABC' }]
    expect(getVirtualAccount(accounts).type).toBe('swift')
  })
  it('returns null for empty array', () => {
    expect(getVirtualAccount([])).toBeNull()
  })
  it('ignores external accounts', () => {
    const accounts = [{ source: 'external', type: 'sepa', iban: 'EE38' }]
    expect(getVirtualAccount(accounts)).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/utils.test.js
```

Expected: FAIL — `Cannot find module './utils'`

- [ ] **Step 3: Implement utils.js**

Create `src/utils.js`:

```js
export function formatBalance(amount) {
  const num = parseFloat(amount)
  if (isNaN(num)) return '0.00'
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function formatAmount(amount, currency) {
  const num = parseFloat(amount)
  const formatted = isNaN(num)
    ? '0.00'
    : num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return currency ? `${formatted} ${currency}` : formatted
}

export function truncateAddress(address, chars = 4) {
  if (!address) return ''
  if (address.length <= chars * 2 + 3) return address
  return `${address.slice(0, chars + 2)}…${address.slice(-chars)}`
}

export function resolveEmail(email, demoEmail, recipientWalletId) {
  if (!email) return null
  if (email.toLowerCase() === (demoEmail ?? '').toLowerCase()) return recipientWalletId
  return null
}

export function relativeTime(isoString) {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function groupByDate(transfers) {
  const now = new Date()
  const todayStr = now.toDateString()
  const yesterdayStr = new Date(now - 86400000).toDateString()
  const groups = {}
  for (const t of [...transfers].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))) {
    const d = new Date(t.createdAt)
    let label
    if (d.toDateString() === todayStr) label = 'Today'
    else if (d.toDateString() === yesterdayStr) label = 'Yesterday'
    else label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    if (!groups[label]) groups[label] = []
    groups[label].push(t)
  }
  return groups
}

export function getKycLabel(status) {
  const map = {
    not_started: { label: 'Not started', color: 'gray', description: 'Identity verification has not been initiated.' },
    pending: { label: 'Under review', color: 'amber', description: 'Your identity is being reviewed. This usually takes 1–2 business days.' },
    approved: { label: 'Verified', color: 'green', description: 'Your identity has been verified.' },
    rejected: { label: 'Action required', color: 'red', description: 'We could not verify your identity. Please contact support.' },
  }
  return map[status] ?? map.not_started
}

export function getVirtualAccount(accounts) {
  return accounts.find(a => a.source === 'virtual' && a.type === 'sepa')
    ?? accounts.find(a => a.source === 'virtual' && a.type === 'swift')
    ?? accounts.find(a => a.source === 'virtual')
    ?? null
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/utils.test.js
```

Expected: all 16 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils.js src/utils.test.js
git commit -m "feat: add utility functions with full test coverage"
```

---

## Task 3: Mock data + API modules

**Files:**
- Create: `src/mocks.js`
- Create: `src/api/client.js`
- Create: `src/api/customers.js`
- Create: `src/api/wallets.js`
- Create: `src/api/accounts.js`
- Create: `src/api/transfers.js`
- Create: `src/api/sandbox.js`

- [ ] **Step 1: Create mocks.js**

Create `src/mocks.js`:

```js
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
```

- [ ] **Step 2: Create API client with dev interceptors**

Create `src/api/client.js`:

```js
import axios from 'axios'

// Dev listener registry — DevPanel registers here to receive request events
const listeners = new Set()

export function addDevListener(fn) {
  listeners.add(fn)
}

export function removeDevListener(fn) {
  listeners.delete(fn)
}

function notify(event) {
  listeners.forEach(fn => fn(event))
}

export const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  headers: {
    'X-API-Key': import.meta.env.VITE_API_TOKEN ?? '',
    'Content-Type': 'application/json',
  },
})

let reqCounter = 0

client.interceptors.request.use(config => {
  const id = ++reqCounter
  config._devId = id
  config._devStart = performance.now()
  notify({
    type: 'request',
    entry: {
      id,
      method: (config.method ?? 'GET').toUpperCase(),
      url: config.url,
      status: 'pending',
      statusCode: null,
      durationMs: null,
      requestBody: config.data ? JSON.parse(config.data) : null,
      responseBody: null,
      timestamp: new Date().toISOString(),
    },
  })
  return config
})

client.interceptors.response.use(
  response => {
    const id = response.config._devId
    const durationMs = Math.round(performance.now() - response.config._devStart)
    notify({
      type: 'response',
      entry: {
        id,
        method: (response.config.method ?? 'GET').toUpperCase(),
        url: response.config.url,
        status: 'success',
        statusCode: response.status,
        durationMs,
        requestBody: response.config.data ? JSON.parse(response.config.data) : null,
        responseBody: response.data,
        timestamp: new Date().toISOString(),
      },
    })
    return response
  },
  error => {
    const id = error.config?._devId
    const durationMs = error.config?._devStart
      ? Math.round(performance.now() - error.config._devStart)
      : null
    notify({
      type: 'response',
      entry: {
        id,
        method: (error.config?.method ?? 'GET').toUpperCase(),
        url: error.config?.url ?? '?',
        status: 'error',
        statusCode: error.response?.status ?? null,
        durationMs,
        requestBody: error.config?.data ? JSON.parse(error.config.data) : null,
        responseBody: error.response?.data ?? { message: error.message },
        timestamp: new Date().toISOString(),
      },
    })
    const message = error.response?.data?.message ?? error.message ?? 'Request failed'
    window.dispatchEvent(new CustomEvent('api-error', { detail: { message } }))
    return Promise.reject(error)
  }
)

export default client
```

- [ ] **Step 3: Create API resource modules**

Create `src/api/customers.js`:

```js
import client from './client'

export function getCustomer(id) {
  return client.get(`/v1/customers/${id}`).then(r => r.data)
}

export function getBalances(id) {
  return client.get(`/v1/customers/${id}/balances`).then(r => r.data)
}
```

Create `src/api/wallets.js`:

```js
import client from './client'

export function listWallets(customerId) {
  return client.get(`/v1/customers/${customerId}/wallets`).then(r => r.data)
}

export function getWallet(customerId, walletId) {
  return client.get(`/v1/customers/${customerId}/wallets/${walletId}`).then(r => r.data)
}
```

Create `src/api/accounts.js`:

```js
import client from './client'

export function listAccounts(customerId) {
  return client.get(`/v1/customers/${customerId}/accounts`).then(r => r.data)
}
```

Create `src/api/transfers.js`:

```js
import client from './client'

export function getTransfer(id) {
  return client.get(`/v1/transfers/${id}`).then(r => r.data)
}

export function createPayoutQuote({ fromWalletId, amount, currency = 'USDC', toAccountId, toCurrency }) {
  return client.post('/v1/payout/quote', {
    from: { id: fromWalletId, amount: Number(amount), currency },
    to: { id: toAccountId, currency: toCurrency },
  }).then(r => r.data)
}

export function createPayout({ fromWalletId, amount, currency = 'USDC', toId, toCurrency }) {
  return client.post('/v1/payout', {
    from: { id: fromWalletId, amount: Number(amount), currency },
    to: { id: toId, currency: toCurrency },
  }).then(r => r.data)
}
```

Create `src/api/sandbox.js`:

```js
import client from './client'

export function topup({ walletId, amount, currency = 'USDC' }) {
  return client.post('/v1/sandbox/topup', {
    wallet: walletId,
    amount: String(amount),
    currency,
  }).then(r => r.data)
}
```

- [ ] **Step 4: Commit**

```bash
git add src/mocks.js src/api/
git commit -m "feat: add mock data and API resource modules"
```

---

## Task 4: AppContext

**Files:**
- Create: `src/context/AppContext.jsx`

- [ ] **Step 1: Create AppContext.jsx**

Create `src/context/AppContext.jsx`:

```jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { getCustomer } from '../api/customers'
import { listWallets, getWallet } from '../api/wallets'
import { listAccounts } from '../api/accounts'
import { MOCK_CUSTOMER, MOCK_WALLET, MOCK_IBAN, MOCK_TRANSFERS } from '../mocks'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [customer, setCustomer] = useState(null)
  const [wallet, setWallet] = useState(null)
  const [accounts, setAccounts] = useState([])
  const [transferLog, setTransferLog] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [loggedOut, setLoggedOut] = useState(false)

  useEffect(() => {
    const customerId = import.meta.env.VITE_CUSTOMER_ID
    if (!customerId) {
      // No customer ID configured — use mocks entirely
      setCustomer(MOCK_CUSTOMER)
      setWallet(MOCK_WALLET)
      setAccounts([MOCK_IBAN])
      setTransferLog(MOCK_TRANSFERS)
      setLoading(false)
      return
    }

    const fetchWallet = () =>
      listWallets(customerId)
        .then(({ wallets }) => {
          if (!wallets?.length) return MOCK_WALLET
          return getWallet(customerId, wallets[0].id).catch(() => MOCK_WALLET)
        })
        .catch(() => MOCK_WALLET)

    const fetchAccounts = () =>
      listAccounts(customerId)
        .then(({ accounts }) => (accounts?.length ? accounts : [MOCK_IBAN]))
        .catch(() => [MOCK_IBAN])

    Promise.all([
      getCustomer(customerId).catch(() => MOCK_CUSTOMER),
      fetchWallet(),
      fetchAccounts(),
    ])
      .then(([cust, wal, accs]) => {
        setCustomer(cust)
        setWallet(wal)
        setAccounts(accs)
        setTransferLog(MOCK_TRANSFERS)
      })
      .catch(() => {
        setError('Failed to load account. Using demo data.')
        setCustomer(MOCK_CUSTOMER)
        setWallet(MOCK_WALLET)
        setAccounts([MOCK_IBAN])
        setTransferLog(MOCK_TRANSFERS)
      })
      .finally(() => setLoading(false))
  }, [])

  function addTransfer(transfer) {
    setTransferLog(prev => [transfer, ...prev])
  }

  return (
    <AppContext.Provider
      value={{
        customer,
        wallet,
        accounts,
        transferLog,
        addTransfer,
        loading,
        error,
        loggedOut,
        setLoggedOut,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
```

- [ ] **Step 2: Commit**

```bash
git add src/context/AppContext.jsx
git commit -m "feat: add AppContext with boot sequence and mock fallback"
```

---

## Task 5: Primitive components

**Files:**
- Create: `src/components/Card.jsx`
- Create: `src/components/Badge.jsx`
- Create: `src/components/Button.jsx`
- Create: `src/components/Skeleton.jsx`
- Create: `src/components/CopyField.jsx`

- [ ] **Step 1: Create Card.jsx**

Create `src/components/Card.jsx`:

```jsx
export default function Card({ children, className = '', onClick }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl bg-[#1F2937] border border-[#374151] shadow-sm ${onClick ? 'cursor-pointer hover:bg-[#374151] transition-colors duration-150' : ''} ${className}`}
    >
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Create Badge.jsx**

Create `src/components/Badge.jsx`:

```jsx
const VARIANTS = {
  pending:        'bg-amber-500/20 text-amber-400',
  in_progress:    'bg-amber-500/20 text-amber-400',
  awaiting_funds: 'bg-amber-500/20 text-amber-400',
  completed:      'bg-green-500/20 text-green-400',
  approved:       'bg-green-500/20 text-green-400',
  failed:         'bg-red-500/20 text-red-400',
  rejected:       'bg-red-500/20 text-red-400',
  not_started:    'bg-gray-500/20 text-gray-400',
}

const LABELS = {
  pending:        'Pending',
  in_progress:    'In Progress',
  awaiting_funds: 'Awaiting Funds',
  completed:      'Completed',
  approved:       'Verified',
  failed:         'Failed',
  rejected:       'Rejected',
  not_started:    'Not Started',
}

export default function Badge({ status, label, className = '' }) {
  const variant = VARIANTS[status] ?? 'bg-gray-500/20 text-gray-400'
  const text = label ?? LABELS[status] ?? status
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${variant} ${className}`}>
      {text}
    </span>
  )
}
```

- [ ] **Step 3: Create Button.jsx**

Create `src/components/Button.jsx`:

```jsx
import { Loader2 } from 'lucide-react'

const VARIANTS = {
  primary: 'bg-[#F97316] hover:bg-[#EA6C0A] text-white',
  ghost:   'bg-transparent hover:bg-[#374151] text-gray-300',
  danger:  'bg-transparent hover:bg-red-500/10 text-red-400',
}

export default function Button({
  children,
  variant = 'primary',
  loading = false,
  className = '',
  fullWidth = false,
  ...props
}) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant] ?? VARIANTS.primary} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin flex-shrink-0" />}
      {children}
    </button>
  )
}
```

- [ ] **Step 4: Create Skeleton.jsx**

Create `src/components/Skeleton.jsx`:

```jsx
export default function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-[#374151] ${className}`} />
}
```

- [ ] **Step 5: Create CopyField.jsx**

Create `src/components/CopyField.jsx`:

```jsx
import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export default function CopyField({ label, value }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    if (!value) return
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[#374151] last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        <p className="text-sm text-gray-200 font-mono truncate">{value ?? '—'}</p>
      </div>
      <button
        onClick={handleCopy}
        className="ml-3 flex-shrink-0 p-1.5 rounded-lg hover:bg-[#374151] transition-colors duration-150 cursor-pointer"
        aria-label={`Copy ${label}`}
      >
        {copied
          ? <Check size={15} className="text-green-400 transition-colors duration-150" />
          : <Copy size={15} className="text-gray-400" />}
      </button>
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/Card.jsx src/components/Badge.jsx src/components/Button.jsx src/components/Skeleton.jsx src/components/CopyField.jsx
git commit -m "feat: add Card, Badge, Button, Skeleton, CopyField components"
```

---

## Task 6: Toast + TransactionRow + BottomNav

**Files:**
- Create: `src/components/Toast.jsx`
- Create: `src/components/TransactionRow.jsx`
- Create: `src/components/BottomNav.jsx`

- [ ] **Step 1: Create Toast.jsx**

Create `src/components/Toast.jsx`:

```jsx
import { useEffect, useState } from 'react'
import { X, AlertCircle, CheckCircle2 } from 'lucide-react'

function ToastItem({ id, message, type, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(id), 4000)
    return () => clearTimeout(t)
  }, [id, onDismiss])

  return (
    <div className="flex items-start gap-3 bg-[#1F2937] border border-[#374151] rounded-xl p-4 shadow-xl min-w-64 max-w-80">
      {type === 'error'
        ? <AlertCircle size={18} className="text-red-400 mt-0.5 flex-shrink-0" />
        : <CheckCircle2 size={18} className="text-green-400 mt-0.5 flex-shrink-0" />}
      <p className="text-sm text-gray-200 flex-1 leading-relaxed">{message}</p>
      <button
        onClick={() => onDismiss(id)}
        className="text-gray-500 hover:text-gray-300 cursor-pointer transition-colors duration-150 flex-shrink-0"
        aria-label="Dismiss notification"
      >
        <X size={15} />
      </button>
    </div>
  )
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    function onError(e) {
      setToasts(prev => [...prev, { id: Date.now() + Math.random(), message: e.detail.message, type: 'error' }])
    }
    function onSuccess(e) {
      setToasts(prev => [...prev, { id: Date.now() + Math.random(), message: e.detail.message, type: 'success' }])
    }
    window.addEventListener('api-error', onError)
    window.addEventListener('api-success', onSuccess)
    return () => {
      window.removeEventListener('api-error', onError)
      window.removeEventListener('api-success', onSuccess)
    }
  }, [])

  function dismiss(id) {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  if (!toasts.length) return null

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map(t => (
        <ToastItem key={t.id} {...t} onDismiss={dismiss} />
      ))}
    </div>
  )
}

// Call this anywhere to show a toast without prop drilling
export function showToast(message, type = 'success') {
  window.dispatchEvent(new CustomEvent(`api-${type}`, { detail: { message } }))
}
```

- [ ] **Step 2: Create TransactionRow.jsx**

Create `src/components/TransactionRow.jsx`:

```jsx
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from 'lucide-react'
import Badge from './Badge'
import { formatAmount, relativeTime } from '../utils'

function getDirection(transfer) {
  if (transfer.type === 'onramp') return 'in'
  if (transfer.type === 'offramp') return 'out'
  return 'p2p'
}

function getDescription(transfer) {
  if (transfer.type === 'onramp') {
    const rail = (transfer.from?.rail ?? 'bank transfer').toUpperCase()
    return `Received via ${rail}`
  }
  if (transfer.type === 'offramp') return 'Bank payout'
  return 'P2P Transfer'
}

export default function TransactionRow({ transfer, onClick }) {
  const direction = getDirection(transfer)
  const isIn = direction === 'in'
  const amount = transfer.from?.amount ?? '0'
  const currency = transfer.from?.currency ?? 'USDC'

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 py-3 rounded-xl hover:bg-[#1F2937] px-2 -mx-2 transition-colors duration-150 cursor-pointer text-left"
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
        isIn ? 'bg-green-500/15' : direction === 'p2p' ? 'bg-blue-500/15' : 'bg-red-500/15'
      }`}>
        {isIn
          ? <ArrowDownLeft size={18} className="text-green-400" />
          : direction === 'p2p'
          ? <ArrowLeftRight size={18} className="text-blue-400" />
          : <ArrowUpRight size={18} className="text-red-400" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-200 truncate">{getDescription(transfer)}</p>
        <p className="text-xs text-gray-500 mt-0.5">{relativeTime(transfer.createdAt)}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={`text-sm font-semibold ${isIn ? 'text-green-400' : 'text-red-400'}`}>
          {isIn ? '+' : '−'}{formatAmount(amount, currency)}
        </p>
        <Badge status={transfer.state} className="mt-0.5" />
      </div>
    </button>
  )
}
```

- [ ] **Step 3: Create BottomNav.jsx**

Create `src/components/BottomNav.jsx`:

```jsx
import { NavLink } from 'react-router-dom'
import { Home, Send, PlusCircle, User } from 'lucide-react'

const tabs = [
  { to: '/', icon: Home, label: 'Home', end: true },
  { to: '/send', icon: Send, label: 'Send', end: false },
  { to: '/add-money', icon: PlusCircle, label: 'Add money', end: false },
  { to: '/profile', icon: User, label: 'Profile', end: false },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#111827] border-t border-[#374151] md:hidden">
      <div className="flex pb-safe">
        {tabs.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-1 py-3 transition-colors duration-150 ${
                isActive ? 'text-[#F97316]' : 'text-gray-500 hover:text-gray-300'
              }`
            }
          >
            <Icon size={22} />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/Toast.jsx src/components/TransactionRow.jsx src/components/BottomNav.jsx
git commit -m "feat: add Toast, TransactionRow, BottomNav components"
```

---

## Task 7: App shell and routing

**Files:**
- Modify: `src/main.jsx`
- Create: `src/App.jsx`
- Create stub pages: `src/pages/Dashboard.jsx`, `src/pages/AddMoney.jsx`, `src/pages/Send.jsx`, `src/pages/History.jsx`, `src/pages/Profile.jsx`

- [ ] **Step 1: Create stub pages and stub DevPanel**

Create each of the following (they will be replaced in later tasks):

`src/components/DevPanel.jsx` (stub — replaced in Task 8):
```jsx
export default function DevPanel() {
  return null
}
```

`src/pages/Dashboard.jsx`:
```jsx
export default function Dashboard() {
  return <div className="p-4 text-white">Dashboard</div>
}
```

`src/pages/AddMoney.jsx`:
```jsx
export default function AddMoney() {
  return <div className="p-4 text-white">Add Money</div>
}
```

`src/pages/Send.jsx`:
```jsx
export default function Send() {
  return <div className="p-4 text-white">Send</div>
}
```

`src/pages/History.jsx`:
```jsx
export default function History() {
  return <div className="p-4 text-white">History</div>
}
```

`src/pages/Profile.jsx`:
```jsx
export default function Profile() {
  return <div className="p-4 text-white">Profile</div>
}
```

- [ ] **Step 2: Create App.jsx**

Create `src/App.jsx`:

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import BottomNav from './components/BottomNav'
import ToastContainer from './components/Toast'
import Dashboard from './pages/Dashboard'
import AddMoney from './pages/AddMoney'
import Send from './pages/Send'
import History from './pages/History'
import Profile from './pages/Profile'
import DevPanel from './components/DevPanel'

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <div className="min-h-screen bg-[#111827] font-sans">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/add-money" element={<AddMoney />} />
            <Route path="/send" element={<Send />} />
            <Route path="/history" element={<History />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
          <BottomNav />
          <ToastContainer />
          <DevPanel />
        </div>
      </AppProvider>
    </BrowserRouter>
  )
}
```

- [ ] **Step 3: Update main.jsx**

Replace `src/main.jsx` with:

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

- [ ] **Step 4: Verify dev server starts**

```bash
npm run dev
```

Expected: Vite starts on http://localhost:5173, page loads with dark background and "Dashboard" text

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx src/main.jsx src/pages/
git commit -m "feat: add app shell with routing and stub pages"
```

---

## Task 8: DevPanel

**Files:**
- Create: `src/components/DevPanel.jsx`

- [ ] **Step 1: Create DevPanel.jsx**

Create `src/components/DevPanel.jsx`:

```jsx
import { useEffect, useRef, useState } from 'react'
import { X, Activity, Database, ChevronDown, ChevronRight, Terminal } from 'lucide-react'
import { addDevListener, removeDevListener } from '../api/client'
import { useApp } from '../context/AppContext'

const METHOD_COLORS = {
  GET:    'bg-blue-500/20 text-blue-400',
  POST:   'bg-orange-500/20 text-orange-400',
  PATCH:  'bg-purple-500/20 text-purple-400',
  PUT:    'bg-purple-500/20 text-purple-400',
  DELETE: 'bg-red-500/20 text-red-400',
}

function RequestEntry({ entry, isNew }) {
  const [expanded, setExpanded] = useState(false)
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <div
      className={`border-b border-[#374151] last:border-0 ${
        !prefersReduced && isNew ? 'animate-slide-in-top' : ''
      }`}
    >
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-2 p-3 hover:bg-[#1F2937] transition-colors duration-150 cursor-pointer text-left"
      >
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${METHOD_COLORS[entry.method] ?? 'bg-gray-500/20 text-gray-400'}`}>
          {entry.method}
        </span>
        <span className="flex-1 text-xs text-gray-300 font-mono truncate">
          {entry.url?.replace(/^\/v[12]/, '')}
        </span>
        <span className="flex-shrink-0 flex items-center gap-1.5">
          {entry.status === 'pending' ? (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          ) : entry.status === 'success' ? (
            <span className="text-[10px] text-green-400 font-mono">{entry.statusCode}</span>
          ) : (
            <span className="text-[10px] text-red-400 font-mono">{entry.statusCode ?? 'ERR'}</span>
          )}
          {entry.durationMs != null && (
            <span className="text-[10px] text-gray-500 font-mono">{entry.durationMs}ms</span>
          )}
          {expanded
            ? <ChevronDown size={13} className="text-gray-500" />
            : <ChevronRight size={13} className="text-gray-500" />}
        </span>
      </button>
      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          {entry.requestBody && (
            <div>
              <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wide">Request</p>
              <pre className="text-[11px] text-gray-300 bg-[#111827] rounded-lg p-2 overflow-x-auto leading-relaxed">
                {JSON.stringify(entry.requestBody, null, 2)}
              </pre>
            </div>
          )}
          {entry.responseBody && (
            <div>
              <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wide">Response</p>
              <pre className="text-[11px] text-gray-300 bg-[#111827] rounded-lg p-2 overflow-x-auto leading-relaxed max-h-48">
                {JSON.stringify(entry.responseBody, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function StateSection({ title, data }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="border-b border-[#374151] last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 p-3 hover:bg-[#1F2937] transition-colors duration-150 cursor-pointer text-left"
      >
        {open ? <ChevronDown size={13} className="text-gray-500" /> : <ChevronRight size={13} className="text-gray-500" />}
        <span className="text-xs font-medium text-gray-300">{title}</span>
      </button>
      {open && (
        <pre className="text-[11px] text-gray-300 bg-[#111827] rounded-lg mx-3 mb-3 p-2 overflow-x-auto leading-relaxed max-h-40">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  )
}

export default function DevPanel() {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('requests')
  const [requests, setRequests] = useState([])
  const [newIds, setNewIds] = useState(new Set())
  const [unread, setUnread] = useState(0)
  const { customer, wallet, transferLog } = useApp()

  useEffect(() => {
    function handleEvent({ type, entry }) {
      if (type === 'request') {
        setRequests(prev => [entry, ...prev].slice(0, 50))
        setNewIds(prev => new Set([...prev, entry.id]))
        setTimeout(() => {
          setNewIds(prev => { const n = new Set(prev); n.delete(entry.id); return n })
        }, 400)
        setUnread(n => n + 1)
      } else if (type === 'response') {
        setRequests(prev => prev.map(r => r.id === entry.id ? entry : r))
      }
    }
    addDevListener(handleEvent)
    return () => removeDevListener(handleEvent)
  }, [])

  function handleOpen() {
    setOpen(true)
    setUnread(0)
  }

  const stateSnapshot = {
    customer: customer ? { id: customer.id, name: `${customer.firstName} ${customer.lastName}`, status: customer.status } : null,
    wallet: wallet ? { id: wallet.id, address: wallet.address?.slice(0, 10) + '…', balances: wallet.balances } : null,
    transferLog: transferLog.map(t => ({ id: t.id, type: t.type, state: t.state })),
  }

  return (
    <>
      {/* FAB toggle */}
      <button
        onClick={open ? () => setOpen(false) : handleOpen}
        className="fixed bottom-20 right-4 md:bottom-6 z-50 w-12 h-12 rounded-full bg-[#F97316] hover:bg-[#EA6C0A] text-white flex items-center justify-center shadow-lg transition-colors duration-150 cursor-pointer"
        aria-label="Toggle developer panel"
      >
        {open ? <X size={20} /> : <Terminal size={20} />}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Panel — desktop: right slide-in, mobile: bottom sheet */}
      <div
        className={`fixed z-40 bg-[#0F172A] border-[#374151] flex flex-col transition-transform duration-300 ease-in-out
          md:top-0 md:right-0 md:h-full md:w-96 md:border-l
          bottom-0 left-0 right-0 h-[65vh] rounded-t-2xl border-t md:rounded-none
          ${open
            ? 'translate-y-0 md:translate-x-0'
            : 'translate-y-full md:translate-y-0 md:translate-x-full'
          }
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#374151] flex-shrink-0">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-[#F97316]" />
            <span className="text-sm font-semibold text-white">Dev Panel</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg hover:bg-[#1F2937] transition-colors duration-150 cursor-pointer text-gray-400 hover:text-white"
            aria-label="Close dev panel"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#374151] flex-shrink-0">
          {[
            { id: 'requests', label: 'Requests', icon: Activity },
            { id: 'state', label: 'State', icon: Database },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors duration-150 cursor-pointer border-b-2 ${
                activeTab === id
                  ? 'border-[#F97316] text-[#F97316]'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'requests' && (
            requests.length === 0
              ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-600 text-xs">
                  <Activity size={24} className="mb-2 opacity-40" />
                  No requests yet
                </div>
              )
              : requests.map(entry => (
                <RequestEntry
                  key={entry.id}
                  entry={entry}
                  isNew={newIds.has(entry.id)}
                />
              ))
          )}
          {activeTab === 'state' && (
            <div>
              <StateSection title="Customer" data={stateSnapshot.customer} />
              <StateSection title="Wallet" data={stateSnapshot.wallet} />
              <StateSection title="Transfer Log" data={stateSnapshot.transferLog} />
            </div>
          )}
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Verify DevPanel renders**

```bash
npm run dev
```

Open http://localhost:5173 — orange FAB should appear bottom-right. Click it — panel slides up (mobile) or in from right (desktop). No console errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/DevPanel.jsx
git commit -m "feat: add DevPanel with live request feed and state viewer"
```

---

## Task 9: Dashboard page

**Files:**
- Modify: `src/pages/Dashboard.jsx`

- [ ] **Step 1: Replace Dashboard.jsx with full implementation**

Replace `src/pages/Dashboard.jsx` with:

```jsx
import { useNavigate } from 'react-router-dom'
import { Copy, Check, Bell, ArrowDownLeft, Send, History, AlertTriangle } from 'lucide-react'
import { useState } from 'react'
import Card from '../components/Card'
import Badge from '../components/Badge'
import Skeleton from '../components/Skeleton'
import TransactionRow from '../components/TransactionRow'
import CopyField from '../components/CopyField'
import { useApp } from '../context/AppContext'
import { formatBalance, getVirtualAccount } from '../utils'

function BalanceCard({ wallet }) {
  const balance = wallet?.balances?.[0]
  return (
    <Card className="p-5">
      <p className="text-xs text-gray-500 mb-1">Total balance</p>
      <p className="text-4xl font-bold text-white tracking-tight">
        {balance ? formatBalance(balance.amount) : '0.00'}
      </p>
      <p className="text-sm text-gray-400 mt-1">{balance?.currency ?? 'USDC'}</p>
      <div className="mt-4 pt-4 border-t border-[#374151]">
        <CopyField label="Wallet ID" value={wallet?.id} />
      </div>
    </Card>
  )
}

function AccountCard({ account }) {
  if (!account) return null
  return (
    <Card className="p-5">
      <p className="text-xs text-gray-500 mb-3">Virtual bank account</p>
      {account.type === 'sepa' ? (
        <>
          <CopyField label="IBAN" value={account.iban} />
          <CopyField label="BIC" value={account.bic} />
          {account.bankName && <CopyField label="Bank" value={account.bankName} />}
          {account.paymentReference && <CopyField label="Reference" value={account.paymentReference} />}
        </>
      ) : (
        <>
          <CopyField label="Account number" value={account.accountNumber} />
          <CopyField label="SWIFT" value={account.swiftCode} />
          {account.bankName && <CopyField label="Bank" value={account.bankName} />}
        </>
      )}
    </Card>
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-[#1F2937] border border-[#374151] p-5 space-y-3">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-10 w-40" />
      <Skeleton className="h-3 w-12" />
    </div>
  )
}

export default function Dashboard() {
  const { customer, wallet, accounts, transferLog, loading, error } = useApp()
  const navigate = useNavigate()
  const virtualAccount = getVirtualAccount(accounts)
  const recentTxns = transferLog.slice(0, 5)
  const kycOk = customer?.status === 'approved'

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-28 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-xs text-gray-500">{greeting}</p>
          <h1 className="text-xl font-bold text-white">
            {loading ? 'Loading…' : customer?.firstName ?? 'Welcome'}
          </h1>
        </div>
        <button className="p-2 rounded-full hover:bg-[#1F2937] transition-colors duration-150 cursor-pointer text-gray-400 hover:text-white" aria-label="Notifications">
          <Bell size={22} />
        </button>
      </div>

      {/* Boot error banner */}
      {error && (
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
          <AlertTriangle size={16} className="text-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-300">{error}</p>
        </div>
      )}

      {/* KYC banner */}
      {!loading && !kycOk && (
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
          <AlertTriangle size={16} className="text-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-300">
            Your account is under review. Sending is disabled until verification is complete.
          </p>
        </div>
      )}

      {/* Balance card */}
      {loading ? <SkeletonCard /> : <BalanceCard wallet={wallet} />}

      {/* Virtual account card */}
      {loading
        ? <SkeletonCard />
        : virtualAccount && <AccountCard account={virtualAccount} />}

      {/* Quick actions */}
      <div className="flex gap-3">
        {[
          { label: 'Add money', icon: ArrowDownLeft, to: '/add-money', always: true },
          { label: 'Send', icon: Send, to: '/send', always: false },
          { label: 'History', icon: History, to: '/history', always: true },
        ].map(({ label, icon: Icon, to, always }) => (
          <button
            key={to}
            onClick={() => navigate(to)}
            disabled={!always && !kycOk}
            className="flex-1 flex flex-col items-center gap-1.5 bg-[#1F2937] hover:bg-[#374151] border border-[#374151] rounded-2xl py-3 transition-colors duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Icon size={20} className="text-[#F97316]" />
            <span className="text-xs text-gray-300">{label}</span>
          </button>
        ))}
      </div>

      {/* Recent activity */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 mb-3">Recent activity</h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-2 w-20" />
                </div>
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        ) : recentTxns.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            <History size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">No transactions yet. Add money to get started.</p>
          </div>
        ) : (
          <div>
            {recentTxns.map(t => (
              <TransactionRow
                key={t.id}
                transfer={t}
                onClick={() => navigate('/history')}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser**

```bash
npm run dev
```

Open http://localhost:5173 — Dashboard should show skeleton cards while loading, then real balance + IBAN, or mock data if API is unavailable.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Dashboard.jsx
git commit -m "feat: implement Dashboard page with balance, account card, and recent activity"
```

---

## Task 10: AddMoney page

**Files:**
- Modify: `src/pages/AddMoney.jsx`

- [ ] **Step 1: Replace AddMoney.jsx**

Replace `src/pages/AddMoney.jsx` with:

```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Share2, QrCode } from 'lucide-react'
import Card from '../components/Card'
import CopyField from '../components/CopyField'
import { useApp } from '../context/AppContext'
import { showToast } from '../components/Toast'

const TABS = ['SEPA', 'SWIFT', 'Stablecoin']

function SepaTab({ account }) {
  if (!account) return <p className="text-sm text-gray-500 p-4">No SEPA account available.</p>
  return (
    <div className="space-y-4">
      <Card className="p-5">
        <CopyField label="IBAN" value={account.iban} />
        <CopyField label="BIC / SWIFT" value={account.bic} />
        {account.bankName && <CopyField label="Bank name" value={account.bankName} />}
        {account.accountHolderName && <CopyField label="Account holder" value={account.accountHolderName} />}
        {account.paymentReference && <CopyField label="Payment reference" value={account.paymentReference} />}
        {account.currency && <CopyField label="Currency" value={account.currency} />}
      </Card>
      <p className="text-xs text-gray-500 leading-relaxed">
        Send a bank transfer to the account above. Include the payment reference in the memo field so your funds are credited automatically. Funds typically arrive within 1–2 business days.
      </p>
    </div>
  )
}

function SwiftTab({ account }) {
  if (!account) return <p className="text-sm text-gray-500 p-4">No SWIFT account available.</p>
  return (
    <div className="space-y-4">
      <Card className="p-5">
        <CopyField label="Account number" value={account.accountNumber} />
        <CopyField label="SWIFT / BIC" value={account.swiftCode} />
        {account.bankName && <CopyField label="Bank name" value={account.bankName} />}
        {account.accountHolderName && <CopyField label="Account holder" value={account.accountHolderName} />}
        {account.routingNumber && <CopyField label="Routing number" value={account.routingNumber} />}
        {account.bankAddress && <CopyField label="Bank address" value={account.bankAddress} />}
      </Card>
      <p className="text-xs text-gray-500 leading-relaxed">
        Use these details for international wire transfers. Funds typically arrive within 1–3 business days.
      </p>
    </div>
  )
}

function StablecoinTab({ wallet }) {
  return (
    <div className="space-y-4">
      <Card className="p-5">
        <p className="text-xs text-gray-500 mb-3">Send USDC or other stablecoins to this address</p>
        <CopyField label="Wallet address" value={wallet?.address} />
        {wallet?.chain && <CopyField label="Network" value={wallet.chain.toUpperCase()} />}
      </Card>
      <div className="flex justify-center">
        <div className="w-32 h-32 border-2 border-dashed border-[#374151] rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-600">
          <QrCode size={28} className="opacity-40" />
          <span className="text-[10px]">QR code</span>
        </div>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed text-center">
        Only send assets on the {wallet?.chain?.toUpperCase() ?? 'Polygon'} network to this address.
      </p>
    </div>
  )
}

export default function AddMoney() {
  const { accounts, wallet } = useApp()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('SEPA')

  const sepaAccount = accounts.find(a => a.source === 'virtual' && a.type === 'sepa')
  const swiftAccount = accounts.find(a => a.source === 'virtual' && a.type === 'swift')

  const availableTabs = [
    sepaAccount && 'SEPA',
    swiftAccount && 'SWIFT',
    'Stablecoin',
  ].filter(Boolean)

  function handleShare() {
    const account = activeTab === 'SEPA' ? sepaAccount : swiftAccount
    if (!account && activeTab !== 'Stablecoin') return
    let text = ''
    if (activeTab === 'SEPA' && account) {
      text = `IBAN: ${account.iban}\nBIC: ${account.bic}\nBank: ${account.bankName ?? ''}\nReference: ${account.paymentReference ?? ''}`
    } else if (activeTab === 'SWIFT' && account) {
      text = `Account: ${account.accountNumber}\nSWIFT: ${account.swiftCode}\nBank: ${account.bankName ?? ''}`
    } else {
      text = `Wallet address: ${wallet?.address ?? ''}\nNetwork: ${wallet?.chain?.toUpperCase() ?? ''}`
    }
    navigator.clipboard.writeText(text)
    showToast('Account details copied to clipboard')
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-28 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-[#1F2937] transition-colors duration-150 cursor-pointer text-gray-400 hover:text-white">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-white">Add money</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#1F2937] rounded-xl p-1">
        {availableTabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors duration-150 cursor-pointer ${
              activeTab === tab
                ? 'bg-[#374151] text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'SEPA' && <SepaTab account={sepaAccount} />}
      {activeTab === 'SWIFT' && <SwiftTab account={swiftAccount} />}
      {activeTab === 'Stablecoin' && <StablecoinTab wallet={wallet} />}

      {/* Share button */}
      <button
        onClick={handleShare}
        className="w-full flex items-center justify-center gap-2 bg-[#1F2937] hover:bg-[#374151] border border-[#374151] rounded-xl py-3 text-sm text-gray-300 transition-colors duration-150 cursor-pointer"
      >
        <Share2 size={16} />
        Share details
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/AddMoney.jsx
git commit -m "feat: implement AddMoney page with SEPA/SWIFT/Stablecoin tabs"
```

---

## Task 11: Send page

**Files:**
- Modify: `src/pages/Send.jsx`

- [ ] **Step 1: Replace Send.jsx with full implementation**

Replace `src/pages/Send.jsx` with:

```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, User, Building2 } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import { useApp } from '../context/AppContext'
import { createPayoutQuote, createPayout } from '../api/transfers'
import { resolveEmail, formatAmount, formatBalance } from '../utils'
import { showToast } from '../components/Toast'

// ─── Bank Payout ────────────────────────────────────────────────────────────

function BankPayoutFlow({ wallet, addTransfer, kycOk }) {
  const [step, setStep] = useState(1)
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')
  const [quote, setQuote] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const recipientAccountId = import.meta.env.VITE_RECIPIENT_ACCOUNT_ID
  const navigate = useNavigate()

  async function handleReview() {
    if (!amount || isNaN(Number(amount)) || Number(amount) < 0.1) {
      showToast('Enter a valid amount (min 0.1)', 'error')
      return
    }
    setLoading(true)
    try {
      const q = await createPayoutQuote({
        fromWalletId: wallet.id,
        amount: Number(amount),
        currency: 'USDC',
        toAccountId: recipientAccountId,
        toCurrency: 'EUR',
      })
      setQuote(q)
      setStep(2)
    } catch {
      // Error toast already fired by axios interceptor
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirm() {
    setLoading(true)
    try {
      const tx = await createPayout({
        fromWalletId: wallet.id,
        amount: Number(amount),
        currency: 'USDC',
        toId: recipientAccountId,
        toCurrency: 'EUR',
      })
      const transfer = {
        id: tx.id ?? `txn_${Date.now()}`,
        type: 'offramp',
        state: tx.state ?? 'pending',
        from: { identifier: wallet.id, amount, currency: 'USDC' },
        to: { identifier: recipientAccountId },
        createdAt: new Date().toISOString(),
      }
      addTransfer(transfer)
      setResult(transfer)
      showToast('Transfer initiated successfully')
      setStep(3)
    } catch {
      // Error toast already fired
    } finally {
      setLoading(false)
    }
  }

  if (step === 3 && result) {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
          <CheckCircle2 size={32} className="text-green-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Transfer initiated</h2>
          <p className="text-sm text-gray-400 mt-1">Your bank payout is being processed</p>
        </div>
        <Card className="p-4 text-left">
          <p className="text-xs text-gray-500 mb-0.5">Transaction ID</p>
          <p className="text-sm font-mono text-gray-200 break-all">{result.id}</p>
          <p className="text-xs text-gray-500 mt-3 mb-0.5">Amount</p>
          <p className="text-sm text-gray-200">{formatAmount(amount, 'USDC')}</p>
          <p className="text-xs text-gray-500 mt-3 mb-0.5">Estimated arrival</p>
          <p className="text-sm text-gray-200">1–2 business days</p>
        </Card>
        <Button fullWidth onClick={() => navigate('/')}>Back to home</Button>
      </div>
    )
  }

  if (step === 2) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Review transfer</h2>
        <Card className="p-5 space-y-3">
          <div><p className="text-xs text-gray-500">From</p><p className="text-sm text-gray-200 font-mono">{wallet?.id}</p></div>
          <div><p className="text-xs text-gray-500">Amount</p><p className="text-sm text-gray-200">{formatAmount(amount, 'USDC')}</p></div>
          {quote && (
            <>
              <div><p className="text-xs text-gray-500">Fee</p><p className="text-sm text-gray-200">{quote.fee ? `${quote.fee.amount} ${quote.fee.currency}` : '—'}</p></div>
              <div><p className="text-xs text-gray-500">You receive</p><p className="text-sm font-semibold text-white">{quote.destination_amount} EUR</p></div>
              <div><p className="text-xs text-gray-500">Rate</p><p className="text-sm text-gray-200">{quote.rate}</p></div>
            </>
          )}
          <div><p className="text-xs text-gray-500">Estimated arrival</p><p className="text-sm text-gray-200">1–2 business days</p></div>
          {memo && <div><p className="text-xs text-gray-500">Memo</p><p className="text-sm text-gray-200">{memo}</p></div>}
        </Card>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => setStep(1)} className="flex-1">Back</Button>
          <Button onClick={handleConfirm} loading={loading} className="flex-1">Confirm &amp; Send</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#374151] flex items-center justify-center flex-shrink-0">
            <Building2 size={18} className="text-gray-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-200">Demo Recipient</p>
            <p className="text-xs text-gray-500 font-mono">{recipientAccountId ? `${recipientAccountId.slice(0, 12)}…` : 'racc_demo'}</p>
          </div>
        </div>
      </Card>

      <div>
        <label className="block text-xs text-gray-500 mb-1.5" htmlFor="bank-amount">Amount</label>
        <div className="relative">
          <input
            id="bank-amount"
            type="number"
            min="0.1"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-full bg-[#1F2937] border border-[#374151] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#F97316] transition-colors duration-150 pr-16"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">USDC</span>
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1.5" htmlFor="bank-memo">Memo (optional)</label>
        <input
          id="bank-memo"
          type="text"
          placeholder="Payment reference"
          value={memo}
          onChange={e => setMemo(e.target.value)}
          className="w-full bg-[#1F2937] border border-[#374151] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#F97316] transition-colors duration-150"
        />
      </div>

      <Button
        fullWidth
        onClick={handleReview}
        loading={loading}
        disabled={!kycOk || !amount}
      >
        Review
      </Button>
      {!kycOk && (
        <p className="text-xs text-amber-400 text-center">Verification required to send funds</p>
      )}
    </div>
  )
}

// ─── P2P Transfer ────────────────────────────────────────────────────────────

function P2PFlow({ wallet, addTransfer, kycOk }) {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [resolvedWalletId, setResolvedWalletId] = useState(null)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const demoEmail = import.meta.env.VITE_DEMO_EMAIL
  const recipientWalletId = import.meta.env.VITE_RECIPIENT_WALLET_ID

  function handleEmailChange(e) {
    const val = e.target.value
    setEmail(val)
    const resolved = resolveEmail(val, demoEmail, recipientWalletId)
    setResolvedWalletId(resolved)
    if (val && !resolved && val.includes('@')) {
      // Only show "not found" when they've typed a complete-looking email
    }
  }

  function handleEmailBlur() {
    if (email && !resolvedWalletId) {
      showToast('User not found. Try ' + (demoEmail ?? 'the demo email'), 'error')
      setEmail('')
    }
  }

  async function handleConfirm() {
    if (!amount || isNaN(Number(amount)) || Number(amount) < 0.1) {
      showToast('Enter a valid amount (min 0.1)', 'error')
      return
    }
    setLoading(true)
    try {
      const tx = await createPayout({
        fromWalletId: wallet.id,
        amount: Number(amount),
        currency: 'USDC',
        toId: resolvedWalletId,
        toCurrency: 'USDC',
      })
      const transfer = {
        id: tx.id ?? `txn_${Date.now()}`,
        type: 'wallet_to_wallet',
        state: tx.state ?? 'pending',
        from: { identifier: wallet.id, amount, currency: 'USDC' },
        to: { identifier: resolvedWalletId },
        createdAt: new Date().toISOString(),
      }
      addTransfer(transfer)
      setResult(transfer)
      showToast('P2P transfer initiated')
      setStep(3)
    } catch {
      // Error toast already fired
    } finally {
      setLoading(false)
    }
  }

  if (step === 3 && result) {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
          <CheckCircle2 size={32} className="text-green-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Transfer sent</h2>
          <p className="text-sm text-gray-400 mt-1">Your P2P transfer is being processed</p>
        </div>
        <Card className="p-4 text-left">
          <p className="text-xs text-gray-500 mb-0.5">Transaction ID</p>
          <p className="text-sm font-mono text-gray-200 break-all">{result.id}</p>
          <p className="text-xs text-gray-500 mt-3 mb-0.5">Amount</p>
          <p className="text-sm text-gray-200">{formatAmount(amount, 'USDC')}</p>
        </Card>
        <Button fullWidth onClick={() => navigate('/')}>Back to home</Button>
      </div>
    )
  }

  if (step === 2) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Review transfer</h2>
        <Card className="p-5 space-y-3">
          <div><p className="text-xs text-gray-500">To</p><p className="text-sm text-gray-200">{email}</p></div>
          <div><p className="text-xs text-gray-500">Wallet</p><p className="text-sm font-mono text-gray-400 text-xs">{resolvedWalletId}</p></div>
          <div><p className="text-xs text-gray-500">Amount</p><p className="text-sm font-semibold text-white">{formatAmount(amount, 'USDC')}</p></div>
          {note && <div><p className="text-xs text-gray-500">Note</p><p className="text-sm text-gray-200">{note}</p></div>}
        </Card>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => setStep(1)} className="flex-1">Back</Button>
          <Button onClick={handleConfirm} loading={loading} className="flex-1">Confirm &amp; Send</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-gray-500 mb-1.5" htmlFor="p2p-email">Recipient email</label>
        <input
          id="p2p-email"
          type="email"
          placeholder={demoEmail ?? 'email@example.com'}
          value={email}
          onChange={handleEmailChange}
          onBlur={handleEmailBlur}
          className="w-full bg-[#1F2937] border border-[#374151] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#F97316] transition-colors duration-150"
        />
      </div>

      {resolvedWalletId && (
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F97316]/20 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-[#F97316]">AK</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-200">Arthur K.</p>
              <p className="text-xs text-green-400">✓ User found</p>
            </div>
          </div>
        </Card>
      )}

      <div>
        <label className="block text-xs text-gray-500 mb-1.5" htmlFor="p2p-amount">Amount</label>
        <div className="relative">
          <input
            id="p2p-amount"
            type="number"
            min="0.1"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-full bg-[#1F2937] border border-[#374151] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#F97316] transition-colors duration-150 pr-16"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">USDC</span>
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1.5" htmlFor="p2p-note">Note (optional)</label>
        <input
          id="p2p-note"
          type="text"
          placeholder="What's this for?"
          value={note}
          onChange={e => setNote(e.target.value)}
          className="w-full bg-[#1F2937] border border-[#374151] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#F97316] transition-colors duration-150"
        />
      </div>

      <Button
        fullWidth
        onClick={() => setStep(2)}
        disabled={!kycOk || !resolvedWalletId || !amount}
      >
        Review
      </Button>
      {!kycOk && (
        <p className="text-xs text-amber-400 text-center">Verification required to send funds</p>
      )}
    </div>
  )
}

// ─── Send page ───────────────────────────────────────────────────────────────

export default function Send() {
  const { wallet, addTransfer, customer } = useApp()
  const navigate = useNavigate()
  const [mode, setMode] = useState('bank')
  const kycOk = customer?.status === 'approved'

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-28 space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-[#1F2937] transition-colors duration-150 cursor-pointer text-gray-400 hover:text-white">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-white">Send</h1>
      </div>

      {/* Segmented control */}
      <div className="flex gap-1 bg-[#1F2937] rounded-xl p-1">
        {[
          { id: 'bank', label: 'Bank payout', icon: Building2 },
          { id: 'p2p', label: 'P2P Transfer', icon: User },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setMode(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-colors duration-150 cursor-pointer ${
              mode === id
                ? 'bg-[#374151] text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {mode === 'bank'
        ? <BankPayoutFlow wallet={wallet} addTransfer={addTransfer} kycOk={kycOk} />
        : <P2PFlow wallet={wallet} addTransfer={addTransfer} kycOk={kycOk} />}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Send.jsx
git commit -m "feat: implement Send page with bank payout and P2P flows"
```

---

## Task 12: History page

**Files:**
- Modify: `src/pages/History.jsx`

- [ ] **Step 1: Replace History.jsx**

Replace `src/pages/History.jsx` with:

```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Inbox } from 'lucide-react'
import TransactionRow from '../components/TransactionRow'
import { useApp } from '../context/AppContext'
import { groupByDate, formatAmount } from '../utils'

const DIRECTION_FILTERS = ['All', 'In', 'Out']
const STATUS_FILTERS = ['All', 'Completed', 'Pending', 'Failed']

function DetailPanel({ transfer, onClose }) {
  return (
    <div className="mt-2 mb-3 bg-[#111827] rounded-xl p-4 space-y-2 text-xs">
      <div className="flex justify-between">
        <span className="text-gray-500">Transaction ID</span>
        <span className="text-gray-300 font-mono break-all max-w-[60%] text-right">{transfer.id}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-500">Type</span>
        <span className="text-gray-300">{transfer.type}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-500">Status</span>
        <span className="text-gray-300">{transfer.state}</span>
      </div>
      {transfer.from?.rail && (
        <div className="flex justify-between">
          <span className="text-gray-500">Rail</span>
          <span className="text-gray-300 uppercase">{transfer.from.rail}</span>
        </div>
      )}
      <div className="flex justify-between">
        <span className="text-gray-500">Amount</span>
        <span className="text-gray-300">{formatAmount(transfer.from?.amount, transfer.from?.currency)}</span>
      </div>
      {transfer.from?.identifier && (
        <div className="flex justify-between">
          <span className="text-gray-500">From</span>
          <span className="text-gray-400 font-mono break-all max-w-[60%] text-right">{transfer.from.identifier}</span>
        </div>
      )}
      {transfer.to?.identifier && (
        <div className="flex justify-between">
          <span className="text-gray-500">To</span>
          <span className="text-gray-400 font-mono break-all max-w-[60%] text-right">{transfer.to.identifier}</span>
        </div>
      )}
      <div className="flex justify-between">
        <span className="text-gray-500">Date</span>
        <span className="text-gray-300">{new Date(transfer.createdAt).toLocaleString()}</span>
      </div>
      {transfer.failureReason && (
        <div className="flex justify-between">
          <span className="text-gray-500">Failure reason</span>
          <span className="text-red-400">{transfer.failureReason}</span>
        </div>
      )}
      <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xs cursor-pointer transition-colors duration-150 pt-1">
        ↑ Collapse
      </button>
    </div>
  )
}

export default function History() {
  const { transferLog } = useApp()
  const navigate = useNavigate()
  const [dirFilter, setDirFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [expandedId, setExpandedId] = useState(null)

  function matchesDirection(t) {
    if (dirFilter === 'All') return true
    if (dirFilter === 'In') return t.type === 'onramp'
    if (dirFilter === 'Out') return t.type === 'offramp' || t.type === 'wallet_to_wallet'
    return true
  }

  function matchesStatus(t) {
    if (statusFilter === 'All') return true
    if (statusFilter === 'Completed') return t.state === 'completed'
    if (statusFilter === 'Pending') return ['pending', 'in_progress', 'awaiting_funds'].includes(t.state)
    if (statusFilter === 'Failed') return t.state === 'failed'
    return true
  }

  const filtered = transferLog.filter(t => matchesDirection(t) && matchesStatus(t))
  const grouped = groupByDate(filtered)
  const dateLabels = Object.keys(grouped)

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-28 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-[#1F2937] transition-colors duration-150 cursor-pointer text-gray-400 hover:text-white">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-white">Transaction history</h1>
      </div>

      {/* Direction filter */}
      <div className="flex gap-2">
        {DIRECTION_FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setDirFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors duration-150 cursor-pointer border ${
              dirFilter === f
                ? 'bg-[#F97316] border-[#F97316] text-white'
                : 'border-[#374151] text-gray-400 hover:text-gray-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors duration-150 cursor-pointer border ${
              statusFilter === f
                ? 'bg-[#1F2937] border-[#F97316] text-[#F97316]'
                : 'border-[#374151] text-gray-400 hover:text-gray-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-600">
          <Inbox size={40} className="mb-3 opacity-40" />
          <p className="text-sm">No transactions yet. Add money to get started.</p>
        </div>
      ) : (
        dateLabels.map(label => (
          <div key={label}>
            <h2 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">{label}</h2>
            {grouped[label].map(t => (
              <div key={t.id}>
                <TransactionRow
                  transfer={t}
                  onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                />
                {expandedId === t.id && (
                  <DetailPanel transfer={t} onClose={() => setExpandedId(null)} />
                )}
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/History.jsx
git commit -m "feat: implement History page with filters, grouping, and expandable rows"
```

---

## Task 13: Profile page

**Files:**
- Modify: `src/pages/Profile.jsx`

- [ ] **Step 1: Replace Profile.jsx**

Replace `src/pages/Profile.jsx` with:

```jsx
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, LogOut, Shield } from 'lucide-react'
import Card from '../components/Card'
import Badge from '../components/Badge'
import CopyField from '../components/CopyField'
import Button from '../components/Button'
import { useApp } from '../context/AppContext'
import { getKycLabel, getVirtualAccount } from '../utils'

function Avatar({ firstName, lastName }) {
  const initials = [firstName?.[0], lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?'
  return (
    <div className="w-16 h-16 rounded-full bg-[#F97316]/20 flex items-center justify-center">
      <span className="text-xl font-bold text-[#F97316]">{initials}</span>
    </div>
  )
}

function LoggedOutScreen() {
  return (
    <div className="min-h-screen bg-[#111827] flex flex-col items-center justify-center gap-6 px-4">
      <div className="w-16 h-16 rounded-full bg-[#1F2937] flex items-center justify-center">
        <LogOut size={28} className="text-gray-400" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-bold text-white">You've been signed out</h2>
        <p className="text-sm text-gray-400 mt-1">Your session has ended.</p>
      </div>
      <Button onClick={() => window.location.reload()}>Sign back in</Button>
    </div>
  )
}

export default function Profile() {
  const { customer, wallet, accounts, loggedOut, setLoggedOut } = useApp()
  const navigate = useNavigate()
  const kycInfo = getKycLabel(customer?.status)
  const virtualAccount = getVirtualAccount(accounts)

  if (loggedOut) return <LoggedOutScreen />

  const kycDescriptions = {
    not_started: 'Identity verification has not been initiated.',
    pending: 'Your identity is being reviewed. This usually takes 1–2 business days.',
    approved: 'Your identity has been verified.',
    rejected: 'We could not verify your identity. Please contact support.',
  }

  const kycBorderColors = {
    green: 'border-green-500/30',
    amber: 'border-amber-500/30',
    red: 'border-red-500/30',
    gray: 'border-[#374151]',
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-28 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-[#1F2937] transition-colors duration-150 cursor-pointer text-gray-400 hover:text-white">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-white">Profile</h1>
      </div>

      {/* Identity */}
      <div className="flex items-center gap-4">
        <Avatar firstName={customer?.firstName} lastName={customer?.lastName} />
        <div>
          <p className="text-lg font-bold text-white">
            {customer ? `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim() : '—'}
          </p>
          <p className="text-sm text-gray-400">{customer?.email ?? '—'}</p>
          {customer?.phone && <p className="text-sm text-gray-500">{customer.phone}</p>}
        </div>
      </div>

      {/* KYC status */}
      <Card className={`p-5 border ${kycBorderColors[kycInfo.color] ?? 'border-[#374151]'}`}>
        <div className="flex items-center gap-2 mb-2">
          <Shield size={16} className={kycInfo.color === 'green' ? 'text-green-400' : kycInfo.color === 'amber' ? 'text-amber-400' : kycInfo.color === 'red' ? 'text-red-400' : 'text-gray-400'} />
          <span className="text-sm font-semibold text-white">Identity verification</span>
        </div>
        <Badge status={customer?.status ?? 'not_started'} className="mb-2" />
        <p className="text-xs text-gray-400 mt-1 leading-relaxed">
          {kycDescriptions[customer?.status] ?? kycDescriptions.not_started}
        </p>
      </Card>

      {/* Account details */}
      <Card className="p-5">
        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-3">Account details</p>
        <CopyField label="Customer ID" value={customer?.id} />
        {customer?.type && (
          <div className="py-2.5 border-b border-[#374151] last:border-0">
            <p className="text-xs text-gray-500 mb-0.5">Account type</p>
            <span className="text-xs bg-[#374151] text-gray-300 rounded-full px-2 py-0.5 capitalize">
              {customer.type}
            </span>
          </div>
        )}
      </Card>

      {/* Wallet */}
      {wallet && (
        <Card className="p-5">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-3">Wallet</p>
          <CopyField label="Wallet ID" value={wallet.id} />
          <CopyField label="Address" value={wallet.address} />
          {wallet.chain && <CopyField label="Network" value={wallet.chain.toUpperCase()} />}
        </Card>
      )}

      {/* Virtual account */}
      {virtualAccount && (
        <Card className="p-5">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-3">Virtual bank account</p>
          {virtualAccount.type === 'sepa' ? (
            <>
              <CopyField label="IBAN" value={virtualAccount.iban} />
              <CopyField label="BIC" value={virtualAccount.bic} />
              {virtualAccount.paymentReference && (
                <CopyField label="Reference" value={virtualAccount.paymentReference} />
              )}
            </>
          ) : (
            <>
              <CopyField label="Account number" value={virtualAccount.accountNumber} />
              <CopyField label="SWIFT" value={virtualAccount.swiftCode} />
            </>
          )}
        </Card>
      )}

      {/* Log out */}
      <Button
        variant="danger"
        fullWidth
        onClick={() => setLoggedOut(true)}
        className="border border-red-500/20"
      >
        <LogOut size={15} />
        Log out
      </Button>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Profile.jsx
git commit -m "feat: implement Profile page with KYC card and logout"
```

---

## Task 14: Network offline banner + final wiring

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Add offline detection to App.jsx**

Replace `src/App.jsx` with:

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'
import { AppProvider } from './context/AppContext'
import BottomNav from './components/BottomNav'
import ToastContainer from './components/Toast'
import DevPanel from './components/DevPanel'
import Dashboard from './pages/Dashboard'
import AddMoney from './pages/AddMoney'
import Send from './pages/Send'
import History from './pages/History'
import Profile from './pages/Profile'

function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const goOffline = () => setOffline(true)
    const goOnline = () => setOffline(false)
    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [])

  if (!offline) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-center gap-2 bg-amber-500/20 border-b border-amber-500/30 py-2 px-4">
      <WifiOff size={14} className="text-amber-400" />
      <p className="text-xs text-amber-300">No internet connection</p>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <OfflineBanner />
        <div className="min-h-screen bg-[#111827] font-sans">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/add-money" element={<AddMoney />} />
            <Route path="/send" element={<Send />} />
            <Route path="/history" element={<History />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
          <BottomNav />
          <ToastContainer />
          <DevPanel />
        </div>
      </AppProvider>
    </BrowserRouter>
  )
}
```

- [ ] **Step 2: Run full test suite**

```bash
npx vitest run
```

Expected: all utility tests PASS

- [ ] **Step 3: Smoke test in browser at 375px**

```bash
npm run dev
```

Open DevTools → device toolbar → 375px. Walk through all 5 screens. Verify:
- Dashboard loads balance + IBAN (or mock data)
- Add Money shows tabs and CopyFields
- Send → Bank payout: fill amount, Review button triggers quote call (visible in DevPanel)
- Send → P2P: enter demo email, recipient resolves, submit
- History shows mock + session transfers
- Profile shows KYC badge
- DevPanel orange FAB visible, panel opens with request history

- [ ] **Step 4: Final commit**

```bash
git add src/App.jsx
git commit -m "feat: add offline banner and complete app wiring"
```

---

## Verification Checklist

- [ ] `npm run dev` starts without errors
- [ ] `npx vitest run` — all tests pass
- [ ] Dashboard: balance + IBAN render (real or mock)
- [ ] Add Money: SEPA tab shows IBAN with working copy buttons
- [ ] Send → Bank payout: Review fires `POST /v1/payout/quote`, Confirm fires `POST /v1/payout`, success screen shows transfer ID
- [ ] Send → P2P: demo email resolves, confirm fires `POST /v1/payout`, success screen shows transfer ID
- [ ] History: session transfers appear + mock seeds, filters work, row expand shows detail
- [ ] Profile: KYC badge shows correct color, logout renders signed-out screen
- [ ] DevPanel: all API calls appear with method badge, status dot, duration, expandable body
- [ ] State tab reflects live AppContext values
- [ ] Responsive at 375px: bottom nav visible, no horizontal scroll
- [ ] Responsive at 1440px: content centered max-w-lg, DevPanel slides from right
- [ ] `prefers-reduced-motion`: DevPanel entry animation disabled, colors still transition
