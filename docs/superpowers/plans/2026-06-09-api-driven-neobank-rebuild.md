# API-driven neobank rebuild — Implementation Plan

> **For agentic workers:** This plan is executed by **codex gpt-5.5**, not by the superpowers subagent runner. Steps use checkbox (`- [ ]`) syntax for tracking. Follow tasks in order. TDD where tests are specified. Do NOT commit, do NOT modify `.env`, do NOT add dependencies — the reviewing agent commits after verification.

**Goal:** Make the demo a Revolut-like neobank driven entirely by the Swipelux API — onboarding provisions a wallet + virtual IBAN, sends use real recipients / wallet IDs, and all mock-data fallbacks are removed.

**Architecture:** Single axios `client` (header `X-API-Key`). Onboarding owns provisioning (create customer → create wallet → create virtual SEPA account). `AppContext` loads live customer/wallet/accounts/transfers with no mock fallback — screens render loading/empty/error states. Send uses recipients (bank payout) and a pasted wallet ID (P2P). KYC is soft-gated on real `verificationStatus`.

**Tech Stack:** React 19, Vite, Tailwind 3, react-router-dom 7, axios, vitest.

Spec: `docs/superpowers/specs/2026-06-09-api-driven-neobank-rebuild-design.md`

---

## File Structure

**Create:**
- `src/api/recipients.js` — recipients + recipient-account API helpers.
- `src/api/recipients.test.js` — unit tests.
- `src/api/wallets.test.js` — unit tests for `createWallet`.
- `src/api/accounts.test.js` — unit tests for `createAccount`.

**Modify:**
- `src/api/wallets.js` — add `createWallet`.
- `src/api/accounts.js` — add `createAccount`.
- `src/api/transfers.js` — remove duplicate `sandboxClient`; `sandboxTopup` via `client`.
- `src/context/AppContext.jsx` — live state, no mock fallback.
- `src/pages/Onboarding.jsx` — provisioning chain step.
- `src/pages/Send.jsx` — recipients bank flow, wallet-ID P2P, soft KYC gate.
- `src/pages/Dashboard.jsx` — no-wallet "set up" CTA + error/empty states.
- `src/pages/AddMoney.jsx` — empty states when no account/wallet.
- `src/pages/Profile.jsx` — read `verificationStatus`, `personal.*`.
- `src/components/DevPanel.jsx` — topup targets context wallet; read `verificationStatus`/`personal.*`; drop `SANDBOX_WALLET`.
- `src/utils.js` — remove `resolveEmail`; add `canSend` + `kycBanner` helpers.
- `src/utils.test.js` — add tests for `canSend`.
- `.env.example` — trim to 3 vars.

**Delete:**
- `src/mocks.js` — and all `MOCK_*` imports.

---

## Task 1: API helper — `createWallet`

**Files:**
- Modify: `src/api/wallets.js`
- Test: `src/api/wallets.test.js`

- [ ] **Step 1: Write the failing test**

```js
// src/api/wallets.test.js
import { describe, expect, it, vi } from 'vitest'
import client from './client'
import { createWallet } from './wallets'

vi.mock('./client', () => ({
  default: { post: vi.fn(() => Promise.resolve({ data: { id: 'wal_1' } })), get: vi.fn() },
}))

describe('createWallet', () => {
  it('posts the chain to the customer wallets endpoint', async () => {
    await createWallet('cus_1', 'polygon')
    expect(client.post).toHaveBeenCalledWith('/v1/customers/cus_1/wallets', { chain: 'polygon' })
  })

  it('defaults chain to polygon', async () => {
    await createWallet('cus_2')
    expect(client.post).toHaveBeenLastCalledWith('/v1/customers/cus_2/wallets', { chain: 'polygon' })
  })
})
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npx vitest run src/api/wallets.test.js`
Expected: FAIL — `createWallet is not a function`.

- [ ] **Step 3: Implement**

Add to `src/api/wallets.js` (keep existing `listWallets`, `getWallet`):

```js
export function createWallet(customerId, chain = 'polygon') {
  return client.post(`/v1/customers/${customerId}/wallets`, { chain }).then(r => r.data)
}
```

- [ ] **Step 4: Run test, verify PASS**

Run: `npx vitest run src/api/wallets.test.js`
Expected: PASS (2 tests).

---

## Task 2: API helper — `createAccount`

**Files:**
- Modify: `src/api/accounts.js`
- Test: `src/api/accounts.test.js`

- [ ] **Step 1: Write the failing test**

```js
// src/api/accounts.test.js
import { describe, expect, it, vi } from 'vitest'
import client from './client'
import { createAccount } from './accounts'

vi.mock('./client', () => ({
  default: { post: vi.fn(() => Promise.resolve({ data: { id: 'acc_1' } })), get: vi.fn() },
}))

describe('createAccount', () => {
  it('posts required fields for a SEPA virtual account', async () => {
    await createAccount('cus_1', { type: 'sepa', country: 'EE', currency: 'EUR', targetWallet: 'wal_1' })
    expect(client.post).toHaveBeenCalledWith('/v1/customers/cus_1/accounts', {
      type: 'sepa', country: 'EE', currency: 'EUR', targetWallet: 'wal_1',
    })
  })

  it('includes label only when provided', async () => {
    await createAccount('cus_1', { type: 'sepa', country: 'EE', currency: 'EUR', targetWallet: 'wal_1', label: 'Main' })
    expect(client.post).toHaveBeenLastCalledWith('/v1/customers/cus_1/accounts', {
      type: 'sepa', country: 'EE', currency: 'EUR', targetWallet: 'wal_1', label: 'Main',
    })
  })
})
```

- [ ] **Step 2: Run, verify FAIL** — Run: `npx vitest run src/api/accounts.test.js` → `createAccount is not a function`.

- [ ] **Step 3: Implement**

Add to `src/api/accounts.js` (keep existing `listAccounts`):

```js
export function createAccount(customerId, { type = 'sepa', country, currency, targetWallet, label }) {
  const body = { type, country, currency, targetWallet }
  if (label) body.label = label
  return client.post(`/v1/customers/${customerId}/accounts`, body).then(r => r.data)
}
```

- [ ] **Step 4: Run, verify PASS** — Run: `npx vitest run src/api/accounts.test.js` → PASS (2).

---

## Task 3: API helpers — recipients

**Files:**
- Create: `src/api/recipients.js`
- Test: `src/api/recipients.test.js`

- [ ] **Step 1: Write the failing test**

```js
// src/api/recipients.test.js
import { describe, expect, it, vi } from 'vitest'
import client from './client'
import { createRecipient, createRecipientAccount, listRecipients, listRecipientAccounts } from './recipients'

vi.mock('./client', () => ({
  default: {
    post: vi.fn(() => Promise.resolve({ data: { id: 'rec_1' } })),
    get: vi.fn(() => Promise.resolve({ data: { recipients: [] } })),
  },
}))

describe('recipients api', () => {
  it('lists recipients', async () => {
    await listRecipients('cus_1')
    expect(client.get).toHaveBeenCalledWith('/v1/customers/cus_1/recipients')
  })

  it('creates an individual recipient and strips empty optional fields', async () => {
    await createRecipient('cus_1', { type: 'individual', firstName: 'Ada', lastName: 'L', email: '', phone: undefined })
    expect(client.post).toHaveBeenCalledWith('/v1/customers/cus_1/recipients', {
      type: 'individual', firstName: 'Ada', lastName: 'L',
    })
  })

  it('lists recipient accounts', async () => {
    await listRecipientAccounts('cus_1', 'rec_1')
    expect(client.get).toHaveBeenCalledWith('/v1/customers/cus_1/recipients/rec_1/accounts')
  })

  it('creates a SEPA recipient account', async () => {
    const details = { iban: 'EE382200221020145685', accountHolderName: 'Ada L', country: 'EE', currency: 'EUR' }
    await createRecipientAccount('cus_1', 'rec_1', { rail: 'sepa', details })
    expect(client.post).toHaveBeenLastCalledWith('/v1/customers/cus_1/recipients/rec_1/accounts', { rail: 'sepa', details })
  })
})
```

- [ ] **Step 2: Run, verify FAIL** — Run: `npx vitest run src/api/recipients.test.js`.

- [ ] **Step 3: Implement**

```js
// src/api/recipients.js
import client from './client'

function compact(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== '')
  )
}

export function listRecipients(customerId) {
  return client.get(`/v1/customers/${customerId}/recipients`).then(r => r.data)
}

export function createRecipient(customerId, { type = 'individual', relationship, firstName, lastName, companyName, email, phone }) {
  const body = compact({ type, relationship, firstName, lastName, companyName, email, phone })
  return client.post(`/v1/customers/${customerId}/recipients`, body).then(r => r.data)
}

export function listRecipientAccounts(customerId, recipientId) {
  return client.get(`/v1/customers/${customerId}/recipients/${recipientId}/accounts`).then(r => r.data)
}

export function createRecipientAccount(customerId, recipientId, { rail = 'sepa', details }) {
  return client.post(`/v1/customers/${customerId}/recipients/${recipientId}/accounts`, { rail, details }).then(r => r.data)
}
```

- [ ] **Step 4: Run, verify PASS** — Run: `npx vitest run src/api/recipients.test.js` → PASS (4).

---

## Task 4: Single axios client — drop `sandboxClient`

**Files:**
- Modify: `src/api/transfers.js`

- [ ] **Step 1: Edit**

In `src/api/transfers.js`: remove the `import axios from 'axios'` line and the entire
`const sandboxClient = axios.create({ ... })` block. Change `sandboxTopup` to use
`client`:

```js
import client from './client'

export function getTransfer(id) {
  return client.get(`/v1/transfers/${id}`).then(r => r.data)
}

export function listTransfers(customerId) {
  return client.get('/v1/transfers', { params: { customerId } }).then(r => r.data)
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

export function sandboxTopup({ walletId, amount = '1000', currency = 'USDC' }) {
  return client.post('/v1/sandbox/topup', { wallet: walletId, amount, currency }).then(r => r.data)
}
```

- [ ] **Step 2: Verify build** — Run: `npx vitest run` → existing tests still PASS; no import errors.

---

## Task 5: utils — remove `resolveEmail`, add `canSend` + `kycBanner`

**Files:**
- Modify: `src/utils.js`
- Test: `src/utils.test.js`

- [ ] **Step 1: Write the failing test** — append to `src/utils.test.js`:

```js
import { canSend, kycBanner } from './utils'

describe('canSend (soft KYC gate)', () => {
  it('blocks only when rejected', () => {
    expect(canSend('rejected')).toBe(false)
    expect(canSend('not_started')).toBe(true)
    expect(canSend('pending')).toBe(true)
    expect(canSend('approved')).toBe(true)
    expect(canSend(undefined)).toBe(true)
  })
})

describe('kycBanner', () => {
  it('returns a message for non-approved statuses and null for approved', () => {
    expect(kycBanner('approved')).toBeNull()
    expect(kycBanner('not_started')).toMatch(/verify/i)
    expect(kycBanner('pending')).toMatch(/review/i)
    expect(kycBanner('rejected')).toMatch(/failed/i)
  })
})
```

(If `src/utils.test.js` lacks `describe`/`expect`/`it` imports, add `import { describe, expect, it } from 'vitest'` at top.)

- [ ] **Step 2: Run, verify FAIL** — Run: `npx vitest run src/utils.test.js`.

- [ ] **Step 3: Implement** — in `src/utils.js`: delete the `resolveEmail` function. Add:

```js
export function canSend(verificationStatus) {
  return verificationStatus !== 'rejected'
}

export function kycBanner(verificationStatus) {
  switch (verificationStatus) {
    case 'approved': return null
    case 'pending': return 'Verification under review — some limits may apply.'
    case 'rejected': return 'Verification failed. Sending is disabled — contact support.'
    default: return 'Verify your identity to lift limits.'
  }
}
```

- [ ] **Step 4: Run, verify PASS** — Run: `npx vitest run src/utils.test.js`.

---

## Task 6: AppContext — live state, no mocks

**Files:**
- Modify: `src/context/AppContext.jsx`

- [ ] **Step 1: Replace the file body**

Remove the `import { MOCK_* } from '../mocks'` line. Replace provider internals so
there is no mock fallback:

```jsx
import { useEffect, useState } from 'react'
import { getCustomer } from '../api/customers'
import { listWallets, getWallet } from '../api/wallets'
import { listAccounts } from '../api/accounts'
import { listTransfers } from '../api/transfers'
import { AppContext } from './appContext'

function resolveCustomerId() {
  return localStorage.getItem('swipelux_customer_id') ?? import.meta.env.VITE_CUSTOMER_ID
}

export function AppProvider({ children }) {
  const hasCustomerId = Boolean(resolveCustomerId())
  const [customer, setCustomer] = useState(null)
  const [wallet, setWallet] = useState(null)
  const [accounts, setAccounts] = useState([])
  const [transferLog, setTransferLog] = useState([])
  const [loading, setLoading] = useState(hasCustomerId)
  const [error, setError] = useState(null)
  const [loggedOut, setLoggedOut] = useState(false)

  useEffect(() => {
    const customerId = resolveCustomerId()
    if (!customerId) return

    setLoading(true)
    setError(null)

    const fetchWallet = () =>
      listWallets(customerId).then(({ wallets }) => {
        if (!wallets?.length) return null
        return getWallet(customerId, wallets[0].id).catch(() => null)
      })

    const fetchAccounts = () =>
      listAccounts(customerId).then(({ accounts }) => accounts ?? [])

    const fetchTransfers = () =>
      listTransfers(customerId).then(data => (Array.isArray(data) ? data : data?.transfers ?? []))

    Promise.all([
      getCustomer(customerId),
      fetchWallet(),
      fetchAccounts(),
      fetchTransfers(),
    ])
      .then(([cust, wal, accs, txns]) => {
        setCustomer(cust)
        setWallet(wal)
        setAccounts(accs)
        setTransferLog(txns)
      })
      .catch(() => setError('Failed to load your account.'))
      .finally(() => setLoading(false))
  }, [])

  function addTransfer(transfer) {
    setTransferLog(prev => [transfer, ...prev])
  }

  function refreshWallet() {
    const customerId = resolveCustomerId()
    if (!customerId) return
    listWallets(customerId)
      .then(({ wallets }) => {
        if (!wallets?.length) return null
        return getWallet(customerId, wallets[0].id)
      })
      .then(wal => { if (wal) setWallet(wal) })
      .catch(() => {})
  }

  return (
    <AppContext.Provider
      value={{ customer, wallet, accounts, transferLog, addTransfer, refreshWallet, loading, error, loggedOut, setLoggedOut }}
    >
      {children}
    </AppContext.Provider>
  )
}
```

- [ ] **Step 2: Verify** — Run: `npx vitest run` (no AppContext test, but confirm no import errors via `npm run build` in Task 12).

---

## Task 7: Delete mocks

**Files:**
- Delete: `src/mocks.js`

- [ ] **Step 1:** `git rm src/mocks.js` (or delete the file).
- [ ] **Step 2:** Grep for stragglers — Run: `grep -rn "mocks\|MOCK_" src/`. Expected: no matches after Tasks 6 and 8 land. If any remain outside Dashboard/AddMoney/Profile (handled next), remove them.

---

## Task 8: Screen empty/error states (no mocks)

**Files:**
- Modify: `src/pages/Dashboard.jsx`, `src/pages/AddMoney.jsx`, `src/pages/Profile.jsx`

- [ ] **Step 1: Dashboard** — at the top of the rendered output, handle states using the
existing `useApp()` values `{ wallet, accounts, transferLog, loading, error }`:
  - `loading` → keep the existing `Skeleton` placeholders.
  - `error` → render a card: text `error` + a "Retry" button calling `window.location.reload()`.
  - not loading, no `wallet` → render a centered empty state: heading "Set up your account",
    subtext "Create your wallet and bank account to get started.", and a primary Button
    "Set up account" → `navigate('/onboarding')`.
  - otherwise render the normal dashboard. `BalanceCard` already tolerates empty
    balances (`0.00`). `AccountCard` already returns null when account absent — pass
    `getVirtualAccount(accounts)`.

- [ ] **Step 2: AddMoney** — `SepaTab`/`SwiftTab` already render "No … account available."
  when `account` is null — keep. For `StablecoinTab`, when `wallet?.address` is absent,
  render `<p className="text-sm text-gray-500 p-4">No wallet yet.</p>` instead of the
  CopyField. No mock references remain.

- [ ] **Step 3: Profile** — ensure all fields read from live `customer`:
  - Avatar/name: `customer?.personal?.firstName`, `customer?.personal?.lastName`
    (fall back to empty string).
  - Email/phone: `customer?.personal?.email`, `customer?.personal?.phone`.
  - KYC: `getKycLabel(customer?.verificationStatus)` (see Task 10 for util note).
  - When `customer` is null and not loading, render existing graceful empties.

- [ ] **Step 4: Verify** — Run: `grep -rn "MOCK_" src/` → no matches.

---

## Task 9: Onboarding provisioning chain

**Files:**
- Modify: `src/pages/Onboarding.jsx`

Current flow: Step 1 form → on `createCustomer` success sets `customer`, shows success
card with "Use this customer". Replace the success transition with a provisioning step.

- [ ] **Step 1: Add imports** — at top of `Onboarding.jsx`:

```js
import { createWallet } from '../api/wallets'
import { createAccount } from '../api/accounts'
```

- [ ] **Step 2: Add provisioning constants** (module scope):

```js
const PROVISION_CHAIN = 'polygon'
const PROVISION_COUNTRY = 'EE'
const PROVISION_CURRENCY = 'EUR'
```

- [ ] **Step 3: Add provisioning state + logic** inside the component:

```js
const [provStep, setProvStep] = useState(null) // null | 'wallet' | 'account' | 'done' | 'error'
const [provError, setProvError] = useState('')
const [createdWallet, setCreatedWallet] = useState(null)

async function provision(customerId) {
  setProvError('')
  try {
    let wallet = createdWallet
    if (!wallet) {
      setProvStep('wallet')
      wallet = await createWallet(customerId, PROVISION_CHAIN)
      setCreatedWallet(wallet)
    }
    setProvStep('account')
    await createAccount(customerId, {
      type: 'sepa',
      country: PROVISION_COUNTRY,
      currency: PROVISION_CURRENCY,
      targetWallet: wallet.id,
    })
    setProvStep('done')
    localStorage.setItem('swipelux_customer_id', customerId)
    navigate('/')
  } catch (err) {
    setProvStep('error')
    setProvError(err?.response?.data?.message ?? err?.message ?? 'Provisioning failed')
  }
}
```

- [ ] **Step 4: Trigger provisioning after customer creation** — in the existing submit
handler, after `const created = await createCustomer(...)` (capture the returned
customer; it has `.id`), call `provision(created.id)` instead of going straight to the
old success card. Keep `setCustomer(created)` if other UI needs it.

- [ ] **Step 5: Render provisioning UI** — when `provStep` is non-null, render this in
place of the form (matches the dark theme used elsewhere):

```jsx
{provStep && (
  <div className="space-y-4">
    <h2 className="text-lg font-semibold text-white">Setting up your account</h2>
    <ul className="space-y-2 text-sm">
      <li className={provStep === 'wallet' ? 'text-[#F97316]' : 'text-gray-400'}>
        {createdWallet ? '✓' : '•'} Creating wallet
      </li>
      <li className={provStep === 'account' ? 'text-[#F97316]' : 'text-gray-400'}>
        {provStep === 'done' ? '✓' : '•'} Opening bank account
      </li>
    </ul>
    {provStep === 'error' && (
      <div className="space-y-3">
        <p className="text-sm text-red-400">{provError}</p>
        <Button fullWidth onClick={() => provision(customer.id)}>Retry</Button>
      </div>
    )}
  </div>
)}
```

Note: Retry resumes from the failed step — `createdWallet` is preserved, so the wallet
is not recreated. The customer is never recreated (already exists with `customer.id`).

- [ ] **Step 6: Verify** — `npm run lint` clean for this file; manual flow tested in Task 12.

---

## Task 10: Field-name bug — `verificationStatus` everywhere

**Files:**
- Modify: `src/pages/Profile.jsx`, `src/components/DevPanel.jsx`, `src/pages/Send.jsx` (Send handled in Task 11)

- [ ] **Step 1: Profile** — already covered in Task 8 Step 3: use
  `getKycLabel(customer?.verificationStatus)`. `getKycLabel` already maps the
  not_started/pending/approved/rejected keys — no change to `utils.js` needed for it.

- [ ] **Step 2: DevPanel `stateSnapshot`** — replace the customer snapshot line:

```js
customer: customer
  ? { id: customer.id, name: `${customer.personal?.firstName ?? ''} ${customer.personal?.lastName ?? ''}`.trim(), status: customer.verificationStatus }
  : null,
```

- [ ] **Step 3: Verify** — Run: `grep -rn "customer?.status\|customer.status\|\.firstName" src/` → no remaining top-level `customer.status` or top-level `customer.firstName` reads (must be `customer.personal?.firstName`).

---

## Task 11: Send — recipients bank flow, wallet-ID P2P, soft gate

**Files:**
- Modify: `src/pages/Send.jsx`

- [ ] **Step 1: Update imports** — remove `resolveEmail`; add recipients API + helpers:

```js
import { createPayoutQuote, createPayout } from '../api/transfers'
import { listRecipients, createRecipient, listRecipientAccounts, createRecipientAccount } from '../api/recipients'
import { formatAmount, canSend, kycBanner } from '../utils'
```

- [ ] **Step 2: Soft KYC gate in `Send`** — replace
  `const kycOk = customer?.status === 'approved'` with:

```js
const status = customer?.verificationStatus
const kycOk = canSend(status)
const banner = kycBanner(status)
```

  Pass `kycOk` to both flows as today. Below the segmented control, render the banner
  when present:

```jsx
{banner && (
  <p className={`text-xs text-center ${status === 'rejected' ? 'text-red-400' : 'text-amber-400'}`}>{banner}</p>
)}
```

  In both flows, replace the old `{!kycOk && (<p>Verification required…</p>)}` lines —
  the shared banner now covers messaging. Keep the submit `disabled={!kycOk || …}`.

- [ ] **Step 3: BankPayoutFlow — use recipients** — remove
  `const recipientAccountId = import.meta.env.VITE_RECIPIENT_ACCOUNT_ID`. Replace the
  hardcoded "Demo Recipient" card with recipient selection state:

```js
const { customer } = useApp() // if not already available; otherwise pass customerId via props
const customerId = customer?.id
const [recipients, setRecipients] = useState([])
const [recipientAccounts, setRecipientAccounts] = useState([])
const [selectedRecipientId, setSelectedRecipientId] = useState('')
const [selectedAccountId, setSelectedAccountId] = useState('')
const [showAddForm, setShowAddForm] = useState(false)

useEffect(() => {
  if (!customerId) return
  listRecipients(customerId)
    .then(data => {
      const list = data?.recipients ?? (Array.isArray(data) ? data : [])
      setRecipients(list)
      setShowAddForm(list.length === 0)
    })
    .catch(() => {})
}, [customerId])

useEffect(() => {
  if (!customerId || !selectedRecipientId) { setRecipientAccounts([]); return }
  listRecipientAccounts(customerId, selectedRecipientId)
    .then(data => setRecipientAccounts(data?.accounts ?? (Array.isArray(data) ? data : [])))
    .catch(() => {})
}, [customerId, selectedRecipientId])
```

  Pass `customer` into `BankPayoutFlow` from the `Send` component (add it to the props
  it already receives: `wallet, addTransfer, refreshWallet, kycOk` → also `customer`).

- [ ] **Step 4: BankPayoutFlow — selection + add-recipient UI** — render, before the
  amount input:
  - A `<select>` of recipients (value `selectedRecipientId`); option label
    `${r.firstName ?? r.companyName} ${r.lastName ?? ''}`.
  - When a recipient is selected, a `<select>` of its accounts (value
    `selectedAccountId`); option label uses `a.details?.iban ?? a.id`.
  - A text button "+ Add recipient" toggling `showAddForm`.
  - When `showAddForm`, inline fields: firstName, lastName, email, iban,
    accountHolderName, country (default `EE`), currency (default `EUR`), and a
    "Save recipient" button calling:

```js
async function handleAddRecipient() {
  if (!customerId) return
  setLoading(true)
  try {
    const rec = await createRecipient(customerId, { type: 'individual', firstName, lastName, email })
    await createRecipientAccount(customerId, rec.id, {
      rail: 'sepa',
      details: { iban, accountHolderName, country, currency },
    })
    const data = await listRecipients(customerId)
    const list = data?.recipients ?? (Array.isArray(data) ? data : [])
    setRecipients(list)
    setSelectedRecipientId(rec.id)
    setShowAddForm(false)
  } catch {
    // interceptor toast already fired
  } finally {
    setLoading(false)
  }
}
```

  (Declare the form field `useState`s: firstName, lastName, email, iban,
  accountHolderName, country='EE', currency='EUR'.)

- [ ] **Step 5: BankPayoutFlow — quote/confirm use selected account** — replace every
  `recipientAccountId` usage with `selectedAccountId`, and derive destination currency
  from the chosen recipient account:

```js
const selectedAccount = recipientAccounts.find(a => a.id === selectedAccountId)
const toCurrency = selectedAccount?.details?.currency ?? selectedAccount?.currency ?? 'EUR'
// handleReview:
const q = await createPayoutQuote({ fromWalletId: wallet.id, amount: Number(amount), currency: 'USDC', toAccountId: selectedAccountId, toCurrency })
// handleConfirm:
const tx = await createPayout({ fromWalletId: wallet.id, amount: Number(amount), currency: 'USDC', toId: selectedAccountId, toCurrency })
// transfer.to: { identifier: selectedAccountId }
```

  Gate the Review button additionally on `selectedAccountId`:
  `disabled={!kycOk || !amount || !selectedAccountId}`.

- [ ] **Step 6: P2PFlow — wallet ID input** — remove `demoEmail`, `recipientWalletId`,
  `resolveEmail`, `handleEmailChange`, `handleEmailBlur`, and the fake "Arthur K." card.
  Replace with a destination wallet ID field:

```js
const [destWalletId, setDestWalletId] = useState('')
const walletIdValid = /^wal_[a-zA-Z0-9]+$/.test(destWalletId)
```

  Input UI:

```jsx
<div>
  <label className="block text-xs text-gray-500 mb-1.5" htmlFor="p2p-wallet">Recipient wallet ID</label>
  <input
    id="p2p-wallet"
    type="text"
    placeholder="wal_…"
    value={destWalletId}
    onChange={e => setDestWalletId(e.target.value.trim())}
    className="w-full bg-[#1F2937] border border-[#374151] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#F97316] transition-colors duration-150 font-mono"
  />
  {destWalletId && !walletIdValid && <p className="text-xs text-red-400 mt-1">Enter a valid wallet ID (wal_…)</p>}
</div>
```

  In `handleConfirm`, use `toId: destWalletId`, `toCurrency: 'USDC'`, and
  `to: { identifier: destWalletId }`. Review button:
  `disabled={!kycOk || !walletIdValid || !amount}`. In Step 2 review card, show
  `{destWalletId}` for the "Wallet" line; drop the email line (or label it "To wallet").

- [ ] **Step 7: Verify** — Run: `grep -n "VITE_RECIPIENT\|VITE_DEMO_EMAIL\|resolveEmail\|customer?.status" src/pages/Send.jsx` → no matches. `npx vitest run` → all green.

---

## Task 12: DevPanel topup + env trim, full verification

**Files:**
- Modify: `src/components/DevPanel.jsx`, `.env.example` (template only — never `.env`)

- [ ] **Step 1: DevPanel topup target** — remove
  `const SANDBOX_WALLET = import.meta.env.VITE_SANDBOX_WALLET_ID`. In `handleTopup`,
  `const walletId = wallet?.id`. In the "Target wallet" display, show `wallet?.id || '—'`.

- [ ] **Step 2: `.env.example`** — replace entire contents with:

```
VITE_API_URL=https://platform.sbx.swipelux.com
VITE_API_TOKEN=your-api-key-here
VITE_CUSTOMER_ID=
```

- [ ] **Step 3: Grep for dead env vars** — Run:
  `grep -rn "VITE_SANDBOX_TOKEN\|VITE_RECIPIENT_ACCOUNT_ID\|VITE_RECIPIENT_WALLET_ID\|VITE_DEMO_EMAIL\|VITE_SANDBOX_WALLET_ID" src/`
  Expected: no matches.

- [ ] **Step 4: Full verification**
  - Run: `npm run lint` → "No issues" / clean.
  - Run: `npx vitest run` → all PASS (existing + new wallets/accounts/recipients/utils tests).
  - Run: `npm run build` → success.

---

## Self-Review (completed during planning)

- **Spec coverage:** §1 API layer → Tasks 1–4; §2 onboarding provisioning → Task 9;
  §3 AppContext live state → Task 6; §4 kill mocks → Tasks 7–8; §5 Send → Task 11;
  §6 recipients → Tasks 3, 11; §7 cleanup (field bug, single client, env trim, devpanel
  topup) → Tasks 4, 5, 10, 12. All covered.
- **Placeholder scan:** none — every code step has concrete code.
- **Type consistency:** helper names (`createWallet`, `createAccount`, `createRecipient`,
  `createRecipientAccount`, `listRecipients`, `listRecipientAccounts`, `canSend`,
  `kycBanner`) used identically across tasks. Payout helpers keep existing
  `toAccountId`/`toId` param names.

## Execution

Implemented by codex gpt-5.5 with constraints: do not commit, do not modify `.env`,
do not add dependencies. After codex returns: reviewer runs lint + tests + build,
checks component/prop contracts, then commits.
