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
`resolveCustomerId()`, `setCustomerId(id)`. Reference ships safe stubs. Fill the bodies to wire
client infra. Do NOT rename or remove these exports — call sites depend on them.

## Out of scope (do not change)
- `src/api/*` and `AppContext` data binding — stays on the Swipelux sandbox.
- Auth/identity beyond `resolveCustomerId()`.

## House rules
- Do NOT modify `.env`. Do NOT add dependencies without need. Keep the demo runnable against the
  sandbox. Keep `npx vitest run` green and `npx vite build` passing.
- Do all tailoring work on a NEW git branch, never on `main`/`master`.
