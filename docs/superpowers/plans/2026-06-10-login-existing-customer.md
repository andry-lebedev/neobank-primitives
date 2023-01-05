# Login With Existing Customer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Let someone open the demo as an existing customer by entering a customer id, instead of being forced through create-customer onboarding.

**Architecture:** Add a `setCustomerId` integration slot (Seam 3) that persists the id where `resolveCustomerId` reads it. Add a `/login` page that validates the id via `getCustomer`, stores it, and reloads so `AppContext` re-initialises. Add a route gate that sends users with no stored customer to `/login` (except on `/login` and `/onboarding`). Onboarding stays the "create new" path.

**Tech Stack:** React 19, Vite, Tailwind 3, React Router 7, axios, Vitest. No new deps.

## Background

`resolveCustomerId()` (in `src/integrations/index.js`) reads `localStorage.swipelux_customer_id ?? VITE_CUSTOMER_ID`. Onboarding writes that key on successful provision. There is no UI to load a pre-existing customer, and no gate — with no id the app silently lands on Dashboard's empty state. This adds the missing entry point.

## Constraints

- Do NOT modify `.env`. Do NOT add dependencies. Keep `npx vitest run` green and `npx vite build` passing. Commit per task. Stay on branch `feat/self-building-demo-kit` — no branch/switch/push.

## File Structure

- Modify: `src/integrations/index.js` (+ `src/integrations/index.test.js`) — add `setCustomerId`.
- Create: `src/pages/Login.jsx`.
- Modify: `src/features.js` (+ `src/features.test.js`) — register `/login`.
- Modify: `src/App.jsx` — add `CustomerGate` redirect.
- Modify: `AGENTS.md` — document the new slot.

---

## Task 1: `setCustomerId` integration slot

**Files:**
- Modify: `src/integrations/index.js`, `src/integrations/index.test.js`

- [ ] **Step 1: Add failing test**

Append to `src/integrations/index.test.js` (inside the existing `describe('integration slots', ...)`):
```js
  it('setCustomerId persists where resolveCustomerId reads it', async () => {
    const { setCustomerId, resolveCustomerId } = await import('./index')
    setCustomerId('cus_abc')
    expect(localStorage.getItem('swipelux_customer_id')).toBe('cus_abc')
    expect(resolveCustomerId()).toBe('cus_abc')
  })
```

- [ ] **Step 2: Run — verify fail**

Run: `npx vitest run src/integrations/index.test.js`
Expected: FAIL — `setCustomerId` not exported.

- [ ] **Step 3: Implement**

In `src/integrations/index.js`, add right after `resolveCustomerId`:
```js
// Persist the session customer id where resolveCustomerId reads it.
// Client: write to their own session store instead if they own identity.
export function setCustomerId(id) {
  localStorage.setItem('swipelux_customer_id', id)
}
```

- [ ] **Step 4: Run — verify pass**

Run: `npx vitest run src/integrations/index.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/integrations/index.js src/integrations/index.test.js
git commit -m "feat: add setCustomerId integration slot"
```

---

## Task 2: Login page

**Files:**
- Create: `src/pages/Login.jsx`

- [ ] **Step 1: Create the page**

Create `src/pages/Login.jsx`:
```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogIn, UserPlus } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import { getCustomer } from '../api/customers'
import { setCustomerId } from '../integrations'

export default function Login() {
  const navigate = useNavigate()
  const [id, setId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    const trimmed = id.trim()
    if (!trimmed) return
    setLoading(true)
    setError('')
    try {
      await getCustomer(trimmed) // validate it exists before storing
      setCustomerId(trimmed)
      window.location.assign('/') // reload so AppContext re-initialises
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Customer not found')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-base flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-3">
            <LogIn size={24} className="text-accent" />
          </div>
          <h1 className="text-xl font-bold text-white">Open your account</h1>
          <p className="text-sm text-gray-400 mt-1">Enter your customer ID to continue.</p>
        </div>

        <Card className="p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5" htmlFor="login-customer-id">Customer ID</label>
              <input
                id="login-customer-id"
                value={id}
                onChange={e => setId(e.target.value)}
                placeholder="cus_..."
                className="w-full bg-card border border-card-hover rounded-xl px-4 py-3 text-white font-mono placeholder-gray-600 focus:outline-none focus:border-accent transition-colors duration-150"
              />
              {error && <p className="text-xs text-danger mt-1.5">{error}</p>}
            </div>
            <Button fullWidth type="submit" loading={loading} disabled={!id.trim()}>
              Continue
            </Button>
          </form>
        </Card>

        <Button variant="ghost" fullWidth onClick={() => navigate('/onboarding')}>
          <UserPlus size={15} />
          Create a new customer
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npx vite build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Login.jsx
git commit -m "feat: add login-with-customer-id page"
```

---

## Task 3: Register `/login` route

**Files:**
- Modify: `src/features.js`, `src/features.test.js`

- [ ] **Step 1: Add failing test**

In `src/features.test.js`, extend the "core routes" assertion (the `arrayContaining` list) to include `/login`:
```js
    expect(routes).toEqual(expect.arrayContaining(['/', '/send', '/add-money', '/profile', '/history', '/onboarding', '/login']))
```

- [ ] **Step 2: Run — verify fail**

Run: `npx vitest run src/features.test.js`
Expected: FAIL — `/login` not in routes.

- [ ] **Step 3: Register the feature**

In `src/features.js`, add the import:
```js
import Login from './pages/Login'
```
and add this entry to the `features` array (alongside the other `inNav: false` entries):
```js
  { id: 'login',     route: '/login',     element: Login,      enabled: true,  inNav: false, navOrder: 99 },
```

- [ ] **Step 4: Run — verify pass**

Run: `npx vitest run src/features.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features.js src/features.test.js
git commit -m "feat: register /login route in feature registry"
```

---

## Task 4: Redirect gate for missing customer

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Update imports**

Change the router import line and add the integrations import:
```jsx
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
```
Add (with the other imports):
```jsx
import { resolveCustomerId } from './integrations'
```

- [ ] **Step 2: Add the gate component**

Add above `export default function App()`:
```jsx
function CustomerGate({ children }) {
  const { pathname } = useLocation()
  const hasCustomer = Boolean(resolveCustomerId())
  const isEntry = pathname === '/login' || pathname === '/onboarding'
  if (!hasCustomer && !isEntry) return <Navigate to="/login" replace />
  return children
}
```

- [ ] **Step 3: Wrap the routes with the gate**

In the returned JSX, wrap the `<Routes>…</Routes>` element with `<CustomerGate>`:
```jsx
          <CustomerGate>
            <Routes>
              {routeItems.map(({ id, route, element: Element }) => (
                <Route key={id} path={route} element={<Element />} />
              ))}
            </Routes>
          </CustomerGate>
```

- [ ] **Step 4: Verify build + tests**

Run: `npx vitest run && npx vite build`
Expected: PASS, build OK.

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx
git commit -m "feat: redirect to /login when no customer is set"
```

---

## Task 5: Document the new slot

**Files:**
- Modify: `AGENTS.md`

- [ ] **Step 1: Update the Seam 3 slot list**

In `AGENTS.md`, in the Seam 3 section, update the named-set sentence to include `setCustomerId`:
```markdown
A fixed, named set: `track(event, props)`, `onSession(customer)`, `notify(message, kind)`,
`resolveCustomerId()`, `setCustomerId(id)`. Reference ships safe stubs. Fill the bodies to wire
client infra. Do NOT rename or remove these exports — call sites depend on them.
```

- [ ] **Step 2: Commit**

```bash
git add AGENTS.md
git commit -m "docs: document setCustomerId slot in AGENTS.md"
```

---

## Final Verification

- [ ] **Step 1: Full suite + build**

Run: `npx vitest run && npx vite build`
Expected: all tests PASS, build succeeds.

- [ ] **Step 2: Operator smoke**

Run: `npm run dev`. With no stored customer (`localStorage.removeItem('swipelux_customer_id')`, empty `VITE_CUSTOMER_ID`): app redirects to `/login`. Enter a valid customer id → lands on Dashboard for that customer. Enter a bad id → inline "Customer not found". "Create a new customer" → onboarding.

---

## Self-Review Notes

- **Coverage:** slot (T1), page (T2), route (T3), gate (T4), docs (T5).
- **Consistency:** `setCustomerId(id)` writes the exact key `swipelux_customer_id` that `resolveCustomerId` reads; gate allow-list (`/login`, `/onboarding`) matches the two entry pages; `/login` is `inNav:false` so it never appears in the bottom nav.
- **Reload choice:** Login uses `window.location.assign('/')` (full reload) rather than client nav so `AppContext`'s one-shot load effect re-runs with the new id — simplest correct behaviour, no context refactor.
- **Scope:** no `.env`, no deps, onboarding untouched (still the create path).
```
