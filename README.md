# Swipelux Neobank Demo — Self-Building Integration Kit

A working, API-driven neobank demo running on the Swipelux sandbox, structured so an **AI agent
can re-skin it and wire it into a client's infrastructure** by editing three well-defined seams —
without touching the integration surface or the data flow.

## What this is

- A runnable reference neobank (Dashboard, Send, Add money, History, Profile, Onboarding, Login)
  bound to the live Swipelux sandbox.
- A **kit**: drop it in front of a client's AI agent, which interviews the client, writes a
  tailored spec, gets approval, then builds a branded, integrated demo.

## For AI agents — start here

1. Read **`AGENTS.md`** — the map: stack, layout, and the three seams (theme tokens, feature
   registry, integration slots) with the rules for each.
2. To tailor for a client, follow **`PROMPT.md`** — the two-phase, review-gated wizard. It writes
   **`TAILORED-SPEC.md`** (the contract the client approves before any code).

## The three seams

| Seam | File | Edit to... |
|------|------|------------|
| 1. Theme tokens | `tailwind.config.js` | re-skin brand + neutral/status colors (zero component edits) |
| 2. Feature registry | `src/features.js` | add/drop pages and bottom-nav tabs |
| 3. Integration slots | `src/integrations/index.js` | wire analytics, session, notifications, customer id |

Everything outside these seams (`src/api/*`, `AppContext` data binding, `.env`) stays on the
Swipelux sandbox and must not change.

## Develop

```bash
npm install
npm run dev        # run against the sandbox
npx vitest run     # tests (must stay green)
npx vite build     # production build (must pass)
```

Stack: React 19 + Vite + Tailwind 3 + React Router 7 + axios. Tests: Vitest.
