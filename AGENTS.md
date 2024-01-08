# Neobank Starter — Agent Guide

A working neobank demo on the Swipelux sandbox. Runs beautifully with ZERO config
(demo mode, realistic local data); a single API key switches it live. Built to be
re-branded by an AI agent in one pass.

If you are tailoring this app for a client, read this file, then follow `PROMPT.md`.

## Stack
Vite + React 19 + TypeScript (strict) + Tailwind 4 (CSS-first) + shadcn/ui +
React Router + axios + zod. Tests: Vitest. Lint: ESLint.

## Two paths — pick the right one

### Path 1: RE-BRAND (the 90% case) — edit exactly two files
- `src/theme.css` — colors, radius, font (CSS variables in `:root`).
- `src/brand.config.ts` — name, logo, tagline, greeting, locale/currency,
  feature toggles, explainer default. Zod-validated (`src/lib/brand-schema.ts`);
  a malformed edit fails `npx vitest run` with a readable error.

Nothing else. No component edits. The token guard
(`src/guards/theme-tokens.test.ts` + ESLint) fails the build if raw color
literals appear in `src/components`/`src/pages`.

### Path 2: EXTEND (when asked for new features/integrations)
- `src/features.tsx` — feature registry: routes + nav from one array.
  New page = new file in `src/pages/` + one entry here. A feature's `enabled`
  flag comes from `brand.config.ts` toggles.
- `src/integrations/index.ts` — named slots: `track`, `onSession`, `notify`,
  `resolveCustomerId`, `setCustomerId`. Fill bodies; never rename/remove exports.
- `src/explainers.ts` — "How it works" narration content; rewrite wording to the
  client's voice if asked.

New pages: read data via `useApp()` (`src/context/useApp.ts`), style with
semantic tokens only (`bg-background`, `text-muted-foreground`, `text-success`, …).

## Architecture (read-only zones)
- `src/data/types.ts` — domain types + the `DataSource` interface.
- `src/data/live/*` — Swipelux sandbox API surface. **DO NOT CHANGE.**
- `src/data/demo/*` — stateful demo data. Don't change unless asked to alter demo content.
- `src/data/mode.ts` — API-key handling. The key is the app's ONLY configuration.
- `src/data/tracked.ts` + `src/lib/events.ts` — action events that drive the explainer.
- `src/components/ui/*` — generated shadcn primitives. Restyle via tokens, not edits.

## Session entry (not authentication)
Live mode learns the customer id via `resolveCustomerId()`/`setCustomerId()`
(integration slots). The LiveEntry screen and Go-live dialog are session entry,
NOT auth. Do not wire passwords/OAuth here.

## House rules
- Stay self-contained: this repo + the live Swipelux API reference only
  (https://platform.swipelux.com/api-reference, https://docs.swipelux.com).
  If you need info that isn't here, ask the client.
- Work on a NEW git branch, never on `master`.
- Keep green: `npm run typecheck`, `npx vitest run`, `npm run lint`, `npm run build`.
- Do not modify `.env`. Do not add dependencies without need.
