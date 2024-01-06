# Swipelux Neobank Starter — Agent Guide

This repo is a **self-building integration starter-kit**. It is a working API-driven neobank
demo on the Swipelux sandbox, structured so an AI agent can re-skin it and wire it into a
client's infrastructure by editing three well-defined seams.

If you are tailoring this demo for a client, read `PROMPT.md` and follow it.

## Stack
React 19 + TypeScript + Vite + Tailwind 3 + React Router 7 + axios. Tests: Vitest.

## API reference
The integration surface (`src/api/*`) already wraps the **Swipelux Wallet API**. You do not need
the raw spec to tailor the demo. If you ever extend it, consult the live reference — do **not**
bundle a spec file into this repo (it goes stale):
- API reference (OpenAPI, live): https://platform.swipelux.com/api-reference
- Docs: https://docs.swipelux.com
- Sandbox base URL: `https://platform.sbx.swipelux.com` (set in `.env`; see `.env.example`).

## Layout
- `src/api/*` — Swipelux sandbox API calls (customers, wallets, accounts, recipients, transfers). **Do not change** — these are the integration surface.
- `src/context/AppContext.tsx` — loads customer/wallet/accounts/transfers, exposes via `useApp()`.
- `src/pages/*` — screens (Dashboard, Send, AddMoney, History, Profile, Onboarding).
- `src/components/*` — shared UI (Card, Button, Badge, BottomNav, Toast, DevPanel, …).
- `src/features.ts` — **feature registry** (Seam 2).
- `src/integrations/index.ts` — **integration slots** (Seam 3).
- `tailwind.config.js` — **theme tokens** (Seam 1).

## The three seams

### Seam 1 — Theme tokens (`tailwind.config.js`)
All brand, neutral, and status colors are Tailwind tokens. Brand/surface: `accent`
(+`accent.hover`), `base`, `card`, `card-hover`. Neutral text ramp (high→low emphasis):
`fg-strong`, `fg`, `fg-muted`, `muted`, `subtle`, `faint`. Status: `success`, `danger`, `info`,
`warning`. Re-skin = edit the `colors` block and swap the brand name/logo — **zero component
edits**. Brand identity lives in two files: **colors + font** in `tailwind.config.js`, and
**name + logo** in `src/brand.ts` (exports a `brand` object `{ name, logoSrc, tagline? }` — the
single place a client sets the brand name and logo). Do NOT reintroduce raw hex in classes (`bg-[#...]`), color-scale literals (`text-gray-500`,
`text-green-400`), or bare `text-white`/`bg-black` in `src/components`/`src/pages` — the
`src/theme-tokens.test.ts` guard fails the build if you do (it scans those two dirs for `.ts`/`.tsx`
files; bare hex in inline style objects is outside its reach, so still avoid it). Exception: `DevPanel.tsx` keeps
`purple-*`/`gray-*`/`text-white`/`#0F172A` — it is an internal dev tool, not client-facing
surface, and is exempt from the guard.

### Seam 2 — Feature registry (`src/features.ts`)
One array drives both routes (`App.tsx`) and the bottom nav (`BottomNav.tsx`). To remove a
feature set `enabled: false`; to add one, push `{ id, route, element, enabled, inNav, navOrder, navIcon, navLabel, end }`
and create its page in `src/pages/` (a typed `.tsx`). Never hardwire routes/tabs outside the registry.

### Seam 3 — Integration slots (`src/integrations/index.ts`)
A fixed, named set: `track(event, props)`, `onSession(customer)`, `notify(message, kind)`,
`resolveCustomerId()`, `setCustomerId(id)`. Reference ships safe stubs. Fill the bodies to wire
client infra. Do NOT rename or remove these exports — call sites depend on them.

## Session entry (not authentication)
The `/login` page and the `CustomerGate` wrapper (`App.tsx`) are the **session-entry surface**:
they collect and persist a customer id via `resolveCustomerId()` / `setCustomerId()` (Seam 3),
then gate the app on whether one is set. This is **NOT** real authentication. A client AI must
**not** wire passwords, OAuth, or any real auth flow here — identity beyond `resolveCustomerId()`
stays out of scope. To change how the id is obtained/persisted, fill those two slots, not `/login`.

## Out of scope (do not change)
- `src/api/*` and `AppContext` data binding — stays on the Swipelux sandbox.
- Auth/identity beyond `resolveCustomerId()` (see "Session entry" above — `/login` is not auth).

## House rules
- **Stay self-contained.** Ground every decision ONLY in this repo's files plus the linked
  Swipelux API reference (see "API reference"). Do NOT pull context from outside the repo — no
  second brain, company wiki, sibling repos, or other workspaces — and do NOT add such references
  to the kit. If a tailoring answer needs information not in this repo, ask the client for it.
- Do NOT modify `.env`. Do NOT add dependencies without need. Keep the demo runnable against the
  sandbox. Keep `npm run typecheck` (`tsc --noEmit`) green, `npx vitest run` green, and `npx vite build` passing.
- Do all tailoring work on a NEW git branch, never on `main`/`master`.
