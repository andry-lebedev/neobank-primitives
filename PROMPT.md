# Tailor This Demo — Wizard

You are an AI agent helping a client adapt this Swipelux neobank demo to their brand and
infrastructure. Read `AGENTS.md` first. Work in two phases with a review gate between them.

## Phase 1 — Interview (one topic at a time)
Ask the client, waiting for each answer before the next:
1. **Brand** — company name + logo (file/URL) → `src/brand.js`; primary/accent color, surface (background) preference, font → `tailwind.config.js`.
2. **Features** — review `src/features.js`. Which to keep, which to drop, which to add? For each new feature: name, route, what it does.
3. **Integrations** — which named slots in `src/integrations/index.js` to wire, and to what:
   - `track` → which analytics provider?
   - `onSession` → which session/user store?
   - `notify` → in-app toast (default) or their system?
   - `resolveCustomerId` → how is the customer id obtained in their app?
   - `setCustomerId` → where should the resolved id be persisted — their session store or the default `localStorage`?
4. **Copy/locale** — any wording, currency, or language changes?

## Phase 2 — Write `TAILORED-SPEC.md`, then STOP
Fill the `TAILORED-SPEC.md` template with the answers. Present it to the client.
**Do not write code until the client approves the spec.**

## Phase 3 — Implement (after approval)
1. Create a new git branch: `git checkout -b tailored/<client-slug>`.
2. Apply changes against the three seams ONLY:
   - Brand → colors/font in `tailwind.config.js` token `colors` block; name/logo in `src/brand.js` (`{ name, logoSrc, tagline? }`).
   - Features → `src/features.js` (+ new page components — see template below).
   - Integrations → fill slot bodies in `src/integrations/index.js`.
3. Keep `npx vitest run` green and `npx vite build` passing.
4. Do NOT touch `src/api/*`, `AppContext` data binding, or `.env`.
5. Hand back the running demo + the branch diff — this is the client's onboarding skeleton.

### Adding a feature — copy-paste template
A feature is a page component + one `src/features.js` entry. Read demo data with `useApp()` and
style with semantic tokens only (no raw color literals like `text-gray-500`/`bg-[#...]`/`text-white`).
`useApp()` exposes: `customer`, `wallet`, `accounts`, `transferLog`, `loading`, `error`,
`addTransfer`, `refreshWallet`, `refreshCustomer`, `loggedOut`, `setLoggedOut`.

`src/pages/Rewards.jsx` (new page):

```jsx
import Card from '../components/Card'
import { useApp } from '../context/useApp'

export default function Rewards() {
  const { customer, transferLog, loading } = useApp()
  const firstName = customer?.personal?.firstName ?? 'there'
  const points = transferLog.length * 10

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-28 space-y-4">
      <h1 className="text-xl font-bold text-fg-strong">Rewards</h1>
      <Card className="p-5">
        <p className="text-xs text-subtle mb-1">Hi {firstName}, your points</p>
        <p className="text-4xl font-bold text-fg-strong tracking-tight">
          {loading ? '—' : points}
        </p>
        <p className="text-sm text-muted mt-1">Earn 10 per transfer</p>
      </Card>
    </div>
  )
}
```

`src/features.js` (import the page, then push an entry into the `features` array):

```js
import Rewards from './pages/Rewards'
import { Gift } from 'lucide-react'
// …
{ id: 'rewards', route: '/rewards', element: Rewards, enabled: true, inNav: true, navOrder: 4, navIcon: Gift, navLabel: 'Rewards', end: false },
```

Non-nav pages (reachable by route only) use `inNav: false, navOrder: 99` and omit the nav fields.
