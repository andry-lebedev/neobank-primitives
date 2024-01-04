# Self-Building Demo Kit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor `dummy-neobank` into a self-building integration starter-kit: three clean extension seams (theme tokens, feature registry, named integration slots) plus three root docs (`AGENTS.md`, `PROMPT.md`, `TAILORED-SPEC.md`) that let a client's AI agent rebuild the demo for their brand + infra.

**Architecture:** Purely additive refactor — zero visible behavior change to the running demo. Centralize brand + status colors into Tailwind tokens, lift hardwired pages/nav into a single `features.js` registry, add a named `integrations/` slot module, then layer the AI-consumable docs on top. Reference demo stays runnable against the live Swipelux sandbox.

**Tech Stack:** React 19, Vite, Tailwind 3.4, React Router 7, axios, Vitest 4.

---

## Spec Reference

Design: `docs/superpowers/specs/2026-06-10-self-building-demo-kit-design.md`. Three seams (theme/registry/slots), three deliverables (`AGENTS.md`/`PROMPT.md`/`TAILORED-SPEC.md`), packaging = tool-agnostic markdown, integration slots = named (fixed set), wizard output = new git branch.

## Constraints (from repo CLAUDE.md / prior specs)

- **Do NOT commit** unless the plan step says so / the operator instructs. (Steps below include commits; operator may strip them.)
- **Do NOT modify `.env`.**
- **Do NOT add dependencies.** Everything here uses existing deps.
- All work on a branch, never `master`/`main`.

## File Structure

**Modify:**
- `tailwind.config.js` — add `accent-hover`, `success/danger/info/warning/muted` color tokens.
- `src/index.css` — no change needed (verify only).
- 9 files for status-color tokenization: `src/components/Badge.jsx`, `src/components/Button.jsx`, `src/components/Toast.jsx`, `src/components/CopyField.jsx`, `src/components/TransactionRow.jsx`, `src/components/DevPanel.jsx`, `src/pages/Send.jsx`, `src/pages/History.jsx`, `src/pages/Profile.jsx`.
- Brand-hex tokenization across all `src/**/*.jsx` using `#F97316/#EA6C0A/#111827/#1F2937/#374151`.
- `src/App.jsx` — consume feature registry for routes; wire `track` page-views optional.
- `src/components/BottomNav.jsx` — consume feature registry for tabs.
- `src/context/AppContext.jsx` — use `resolveCustomerId()` + `onSession()` from integrations module.

**Create:**
- `src/features.js` — feature registry (single source for pages + nav).
- `src/features.test.js` — registry shape + derivation tests.
- `src/integrations/index.js` — named slot module (`track`, `onSession`, `notify`, `resolveCustomerId`).
- `src/integrations/index.test.js` — slot existence + `resolveCustomerId` behavior tests.
- `AGENTS.md` (repo root) — architecture map + seams + house rules.
- `PROMPT.md` (repo root) — two-phase wizard.
- `TAILORED-SPEC.md` (repo root) — output template the wizard fills.

---

## Token Mapping Reference (used by Tasks 2 & 3)

**Status tokens** (Task 2) — replace hardcoded status colors with semantic tokens:

| Old class | New class |
|-----------|-----------|
| `text-green-400` | `text-success` |
| `bg-green-500/20` | `bg-success/20` |
| `bg-green-500/15` | `bg-success/15` |
| `text-red-400` | `text-danger` |
| `bg-red-500/20` | `bg-danger/20` |
| `bg-red-500/15` | `bg-danger/15` |
| `bg-red-500/10` | `bg-danger/10` |
| `bg-red-500` | `bg-danger` |
| `border-red-500/30` | `border-danger/30` |
| `border-red-500/20` | `border-danger/20` |
| `text-blue-400` | `text-info` |
| `bg-blue-500/20` | `bg-info/20` |
| `bg-blue-500/15` | `bg-info/15` |
| `text-amber-400` | `text-warning` |
| `text-amber-300` | `text-warning` |
| `bg-amber-400` | `bg-warning` |
| `bg-amber-500/20` | `bg-warning/20` |
| `bg-amber-500/30` | `bg-warning/30` |
| `border-amber-500/30` | `border-warning/30` |
| `text-orange-400` | `text-accent` |
| `bg-orange-500/20` | `bg-accent/20` |

**Left intentionally untouched:** `text-gray-*` / `bg-gray-*` neutrals (rebrands rarely change neutrals; a `muted` token is defined for client AI use but grays are not force-migrated). `purple-400` / `bg-purple-500/20` in `DevPanel.jsx` (PATCH/PUT method tags) — DevPanel is an internal dev tool, not client-facing brand surface; leave as-is and note in `AGENTS.md`.

**Brand/surface hex literals** (Task 3) — replace raw hex in `className` strings with existing/added tokens:

| Old literal | New class fragment |
|-------------|--------------------|
| `bg-[#F97316]` | `bg-accent` |
| `hover:bg-[#EA6C0A]` | `hover:bg-accent-hover` |
| `text-[#F97316]` | `text-accent` |
| `border-[#F97316]` | `border-accent` |
| `focus:border-[#F97316]` | `focus:border-accent` |
| `bg-[#111827]` | `bg-base` |
| `bg-[#1F2937]` | `bg-card` |
| `hover:bg-[#1F2937]` | `hover:bg-card` |
| `bg-[#374151]` | `bg-card-hover` |
| `hover:bg-[#374151]` | `hover:bg-card-hover` |
| `border-[#374151]` | `border-card-hover` |

**Left as-is:** `bg-[#0F172A]` (DevPanel panel base — dev tool, optional token). Do not migrate it.

---

## Task 1: Add color tokens to Tailwind config

**Files:**
- Modify: `tailwind.config.js`

- [ ] **Step 1: Add `accent-hover` and semantic tokens**

Replace the `colors` block (lines 6-14) with:

```js
      colors: {
        base: '#111827',
        card: '#1F2937',
        'card-hover': '#374151',
        accent: {
          DEFAULT: '#F97316',
          hover: '#EA6C0A',
        },
        success: '#22C55E',
        danger: '#EF4444',
        info: '#3B82F6',
        warning: '#F59E0B',
        muted: '#9CA3AF',
      },
```

Note: token values match the Tailwind `*-400`/`*-500` shades currently in use, so colors render visually identical. `accent.hover` enables `bg-accent-hover`.

- [ ] **Step 2: Verify build compiles**

Run: `npx vite build`
Expected: build succeeds, no Tailwind errors.

- [ ] **Step 3: Commit**

```bash
git add tailwind.config.js
git commit -m "feat: add semantic + brand color tokens to tailwind config"
```

---

## Task 2: Tokenize status colors (9 files)

**Files:**
- Modify: `src/components/Badge.jsx`, `src/components/Button.jsx`, `src/components/Toast.jsx`, `src/components/CopyField.jsx`, `src/components/TransactionRow.jsx`, `src/components/DevPanel.jsx`, `src/pages/Send.jsx`, `src/pages/History.jsx`, `src/pages/Profile.jsx`

Apply the **Status tokens** table above. Do each file, then verify. Examples of the exact edits:

- [ ] **Step 1: `Badge.jsx` — VARIANTS map**

Replace lines 5-8:
```js
  completed:      'bg-success/20 text-success',
  approved:       'bg-success/20 text-success',
  failed:         'bg-danger/20 text-danger',
  rejected:       'bg-danger/20 text-danger',
```
(Lines 2-4, 9 use `amber-500/20 text-amber-400` → `bg-warning/20 text-warning`, and `gray-500/20 text-gray-400` stays.)

- [ ] **Step 2: `Button.jsx` — danger variant**

Line 6 `danger:` → `'bg-transparent hover:bg-danger/10 text-danger',`

- [ ] **Step 3: `Toast.jsx`**

Line 13 `text-red-400` → `text-danger`; line 14 `text-green-400` → `text-success`.

- [ ] **Step 4: `CopyField.jsx`**

Line 26 `text-green-400` → `text-success`.

- [ ] **Step 5: `TransactionRow.jsx`**

Line 32: `bg-green-500/15` → `bg-success/15`, `bg-blue-500/15` → `bg-info/15`, `bg-red-500/15` → `bg-danger/15`.
Line 35 `text-green-400` → `text-success`; line 37 `text-blue-400` → `text-info`; line 38 `text-red-400` → `text-danger`.
Line 45 `text-green-400`/`text-red-400` → `text-success`/`text-danger`.

- [ ] **Step 6: `DevPanel.jsx`**

Line 9 `bg-blue-500/20 text-blue-400` → `bg-info/20 text-info`; line 10 `bg-orange-500/20 text-orange-400` → `bg-accent/20 text-accent`; line 13 `bg-red-500/20 text-red-400` → `bg-danger/20 text-danger`. Lines 11-12 (`purple`) — **leave as-is**. Line 38 `bg-amber-400` → `bg-warning`; line 40 `text-green-400` → `text-success`; line 42 `text-red-400` → `text-danger`; line 181 `bg-red-500` → `bg-danger`; line 302 `text-red-400`/`text-green-400` → `text-danger`/`text-success`.

- [ ] **Step 7: `pages/Send.jsx`**

Lines 139/332 `bg-green-500/20` → `bg-success/20`; lines 140/333 `text-green-400` → `text-success`; lines 379 `text-red-400` → `text-danger`; line 460 `text-red-400`/`text-amber-400` → `text-danger`/`text-warning`.

- [ ] **Step 8: `pages/History.jsx`**

Line 55 `text-red-400` → `text-danger`.

- [ ] **Step 9: `pages/Profile.jsx`**

Line 53 `border-green-500/30` → `border-success/30`; line 55 `border-red-500/30` → `border-danger/30`; line 84 ternary `text-green-400`→`text-success`, `text-amber-400`→`text-warning`, `text-red-400`→`text-danger` (gray stays); line 143 `border-red-500/20` → `border-danger/20`; line 198 `text-red-400` → `text-danger`.

- [ ] **Step 10: Verify no status hex/classes remain**

Run: `grep -rnE "(green|red|blue|amber|orange)-(300|400|500|600)" src | grep -v "purple"`
Expected: only `purple` references remain (which we kept) — i.e. no green/red/blue/amber/orange status classes left.

- [ ] **Step 11: Run tests + build**

Run: `npx vitest run && npx vite build`
Expected: all existing tests PASS, build succeeds.

- [ ] **Step 12: Commit**

```bash
git add src
git commit -m "refactor: tokenize status colors to semantic tailwind tokens"
```

---

## Task 3: Tokenize brand/surface hex literals

**Files:**
- Modify: all `src/**/*.jsx` containing `#F97316`, `#EA6C0A`, `#111827`, `#1F2937`, `#374151`

- [ ] **Step 1: Apply the Brand/surface table repo-wide**

Apply the **Brand/surface hex literals** mapping table above to every `className` occurrence. Affected files include `App.jsx`, `BottomNav.jsx`, `Toast.jsx`, `CopyField.jsx`, `TransactionRow.jsx`, `DevPanel.jsx`, `Button.jsx`, and pages. Do NOT touch `bg-[#0F172A]` (DevPanel) or any hex outside `className` strings.

Example — `BottomNav.jsx` line 13:
```jsx
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-base border-t border-card-hover md:hidden">
```
`BottomNav.jsx` active state line 22: `text-[#F97316]` → `text-accent`.
Example — `App.jsx` line 44: `bg-[#111827]` → `bg-base`.

- [ ] **Step 2: Verify brand hex gone from className**

Run: `grep -rnE "\[#(F97316|EA6C0A|111827|1F2937|374151)\]" src`
Expected: no matches (only `#0F172A` may remain).

- [ ] **Step 3: Run tests + build + visual check**

Run: `npx vitest run && npx vite build`
Expected: tests PASS, build succeeds. (Operator: `npm run dev` and eyeball parity — colors unchanged.)

- [ ] **Step 4: Commit**

```bash
git add src
git commit -m "refactor: tokenize brand/surface hex literals to tailwind tokens"
```

---

## Task 4: Feature registry

**Files:**
- Create: `src/features.js`
- Create: `src/features.test.js`
- Modify: `src/App.jsx`, `src/components/BottomNav.jsx`

- [ ] **Step 1: Write failing test for registry derivation**

Create `src/features.test.js`:
```js
import { describe, it, expect } from 'vitest'
import { features, navItems, routeItems } from './features'

describe('feature registry', () => {
  it('every feature has required fields', () => {
    for (const f of features) {
      expect(typeof f.id).toBe('string')
      expect(typeof f.route).toBe('string')
      expect(f.element).toBeTruthy()
      expect(typeof f.enabled).toBe('boolean')
    }
  })

  it('routeItems includes only enabled features', () => {
    expect(routeItems.every(f => f.enabled)).toBe(true)
  })

  it('navItems are enabled, inNav, and sorted by navOrder', () => {
    expect(navItems.every(f => f.enabled && f.inNav)).toBe(true)
    const orders = navItems.map(f => f.navOrder)
    expect(orders).toEqual([...orders].sort((a, b) => a - b))
  })

  it('includes the core neobank routes', () => {
    const routes = routeItems.map(f => f.route)
    expect(routes).toEqual(expect.arrayContaining(['/', '/send', '/add-money', '/profile', '/history', '/onboarding']))
  })
})
```

- [ ] **Step 2: Run test — verify it fails**

Run: `npx vitest run src/features.test.js`
Expected: FAIL — cannot resolve `./features`.

- [ ] **Step 3: Create the registry**

Create `src/features.js`:
```js
import { Home, Send as SendIcon, PlusCircle, User } from 'lucide-react'
import Dashboard from './pages/Dashboard'
import AddMoney from './pages/AddMoney'
import Send from './pages/Send'
import History from './pages/History'
import Profile from './pages/Profile'
import Onboarding from './pages/Onboarding'

// Single source of truth for pages + bottom-nav.
// Client AI: drop a feature with `enabled: false`; add one by pushing an entry.
// `inNav` + `navOrder` control the bottom tab bar; `navIcon`/`navLabel` its display.
export const features = [
  { id: 'dashboard', route: '/',          element: Dashboard,  enabled: true,  inNav: true,  navOrder: 0, navIcon: Home,       navLabel: 'Home',      end: true },
  { id: 'send',      route: '/send',      element: Send,       enabled: true,  inNav: true,  navOrder: 1, navIcon: SendIcon,   navLabel: 'Send',      end: false },
  { id: 'add-money', route: '/add-money', element: AddMoney,   enabled: true,  inNav: true,  navOrder: 2, navIcon: PlusCircle, navLabel: 'Add money', end: false },
  { id: 'profile',   route: '/profile',   element: Profile,    enabled: true,  inNav: true,  navOrder: 3, navIcon: User,       navLabel: 'Profile',   end: false },
  { id: 'history',   route: '/history',   element: History,    enabled: true,  inNav: false, navOrder: 99 },
  { id: 'onboarding',route: '/onboarding',element: Onboarding, enabled: true,  inNav: false, navOrder: 99 },
]

export const routeItems = features.filter(f => f.enabled)
export const navItems = features
  .filter(f => f.enabled && f.inNav)
  .sort((a, b) => a.navOrder - b.navOrder)
```

- [ ] **Step 4: Run test — verify it passes**

Run: `npx vitest run src/features.test.js`
Expected: PASS.

- [ ] **Step 5: Refactor `App.jsx` to consume registry**

Replace the imports of page components (lines 8-13) and the `<Routes>` block (lines 45-52). New `App.jsx`:
```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'
import { AppProvider } from './context/AppContext'
import BottomNav from './components/BottomNav'
import ToastContainer from './components/Toast'
import DevPanel from './components/DevPanel'
import { routeItems } from './features'

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
    <div className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-center gap-2 bg-warning/20 border-b border-warning/30 py-2 px-4">
      <WifiOff size={14} className="text-warning" />
      <p className="text-xs text-warning">No internet connection</p>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <OfflineBanner />
        <div className="min-h-screen bg-base font-sans">
          <Routes>
            {routeItems.map(({ id, route, element: Element }) => (
              <Route key={id} path={route} element={<Element />} />
            ))}
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
(Note: this also applies the Task 2/3 token swaps for the offline banner + `bg-base`.)

- [ ] **Step 6: Refactor `BottomNav.jsx` to consume registry**

Replace whole file:
```jsx
import { NavLink } from 'react-router-dom'
import { navItems } from '../features'

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-base border-t border-card-hover md:hidden">
      <div className="flex pb-safe">
        {navItems.map(({ id, route, navIcon: Icon, navLabel, end }) => (
          <NavLink
            key={id}
            to={route}
            end={end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-1 py-3 transition-colors duration-150 ${
                isActive ? 'text-accent' : 'text-gray-500 hover:text-gray-300'
              }`
            }
          >
            <Icon size={22} />
            <span className="text-[10px] font-medium">{navLabel}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
```

- [ ] **Step 7: Run tests + build, verify routes/nav unchanged**

Run: `npx vitest run && npx vite build`
Expected: all PASS, build succeeds. Same 6 routes, same 4 nav tabs in same order.

- [ ] **Step 8: Commit**

```bash
git add src/features.js src/features.test.js src/App.jsx src/components/BottomNav.jsx
git commit -m "feat: lift pages + nav into a single feature registry (seam 2)"
```

---

## Task 5: Named integration slots

**Files:**
- Create: `src/integrations/index.js`
- Create: `src/integrations/index.test.js`
- Modify: `src/context/AppContext.jsx`

- [ ] **Step 1: Write failing test for slots**

Create `src/integrations/index.test.js`:
```js
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
```

- [ ] **Step 2: Run test — verify it fails**

Run: `npx vitest run src/integrations/index.test.js`
Expected: FAIL — cannot resolve `./index`.

- [ ] **Step 3: Create the slot module**

Create `src/integrations/index.js`:
```js
// NAMED INTEGRATION SLOTS — the only place a client wires their own infra.
// Reference demo ships these as safe stubs. Client AI fills the bodies; it must
// NOT rename or remove these exports — call sites across the app depend on them.

// Analytics. Reference: log to console. Client: forward to their analytics SDK.
export function track(event, props = {}) {
  if (import.meta.env.DEV) console.debug('[track]', event, props)
}

// Called once when the customer session loads. Reference: no-op.
// Client: hydrate their session/user store, identify the user, etc.
export function onSession(customer) {
  if (import.meta.env.DEV) console.debug('[onSession]', customer?.id)
}

// User-facing notification. Reference: delegates to the in-app toast.
// Client: route to their notification system if desired.
export function notify(message, kind = 'success') {
  window.dispatchEvent(new CustomEvent(`api-${kind}`, { detail: { message } }))
}

// Session entry point. Reference: localStorage then env var.
// Client: resolve from their auth/session instead.
export function resolveCustomerId() {
  return localStorage.getItem('swipelux_customer_id') ?? import.meta.env.VITE_CUSTOMER_ID
}
```

- [ ] **Step 4: Run test — verify it passes**

Run: `npx vitest run src/integrations/index.test.js`
Expected: PASS.

- [ ] **Step 5: Wire `AppContext.jsx` to the slots**

In `src/context/AppContext.jsx`: delete the local `resolveCustomerId` (lines 8-10), import from integrations, and call `onSession` when the customer loads. Change the import block (lines 1-6) to add:
```js
import { resolveCustomerId, onSession } from '../integrations'
```
Remove the local function (lines 8-10). In the `.then(([cust, wal, accs, txns]) => { ... })` block (lines 44-49), after `setCustomer(cust)` add:
```js
        onSession(cust)
```
Resulting `.then` body:
```js
      .then(([cust, wal, accs, txns]) => {
        setCustomer(cust)
        onSession(cust)
        setWallet(wal)
        setAccounts(accs)
        setTransferLog(txns)
      })
```

- [ ] **Step 6: Run full tests + build**

Run: `npx vitest run && npx vite build`
Expected: all PASS, build succeeds. App still loads customer/wallet from sandbox unchanged.

- [ ] **Step 7: Commit**

```bash
git add src/integrations src/context/AppContext.jsx
git commit -m "feat: add named integration slots module (seam 3)"
```

---

## Task 6: Kit documentation (AGENTS.md, PROMPT.md, TAILORED-SPEC.md)

**Files:**
- Create: `AGENTS.md`, `PROMPT.md`, `TAILORED-SPEC.md` (repo root)

- [ ] **Step 1: Write `AGENTS.md`**

Create `AGENTS.md`:
```markdown
# Swipelux Neobank Demo — Agent Guide

This repo is a **self-building integration starter-kit**. It is a working API-driven neobank
demo on the Swipelux sandbox, structured so an AI agent can re-skin it and wire it into a
client's infrastructure by editing three well-defined seams.

If you are tailoring this demo for a client, read `PROMPT.md` and follow it.

## Stack
React 19 + Vite + Tailwind 3 + React Router 7 + axios. Tests: Vitest.

## Layout
- `src/api/*` — Swipelux sandbox API calls (customers, wallets, accounts, recipients, transfers). **Do not change** — these are the integration surface.
- `src/context/AppContext.jsx` — loads customer/wallet/accounts/transfers, exposes via `useApp()`.
- `src/pages/*` — screens (Dashboard, Send, AddMoney, History, Profile, Onboarding).
- `src/components/*` — shared UI (Card, Button, Badge, BottomNav, Toast, DevPanel, …).
- `src/features.js` — **feature registry** (Seam 2).
- `src/integrations/index.js` — **integration slots** (Seam 3).
- `tailwind.config.js` — **theme tokens** (Seam 1).

## The three seams

### Seam 1 — Theme tokens (`tailwind.config.js`)
All brand + status colors are Tailwind tokens: `accent` (+`accent.hover`), `base`, `card`,
`card-hover`, `success`, `danger`, `info`, `warning`, `muted`. Re-skin = edit the `colors` block
and swap the brand name/logo. Do NOT reintroduce raw hex (`bg-[#...]`) or color literals
(`text-green-400`) in components. Exception: `DevPanel.jsx` keeps `purple-*`/`#0F172A` — it is an
internal dev tool, not client-facing surface.

### Seam 2 — Feature registry (`src/features.js`)
One array drives both routes (`App.jsx`) and the bottom nav (`BottomNav.jsx`). To remove a
feature set `enabled: false`; to add one, push `{ id, route, element, enabled, inNav, navOrder, navIcon, navLabel, end }`
and create its page in `src/pages/`. Never hardwire routes/tabs outside the registry.

### Seam 3 — Integration slots (`src/integrations/index.js`)
A fixed, named set: `track(event, props)`, `onSession(customer)`, `notify(message, kind)`,
`resolveCustomerId()`. Reference ships safe stubs. Fill the bodies to wire client infra. Do NOT
rename or remove these exports — call sites depend on them.

## Out of scope (do not change)
- `src/api/*` and `AppContext` data binding — stays on the Swipelux sandbox.
- Auth/identity beyond `resolveCustomerId()`.

## House rules
- Do NOT modify `.env`. Do NOT add dependencies without need. Keep the demo runnable against the
  sandbox. Keep `npx vitest run` green and `npx vite build` passing.
- Do all tailoring work on a NEW git branch, never on `main`/`master`.
```

- [ ] **Step 2: Write `PROMPT.md`**

Create `PROMPT.md`:
```markdown
# Tailor This Demo — Wizard

You are an AI agent helping a client adapt this Swipelux neobank demo to their brand and
infrastructure. Read `AGENTS.md` first. Work in two phases with a review gate between them.

## Phase 1 — Interview (one topic at a time)
Ask the client, waiting for each answer before the next:
1. **Brand** — company name, logo (file/URL), primary/accent color, surface (background) preference, font.
2. **Features** — review `src/features.js`. Which to keep, which to drop, which to add? For each new feature: name, route, what it does.
3. **Integrations** — which named slots in `src/integrations/index.js` to wire, and to what:
   - `track` → which analytics provider?
   - `onSession` → which session/user store?
   - `notify` → in-app toast (default) or their system?
   - `resolveCustomerId` → how is the customer id obtained in their app?
4. **Copy/locale** — any wording, currency, or language changes?

## Phase 2 — Write `TAILORED-SPEC.md`, then STOP
Fill the `TAILORED-SPEC.md` template with the answers. Present it to the client.
**Do not write code until the client approves the spec.**

## Phase 3 — Implement (after approval)
1. Create a new git branch: `git checkout -b tailored/<client-slug>`.
2. Apply changes against the three seams ONLY:
   - Brand → `tailwind.config.js` token `colors` block + logo/name.
   - Features → `src/features.js` (+ new page components).
   - Integrations → fill slot bodies in `src/integrations/index.js`.
3. Keep `npx vitest run` green and `npx vite build` passing.
4. Do NOT touch `src/api/*`, `AppContext` data binding, or `.env`.
5. Hand back the running demo + the branch diff — this is the client's onboarding skeleton.
```

- [ ] **Step 3: Write `TAILORED-SPEC.md` template**

Create `TAILORED-SPEC.md`:
```markdown
# Tailored Demo Spec — <Client Name>

> Filled by the wizard in `PROMPT.md`. Client approves this before any code is written.

## Brand
- Company name: <...>
- Logo: <path or URL>
- Accent color: <#hex>
- Surface/base color: <#hex>
- Card color: <#hex>
- Font: <...>

## Features
| Feature | Keep / Drop / Add | Notes |
|---------|-------------------|-------|
| Dashboard | keep | |
| Send | keep | |
| Add money | keep | |
| Profile | keep | |
| History | keep | |
| <new feature> | add | route, purpose |

## Integrations (named slots)
| Slot | Wire to | Notes |
|------|---------|-------|
| `track` | <provider / none> | |
| `onSession` | <store / none> | |
| `notify` | <toast default / their system> | |
| `resolveCustomerId` | <source> | |

## Copy / Locale
- <changes or "none">

## Out of scope (unchanged)
- Swipelux API layer (`src/api/*`), `AppContext` data binding, auth beyond `resolveCustomerId`, `.env`.
```

- [ ] **Step 4: Verify docs render and seams referenced are accurate**

Run: `grep -l "features.js\|integrations\|tailwind.config" AGENTS.md PROMPT.md`
Expected: `AGENTS.md` (and the seam references resolve to real files created in Tasks 1, 4, 5).

- [ ] **Step 5: Commit**

```bash
git add AGENTS.md PROMPT.md TAILORED-SPEC.md
git commit -m "docs: add self-building kit guide, wizard, and tailored-spec template"
```

---

## Final Verification

- [ ] **Step 1: Full suite + build**

Run: `npx vitest run && npx vite build`
Expected: all tests PASS, build succeeds.

- [ ] **Step 2: No stray hardcoded colors (except documented exceptions)**

Run: `grep -rnE "\[#(F97316|EA6C0A|111827|1F2937|374151)\]|(green|red|blue|amber|orange)-(300|400|500|600)" src`
Expected: zero matches except `purple-*` lines in `DevPanel.jsx`.

- [ ] **Step 3: Operator visual parity check**

Run: `npm run dev`
Expected: demo looks and behaves identically to before — same colors, same nav, same routes. Seams are now centralized.

---

## Self-Review Notes (author)

- **Spec coverage:** Seam 1 (Tasks 1-3), Seam 2 (Task 4), Seam 3 (Task 5), three deliverables (Task 6), packaging A = root markdown (Task 6), named slots (Task 5 fixed exports), output-on-branch (documented in PROMPT.md Phase 3). All spec sections covered.
- **Scope addition vs spec:** spec Seam 1 named only status tokens; plan also tokenizes brand hex literals (Task 3) because the brand-swap goal ("edit one config block") is unreachable while components hardcode `#F97316` etc. Consistent with spec intent.
- **Type consistency:** registry fields (`id/route/element/enabled/inNav/navOrder/navIcon/navLabel/end`) consumed identically in `App.jsx` (`element`, `route`, `id`) and `BottomNav.jsx` (`navIcon`, `navLabel`, `end`, `route`, `id`). Slot names (`track/onSession/notify/resolveCustomerId`) identical across module, tests, `AppContext`, and docs.
```
