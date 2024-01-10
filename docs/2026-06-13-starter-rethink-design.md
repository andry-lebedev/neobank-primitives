# Neobank Starter v2 — Rethink Design

**Date:** 2026-06-13
**Status:** Approved design, pre-implementation
**Supersedes:** the v1 "self-building integration kit" structure (three seams + interview wizard)

## 1. Why

The v1 kit works but undersells the product: design is plain, the value of Swipelux is
invisible unless you read code, configuration needs `.env` editing, and tailoring requires a
multi-step interview before anything impressive happens. v2 inverts the priorities: the starter
must be **beautiful and convincing by itself, instantly**, must **explain what Swipelux does**
at product level on demand, must need **only an API key** to go live, and must be
**personalizable by an AI agent from a single pasted prompt**.

## 2. Audience and core idea

Primary: a **prospect evaluating Swipelux** (decision-maker or their tech lead), pre-sales.
The demo must impress within the first five minutes, with zero setup.

Core idea — one artifact, three layers of engagement:

1. **Open it** → a polished, working neobank with realistic data, no key needed.
2. **Flip "How it works"** → product-level narration of what Swipelux does behind every action.
3. **Paste one prompt into an AI agent** → the same neobank wearing the prospect's brand.

A "Go live" button (paste API key) switches the whole app from demo data to the live Swipelux
sandbox at any point.

## 3. Goals / non-goals

**Goals**

- Beautiful out of the box: light minimal default skin, responsive web app.
- Zero-config first run: `git clone && npm i && npm run dev` shows a fully working demo.
- Single configuration value: the Swipelux API key (env var or pasted in-app).
- Product storytelling: per-action flow explainer, off by default, one toggle away.
- One-shot AI re-brand: agent edits at most two config files for a full re-skin.
- Extensible by AI: feature registry + integration slots for "add a rewards page" asks.
- Hosted demo-mode instance (static build) as the first-touch funnel.

**Non-goals**

- Real authentication (session entry stays a slot-based concern, as v1).
- The client's real backend (integration slots are stubs to be filled per client).
- Code-level API inspector (explainer is product-level; deep-divers get docs links).
- Bundling the OpenAPI spec (link the live reference; unchanged v1 rule).

## 4. Stack

Vite SPA + React + TypeScript + **Tailwind 4** (CSS-first `@theme`) + **shadcn/ui** +
React Router + axios. Tests: Vitest. Lint: ESLint. No server component; the API key lives
client-side, which is acceptable for a sandbox demo.

This is a **fresh rebuild**, not an evolution: new scaffold, design-first; the v1 API layer's
endpoint knowledge is ported into the new data layer. Nothing is pushed to GitHub until
explicitly cleared — all work stays local for now.

## 5. Product surface

**Shell:** full responsive web app (the neobank IS the page). Desktop: icon sidebar + a
**centered content column** (max-width; stays centered whether the explainer drawer is open or
closed). Mobile: bottom tab bar. Light minimal skin: near-white surfaces, bold tight
typography, single dark accent by default — deliberately the most re-skinnable canvas.

**Screens** (carried from v1, redesigned):

- **Home** — total balance, quick actions (Send / Add money), virtual account, recent activity.
- **Send** — bank payout and P2P wallet transfer, quote → confirm flow.
- **Add money** — SEPA / SWIFT / crypto deposit details.
- **Activity** — transfer history with status and detail view.
- **Profile** — customer, KYC status, wallet/account details, "Connect API key", "Reset demo",
  and the "Make it yours" tailoring section.
- **Onboarding** — create customer → wallet → account (runs in both demo and live mode).

**Flow explainer** ("How it works") — the "show internals" feature:

- Toggle chip in the top bar, **off by default**.
- When on: right-side drawer on desktop, bottom sheet on mobile.
- Narrates each user action at **product level** (not code level), e.g. a bank payout renders
  as a step timeline: *Quote locked → Compliance screened → Stablecoin converted → SEPA payout
  sent*, each step with one plain-language line on what Swipelux handles.
- Steps animate live as the underlying state changes (pending → completed).
- Each card ends with a single "View API call ↗" link to the live Swipelux docs.
- Content lives in `src/explainers.ts`, keyed by action event — itself tailorable.
- Works identically in demo and live mode.

## 6. Data architecture (demo/live duality)

**One interface, two sources.** A `DataSource` interface mirrors the v1 API modules
(customers, wallets, accounts, recipients, transfers).

- `src/data/live/` — axios against the Swipelux sandbox; a port of v1 `src/api/*` shapes.
  **Do-not-touch zone** for tailoring agents (the integration surface).
- `src/data/demo/` — in-memory store + fixtures. **Stateful, not static:** seeded persona
  (customer, EUR + USDC balances, ~15 history items); a send creates a `pending` transfer that
  auto-advances to `completed` after ~8 s (simulating the webhook lifecycle and driving the
  explainer animation); onboarding runs with a fake KYC pass after a delay. State persists in
  `sessionStorage`; "Reset demo" lives in Profile.

**Mode resolution:** API key present → live; absent → demo. Key sources: `VITE_API_TOKEN`
(optional env) or pasted in-app. While in demo mode a slim persistent banner shows
"Demo data — connect your API key to go live" with a **"Go live" button right in the banner**:
click → modal → paste key → validated with a single GET → stored in `localStorage` → app
switches to live without rebuild. Profile keeps a secondary entry point. Invalid key → clear
error in the modal, app stays in demo mode.

**Live-mode session entry:** with a key but no customer yet, the app offers Onboarding (create
a customer) or "use an existing customer id" — backed by the `resolveCustomerId` /
`setCustomerId` slots, as in v1. This remains session entry, not authentication.

**Events:** both sources emit the same **action events** (`payout.quoted`, `payout.executed`,
`customer.created`, …). The explainer subscribes to events, not to pages; pages stay dumb and
read everything through a single `useApp()`.

**Errors:** live failures surface as toasts plus a red failed step in the explainer (failure
handling is itself a product demo). Demo mode fails only deliberately (e.g. insufficient
funds).

## 7. Customization architecture (hybrid: config-first, seams underneath)

**The 90% path — a full re-brand touches exactly two files:**

| File | Holds |
|------|-------|
| `src/theme.css` | Tailwind 4 `@theme` + shadcn CSS variables: brand colors, radius, fonts. No `tailwind.config.js` in v2. |
| `src/brand.config.ts` | Name, logo, tagline; copy-tone tokens (greeting, product nouns); currency/locale defaults; feature toggles (`send`, `addMoney`, …); explainer default on/off. Zod-validated. |

**The depth path — extending beyond a re-brand:**

- `src/features.ts` — registry driving routes + nav (as v1); new pages register here.
  Relation to config: the registry defines which features **exist**; the `brand.config.ts`
  toggles flip the `enabled` flag of registry entries by id. Existence lives in the registry,
  enablement in the config — one source of truth each.
- `src/integrations/` — fixed named slots: `track`, `onSession`, `notify`,
  `resolveCustomerId`, `setCustomerId` (as v1; safe stubs shipped).
- `src/explainers.ts` — per-action narration content.

**Enforcement (machine-checked):**

- Guard test + ESLint rule: no raw color literals in `src/components` / `src/pages`; semantic
  tokens only (carried from v1, natural fit with shadcn CSS vars).
- Zod schema test on `brand.config.ts` — a malformed AI edit fails fast with a readable error.
- `src/data/live/*` is off-limits to tailoring (same standing as v1 `src/api/*`).
- shadcn primitives live in `src/components/ui/`; agents restyle via tokens, never hand-edit
  primitive internals.

## 8. AI tailoring flow (one-shot)

**Entry:** README "Open in Claude" button + a plain copy-paste kickoff prompt, tool-agnostic
(Claude Code, Cursor, Codex). The prospect fills one blank:
`I'm <Company>. [website / brand description — optional]`.

**Brand input fallback chain — never stalls:**

1. **Website given** → agent fetches it and derives name, logo (favicon / og-image fallback),
   primary/accent colors, font feel, tone of voice.
2. **No site, description given** → agent builds the brand from the free-text description
   (colors, vibe, audience).
3. **Name only** → agent generates a tasteful identity itself (palette + tone from name and
   industry), states what it chose; the user iterates in plain words afterwards
   ("more corporate", "green not purple").

**Agent flow (`PROMPT.md` v2):**

1. Derive the brand per the fallback chain.
2. Create a new git branch; edit `src/theme.css` + `src/brand.config.ts` (plus explainer copy
   if the tone warrants).
3. Keep guards, typecheck, and build green; start the dev server; hand back "your neobank"
   with a summary of what was derived and why.
4. Ask only when genuinely blocked. No interview, no spec gate — wow first, iterate after.
   Follow-up asks map to feature toggles or the depth path per `AGENTS.md`.

**Docs:** `AGENTS.md` v2 = repo map + two explicit paths ("re-brand = config files only" vs
"extend = registry/slots") + carried house rules (stay self-contained, never touch
`src/data/live/*`, work on a branch, keep guards green). v1's `TAILORED-SPEC.md` is removed —
replaced by the branch diff + the agent's summary.

## 9. Distribution

- **Hosted demo-mode instance** (e.g. `demo.swipelux.com`): the same repo's static Vite build
  running keyless. Deployment target: Vercel (static build); the artifact is identical to a
  local keyless run.
- **In-app "Make it yours" surface** (Profile section): shows the copy-paste prompt, the
  GitHub link, and the "Open in Claude" entry — hosted visitors funnel into tailoring without
  reading the README.
- **"Go live" works on the hosted instance too** — a prospect with a sandbox key can switch
  the hosted demo to live data in the browser, zero clone.
- README rewritten: hero screenshot, hosted link first, then the clone + prompt path.
- **Constraint: nothing is pushed to GitHub for now.** The rebuild happens locally; publishing
  (force-replace of `swipelux/neobank-starter`, with v1 preserved via tag or archive branch)
  and hosting deploy wait for explicit clearance.

## 10. Testing and guards

Carried from v1: theme-token guard (vitest scan + ESLint rule), feature-registry test,
integrations contract test, `tsc --noEmit`, production build must pass.

New in v2:

- **Demo source state machine:** send → `pending` → auto-`completed`; balance math; reset;
  onboarding lifecycle.
- **Mode resolution:** key present → live; absent → demo; invalid key → stays demo with the
  error surfaced in the Go-live modal.
- **`brand.config.ts` schema:** zod validation test fails fast on malformed edits.
- **Explainer mapping:** every emitted action event has explainer content — no silent blank
  drawer.
- **Feature toggles:** a disabled feature has no route, no nav entry, and no dead links.

## 11. Acceptance criteria

1. `git clone && npm i && npm run dev` → beautiful, fully working demo; zero configuration.
2. Paste a sandbox API key via the banner's "Go live" → same app on live sandbox data.
3. One pasted prompt to an AI agent → full re-brand confined to `src/theme.css` +
   `src/brand.config.ts`, all guards green.
4. "How it works" toggle narrates every core action in product language, in both modes.
5. The static build runs as the hosted demo with no code changes.
