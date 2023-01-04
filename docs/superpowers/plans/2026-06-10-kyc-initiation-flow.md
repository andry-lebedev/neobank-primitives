# KYC Initiation Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Let a customer start identity verification from inside the demo, so the create-customer → verify → create-account flow works end-to-end against the real Swipelux API.

**Architecture:** Add an `initiateKyc` API call (`POST /v1/customers/{id}/kyc`, level `simplified`), surface a "Verify identity" CTA on Profile + Dashboard when the customer is unverified, open the returned Sumsub `verificationUrl`, and refresh `verificationStatus` (on window focus + manual button) so the UI reflects approval. Uses existing integration slots (`track`, `notify`).

**Tech Stack:** React 19, Vite, Tailwind 3, axios, Vitest. No new deps.

## Background

Real API hard-gates bank-account creation on `verificationStatus === 'approved'` (current demo customer is `not_started`). KYC is a real Sumsub session: `POST /v1/customers/{id}/kyc {level}` → `{ verificationUrl }`. No sandbox shortcut. Demo currently only *displays* status — no way to start KYC. Default level = `simplified` (identity-only) for an easy demo.

## Constraints

- Do NOT modify `.env`. Do NOT add dependencies. Keep `npx vitest run` green and `npx vite build` passing. Commit per task. Stay on branch `feat/self-building-demo-kit` — do not branch/switch/push.

## File Structure

- Modify: `src/api/customers.js` — add `initiateKyc`.
- Create: `src/api/customers.test.js` already exists → add a test case there (modify).
- Modify: `src/utils.js` — add `needsKyc`; `src/utils.test.js` — add test.
- Modify: `src/context/AppContext.jsx` — add `refreshCustomer` + window-focus refresh.
- Modify: `src/pages/Profile.jsx` — Verify CTA + refresh.
- Modify: `src/pages/Dashboard.jsx` — Verify CTA in the unverified banner.

---

## Task 1: `initiateKyc` API call

**Files:**
- Modify: `src/api/customers.js`
- Modify: `src/api/customers.test.js`

- [ ] **Step 1: Add a failing test**

Append to `src/api/customers.test.js` (inside the existing top-level `describe`, or as a new `describe`). Use the same mocking style already used in that file for `client`. Test:
```js
import { initiateKyc } from './customers'
// ... within the existing vi.mock('./client') setup ...
it('initiateKyc posts level to the kyc endpoint and returns data', async () => {
  client.post.mockResolvedValueOnce({ data: { verificationUrl: 'https://sumsub.test/abc' } })
  const res = await initiateKyc('cus_1', 'simplified')
  expect(client.post).toHaveBeenCalledWith('/v1/customers/cus_1/kyc', { level: 'simplified' })
  expect(res.verificationUrl).toBe('https://sumsub.test/abc')
})

it('initiateKyc defaults to simplified level', async () => {
  client.post.mockResolvedValueOnce({ data: { verificationUrl: 'x' } })
  await initiateKyc('cus_2')
  expect(client.post).toHaveBeenCalledWith('/v1/customers/cus_2/kyc', { level: 'simplified' })
})
```
NOTE: match the existing import/mock conventions in `customers.test.js`. If the file imports `client` differently, adapt these two `it` blocks to that style; do not change existing tests.

- [ ] **Step 2: Run — verify fail**

Run: `npx vitest run src/api/customers.test.js`
Expected: FAIL — `initiateKyc` is not exported.

- [ ] **Step 3: Implement**

Add to `src/api/customers.js` (after `getBalances`):
```js
export function initiateKyc(customerId, level = 'simplified') {
  return client.post(`/v1/customers/${customerId}/kyc`, { level }).then(r => r.data)
}
```

- [ ] **Step 4: Run — verify pass**

Run: `npx vitest run src/api/customers.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/api/customers.js src/api/customers.test.js
git commit -m "feat: add initiateKyc api call (POST /kyc, simplified default)"
```

---

## Task 2: `needsKyc` helper

**Files:**
- Modify: `src/utils.js`, `src/utils.test.js`

- [ ] **Step 1: Add failing test**

Append to `src/utils.test.js`:
```js
import { needsKyc } from './utils'

describe('needsKyc', () => {
  it('is true when verification can be started', () => {
    expect(needsKyc(undefined)).toBe(true)
    expect(needsKyc('not_started')).toBe(true)
    expect(needsKyc('rejected')).toBe(true)
  })
  it('is false while pending or approved', () => {
    expect(needsKyc('pending')).toBe(false)
    expect(needsKyc('approved')).toBe(false)
  })
})
```

- [ ] **Step 2: Run — verify fail**

Run: `npx vitest run src/utils.test.js`
Expected: FAIL — `needsKyc` not exported.

- [ ] **Step 3: Implement**

Add to `src/utils.js`:
```js
// Can the customer start/restart identity verification right now?
// pending = in review (wait), approved = done. Everything else can initiate.
export function needsKyc(verificationStatus) {
  return verificationStatus !== 'pending' && verificationStatus !== 'approved'
}
```

- [ ] **Step 4: Run — verify pass**

Run: `npx vitest run src/utils.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils.js src/utils.test.js
git commit -m "feat: add needsKyc helper"
```

---

## Task 3: `refreshCustomer` in AppContext + focus refresh

**Files:**
- Modify: `src/context/AppContext.jsx`

- [ ] **Step 1: Add `refreshCustomer` function**

In `AppProvider`, after `refreshWallet` (around line 68), add:
```js
  function refreshCustomer() {
    const customerId = resolveCustomerId()
    if (!customerId) return
    getCustomer(customerId)
      .then(c => { if (c) setCustomer(c) })
      .catch(() => {})
  }
```
(`resolveCustomerId` is already imported from `../integrations`; `getCustomer` is already imported.)

- [ ] **Step 2: Refresh customer when the tab regains focus**

Add a new `useEffect` after the existing data-load effect (after line 52):
```js
  useEffect(() => {
    function onFocus() {
      const customerId = resolveCustomerId()
      if (!customerId) return
      getCustomer(customerId).then(c => { if (c) setCustomer(c) }).catch(() => {})
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])
```

- [ ] **Step 3: Expose `refreshCustomer` in context value**

Update the provider `value` (line 72) to include `refreshCustomer`:
```jsx
      value={{ customer, wallet, accounts, transferLog, addTransfer, refreshWallet, refreshCustomer, loading, error, loggedOut, setLoggedOut }}
```

- [ ] **Step 4: Verify build + tests**

Run: `npx vitest run && npx vite build`
Expected: PASS, build OK.

- [ ] **Step 5: Commit**

```bash
git add src/context/AppContext.jsx
git commit -m "feat: add refreshCustomer + refetch on window focus"
```

---

## Task 4: Verify CTA on Profile

**Files:**
- Modify: `src/pages/Profile.jsx`

- [ ] **Step 1: Add imports + handler**

Add to imports:
```jsx
import { useState } from 'react'
import { getKycLabel, getVirtualAccount, needsKyc } from '../utils'
import { initiateKyc } from '../api/customers'
import { track, notify } from '../integrations'
```
(Replace the existing `getKycLabel, getVirtualAccount` import line with the one above. Keep the `Shield` import; the lucide import line stays.)

In the `Profile` component, pull `refreshCustomer` from `useApp()` (line 35):
```jsx
  const { customer, wallet, accounts, loggedOut, setLoggedOut, refreshCustomer } = useApp()
```
After `const virtualAccount = getVirtualAccount(accounts)` (line 41) add:
```jsx
  const [kycLoading, setKycLoading] = useState(false)
  const canVerify = needsKyc(verificationStatus)

  async function handleVerify() {
    if (!customer?.id) return
    setKycLoading(true)
    try {
      const { verificationUrl } = await initiateKyc(customer.id, 'simplified')
      track('kyc_initiated', { customerId: customer.id, level: 'simplified' })
      window.open(verificationUrl, '_blank', 'noopener')
    } catch (e) {
      notify(e?.response?.data?.message ?? 'Could not start verification', 'error')
    } finally {
      setKycLoading(false)
    }
  }
```

- [ ] **Step 2: Add the buttons to the KYC card**

In the KYC status `Card` (after the description `<p>`, before the card closes — after line 90), add:
```jsx
        {canVerify && (
          <Button
            fullWidth
            loading={kycLoading}
            onClick={handleVerify}
            className="mt-3"
          >
            <Shield size={15} />
            Verify identity
          </Button>
        )}
        {verificationStatus === 'pending' && (
          <Button
            variant="ghost"
            fullWidth
            onClick={refreshCustomer}
            className="mt-3"
          >
            Refresh status
          </Button>
        )}
```
(`Button` is already imported.)

- [ ] **Step 3: Verify build + tests**

Run: `npx vitest run && npx vite build`
Expected: PASS, build OK.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Profile.jsx
git commit -m "feat: verify-identity CTA + status refresh on Profile"
```

---

## Task 5: Verify CTA on Dashboard banner

**Files:**
- Modify: `src/pages/Dashboard.jsx`

- [ ] **Step 1: Add imports + handler**

Update imports:
```jsx
import { useState } from 'react'
import { canSend, formatBalance, getVirtualAccount, needsKyc } from '../utils'
import { initiateKyc } from '../api/customers'
import { track, notify } from '../integrations'
```
In `Dashboard`, after `const kycOk = canSend(customer?.verificationStatus)` (line 67) add:
```jsx
  const status = customer?.verificationStatus
  const canVerify = needsKyc(status)
  const [kycLoading, setKycLoading] = useState(false)

  async function handleVerify() {
    if (!customer?.id) return
    setKycLoading(true)
    try {
      const { verificationUrl } = await initiateKyc(customer.id, 'simplified')
      track('kyc_initiated', { customerId: customer.id, level: 'simplified' })
      window.open(verificationUrl, '_blank', 'noopener')
    } catch (e) {
      notify(e?.response?.data?.message ?? 'Could not start verification', 'error')
    } finally {
      setKycLoading(false)
    }
  }
```

- [ ] **Step 2: Replace the KYC banner block**

Replace the existing `{/* KYC banner */}` block (lines 116-124) with:
```jsx
      {/* KYC banner */}
      {!loading && status !== 'approved' && (
        <div className="bg-warning/10 border border-warning/30 rounded-xl px-4 py-3 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-warning flex-shrink-0" />
            <p className="text-sm text-warning">
              {canVerify
                ? 'Verify your identity to create a bank account and send money.'
                : 'Your identity is under review. This usually takes 1–2 business days.'}
            </p>
          </div>
          {canVerify && (
            <Button fullWidth loading={kycLoading} onClick={handleVerify}>
              Verify identity
            </Button>
          )}
        </div>
      )}
```
(`Button` and `AlertTriangle` are already imported.)

- [ ] **Step 3: Verify build + tests**

Run: `npx vitest run && npx vite build`
Expected: PASS, build OK.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Dashboard.jsx
git commit -m "feat: verify-identity CTA in Dashboard banner"
```

---

## Final Verification

- [ ] **Step 1: Full suite + build**

Run: `npx vitest run && npx vite build`
Expected: all tests PASS, build succeeds.

- [ ] **Step 2: Operator smoke**

Run: `npm run dev`. With an unverified customer: Dashboard + Profile show "Verify identity" → click opens Sumsub URL in a new tab → after approval, returning focus to the tab refreshes status to `approved` and the bank-account flow unblocks.

---

## Self-Review Notes

- **Coverage:** initiateKyc (T1), needsKyc (T2), refresh (T3), Profile CTA (T4), Dashboard CTA (T5). Default level `simplified` everywhere per decision.
- **Consistency:** `initiateKyc(customerId, level='simplified')`, `needsKyc(status)`, `refreshCustomer()` names identical across api/util/context/pages. Both pages use the same `handleVerify` shape and the `track`/`notify` slots from `src/integrations` (Seam 3) — dogfoods the kit's integration slots.
- **Scope:** no `.env`, no deps, no API-layer changes beyond the one additive endpoint.
