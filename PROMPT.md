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
   - `setCustomerId` → where should the resolved id be persisted — their session store or the default `localStorage`?
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
