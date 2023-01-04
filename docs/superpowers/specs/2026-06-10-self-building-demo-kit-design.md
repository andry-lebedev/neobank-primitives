# Self-Building Demo Kit — Design

**Date:** 2026-06-10
**Status:** Approved design → ready for implementation plan
**Repo:** `dummy-neobank`

## Goal

Turn the existing `dummy-neobank` Swipelux demo into a **self-building integration starter-kit**.
A client's own AI agent reads the kit, interviews the client, writes a tailored spec, gets
approval, then builds a demo wearing the client's brand and wired to the client's integrations —
proving how Swipelux fits *their* infra, not just listing features.

The reference demo stays fully runnable against the live sandbox. The kit is **additive**: new
docs + three clean extension seams. No behavior change to the running demo.

## Non-Goals (locked)

- **Their backend / data model.** `AppContext` stays bound to the Swipelux sandbox. The kit does
  not abstract the data layer for arbitrary backends.
- **Auth / identity.** Not touched. `resolveCustomerId()` stays the session entry point.
- **Multi-framework.** React-only. No attempt to make the demo portable to other stacks.
- **Hand-holding by Swipelux.** Spec must be self-contained and foolproof for a third-party AI.

## Audience & Consumer

Self-serve. The consumer is the **client's own AI agent** (Claude Code / Cursor / codex). The
spec is tool-agnostic markdown at repo root — no Swipelux engineer in the loop.

## Architecture — three deliverables

The repo becomes a remixable kit: three docs layered on the existing demo, plus the demo
refactored so three extension seams exist and are clean.

### 1. `AGENTS.md` (repo root) — the map

- Architecture overview: stack, `src/` layout, data flow (`AppContext` → pages), API layer.
- The **three named seams** (below) — what each is, the single file to edit, the rules.
- House rules / guardrails: do not touch `AppContext` data binding, do not modify `.env`, do not
  add dependencies without need, keep the demo runnable against sandbox, work on a branch.

### 2. `PROMPT.md` (repo root) — the wizard

Two-phase, review-gated meta-prompt the client's AI executes:

1. **Interview** — ask the client, one topic at a time: brand (name, logo, palette, font),
   which features to keep/drop/add (from the feature registry), which integration slots to wire
   (from the named slot list), any copy/locale needs.
2. **Write `TAILORED-SPEC.md`** — the AI records the answers as a concrete spec.
3. **Review gate** — client reviews `TAILORED-SPEC.md`; AI does not build until approved.
4. **Implement** — on a **new git branch**, AI applies changes against the three seams only.
5. **Hand back** — running tailored demo + the branch diff as the client's onboarding skeleton.

### 3. `TAILORED-SPEC.md` template — the output contract

A template the wizard fills. Sections mirror the seams: Brand, Features (keep/drop/add),
Integrations (which named slots, wired to what), Copy/Locale, Out-of-scope notes. This file is
the artifact the client approves at the review gate and the first commit of their real
integration.

## Architecture — three extension seams

The AI generates *against* these seams, not blind. Each is one obvious edit point.

### Seam 1 — Semantic theme tokens (brand axis)

**Current state:** status colors (`green/blue/red/purple/amber-400`, `*-500/xx`) hardcoded
across 9 files: `Badge.jsx`, `Button.jsx`, `Toast.jsx`, `CopyField.jsx`, `TransactionRow.jsx`,
`DevPanel.jsx`, `pages/Send.jsx`, `pages/History.jsx`, `pages/Profile.jsx`.

**Change:** define semantic tokens in `tailwind.config.js` — keep `accent`/`brand`, add
`success / danger / info / warning / muted`. Replace hardcoded color classes with token classes.
Where logic picks a color by status (Badge variants, TransactionRow direction, DevPanel method,
Profile KYC), map status→token in one place.

**Client edit:** re-theme = edit the one token block in `tailwind.config.js` + swap brand
name/logo. Zero component edits.

### Seam 2 — Feature registry (features axis)

**Current state:** pages (Dashboard / Send / AddMoney / History / Profile) and bottom-nav tabs
are wired by hand in `App.jsx` and `BottomNav.jsx`.

**Change:** single `src/features.js` registry — array of
`{ id, label, icon, route, element, enabled, navOrder, inNav }`. `App.jsx` builds routes from it;
`BottomNav.jsx` builds tabs from it (filtered by `enabled && inNav`, sorted by `navOrder`).

**Client edit:** drop a feature = `enabled: false`. Add a feature = push one entry pointing at a
new page component. The registry is the self-documenting menu of what is remixable.

### Seam 3 — Integration slots (their-infra axis)

**Current state:** none. No place to wire client analytics / notifications / session.

**Change:** one `src/integrations/index.js` module exporting a **fixed, named** set of slots,
shipped as no-ops / console stubs in the reference demo:

- `track(event, props)` — analytics. Reference: `console.debug`.
- `onSession(customer)` — called once when customer loads. Reference: no-op.
- `notify(message, kind)` — user-facing notification. Reference: delegates to existing toast.
- `resolveCustomerId()` — formalize the existing localStorage/env lookup as the session slot.

Slots are **named, not freeform** — the AI fills known functions so output is predictable.
Call sites wired in the reference demo (e.g. `track` on key actions, `onSession` in `AppContext`).

## Data Flow (unchanged)

`resolveCustomerId()` → `AppContext` fetches customer/wallet/accounts/transfers from sandbox →
pages consume via `useApp()`. The seams sit *around* this flow (theme = presentation, registry =
routing, slots = side-effect hooks). The flow itself is untouched, preserving the non-goal.

## Packaging

**Tool-agnostic (Approach A).** `AGENTS.md` + `PROMPT.md` + `TAILORED-SPEC.md` template as plain
markdown at repo root. Any AI agent consumes them. No Claude-skill wrapper now; door open later.

## Scope of code change

Additive refactor, no feature/behavior change to the running demo:

1. `tailwind.config.js` — add semantic token block.
2. 9 component/page files — swap hardcoded color classes for token classes (mechanical).
3. New `src/features.js`; refactor `App.jsx` + `BottomNav.jsx` to consume it.
4. New `src/integrations/index.js`; wire `resolveCustomerId`, `onSession`, `track`, `notify` at
   existing call sites.
5. New root docs: `AGENTS.md`, `PROMPT.md`, `TAILORED-SPEC.md` (template).

## Testing

- **Visual/behavior parity:** demo looks and behaves identically after the token + registry
  refactor (status colors, nav, routes unchanged). Existing vitest suites must stay green.
- **Seam smoke:** flipping a registry `enabled` flag removes the route + nav tab; editing a token
  re-colors all consumers; a stubbed `track` fires on a key action.
- **Kit dry-run:** an AI agent following `PROMPT.md` on a sample brief produces a valid
  `TAILORED-SPEC.md` and a buildable branch (manual validation, not automated).

## Constraints (from repo)

Do not commit without instruction, do not modify `.env`, do not add dependencies. Tailored output
lands on a **new git branch**, never on `master`/`main`.
