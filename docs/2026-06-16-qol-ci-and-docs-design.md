# QoL: GitHub Actions CI + docs restore — design

**Date:** 2026-06-16
**Branch:** `feat/QoL` (off `master`)
**Status:** approved

## Goal

Two quality-of-life improvements, modelled on the sibling repos (`wallet-infrastructure`,
`mpanel`, `ops-dashboard`) but **deliberately simpler**:

1. A GitHub Actions PR quality guard so every PR to `master` is typechecked, linted, tested,
   built, and complexity-gated before merge.
2. Restore the tracked design/plan docs that currently live only in `feat/v2-rebuild`, so
   specs and plans travel with the repo on the main line too.

## Non-goals

- No deploy / preview pipeline (no Vercel/Azure/Pages coupling, no secrets).
- No env-sync or e2e workflows (siblings have them; out of scope here).
- No sticky PR comment (gate output stays in the job log).
- No retro-fixing existing `src/` to satisfy the gate — the gate only checks files changed in
  a PR, so existing code is grandfathered.

## Baseline (verified 2026-06-16)

All four standard checks are green on `master` today, so CI is green on day one:

| Check     | Command                  | Result                  |
| --------- | ------------------------ | ----------------------- |
| typecheck | `tsc -b --noEmit`        | pass                    |
| lint      | `eslint .`               | pass (4 warnings, 0 err)|
| test      | `vitest run`             | 59 passed / 23 files    |
| build     | `tsc -b && vite build`   | pass                    |

The repo uses **npm** (`package-lock.json`) and **Vite** with source under `src/` — unlike the
siblings, which use pnpm and Next.js `app/`. The port adapts for both.

## Component 1 — `.github/workflows/ci.yml`

Single workflow, single job. The "simpler than siblings" shape: one file (siblings have 3–5),
npm not pnpm, no deploy/env/e2e/comment machinery.

- **Trigger:** `pull_request` targeting `master` (types: opened, synchronize, reopened). No
  `push` trigger — direct pushes are not gated, and the complexity gate needs a PR base/head
  diff to compute changed files.
- **Concurrency:** group by head ref, `cancel-in-progress: true`.
- **Permissions:** `contents: read` only.
- **Runner:** `ubuntu-latest`, Node 22, `actions/checkout@v4` with `fetch-depth: 0` (the gate
  diffs base..head), `actions/setup-node@v4` with npm cache, `npm ci`.
- **Steps, ordered cheap → expensive (fail fast):**
  1. `npm run typecheck`
  2. `npm run lint`
  3. `npm test`
  4. `npm run build`
  5. `npm run gate` — complexity gate (Component 2), with `BASE_SHA` / `HEAD_SHA` wired from
     `github.event.pull_request.base.sha` / `head.sha`.

## Component 2 — complexity gate

Ported from `wallet-infrastructure` and **trimmed to two sub-checks** (the siblings run three;
we drop the ~200-rule `eslint-plugin-sonarjs` "smells" preset to keep noise down). Blocking:
a failure fails the PR check.

### `scripts/ci/complexity-gate.sh`

- Computes the changed-file list with
  `git diff --name-only --diff-filter=AM "$BASE_SHA" "$HEAD_SHA"` scoped to
  `:(glob)src/**/*.ts` and `:(glob)src/**/*.tsx`, excluding `*.test.ts(x)`,
  `*.spec.ts(x)`, and `*.d.ts`. The `:(glob)` magic is required so `**` matches
  zero-or-more directories and top-level files (`src/App.tsx`) are not skipped.
- If no production files changed → print a skip line, exit 0.
- Otherwise runs both sub-gates over the changed files and fails (exit 1) if either fails.
- Env: `BASE_SHA` (default `origin/master`), `HEAD_SHA` (default `HEAD`), `MIN_MI` (default 75).

### `eslint.cognitive.config.mjs`

Single-purpose flat config used only by the gate (not day-to-day lint):

```js
import sonarjs from "eslint-plugin-sonarjs";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { parser: tsParser },
    plugins: { sonarjs },
    rules: { "sonarjs/cognitive-complexity": ["error", 15] },
  },
];
```

Invoked as `npx --no-install eslint --config eslint.cognitive.config.mjs --no-warn-ignored <files>`.

### `scripts/ci/mi-gate.mjs`

Ported from the sibling (already path-agnostic). Strips TS types via the compiler API, runs
`typhonjs-escomplex` per file, fails any file with Maintainability Index < `MIN_MI`. escomplex
returns the original SEI Maintainability Index (uncapped, ~0–171), so the 75 floor is applied on
that scale and simple files routinely score above 100. Invoked as
`MIN_MI=75 node scripts/ci/mi-gate.mjs <files>`.

### `package.json`

- New script: `"gate": "bash scripts/ci/complexity-gate.sh"`.
- New devDependencies: `eslint-plugin-sonarjs`, `typhonjs-escomplex`, and an explicit
  `@typescript-eslint/parser` (the cognitive config imports it directly, so it should not be
  left as a transitive-only dep of `typescript-eslint`). `typescript` is already present.

## Component 3 — docs restore

- `.gitignore`: change the `docs/` ignore to `docs/superpowers/` (mirrors `feat/v2-rebuild`),
  so tracked design/plan docs live under `docs/` while internal superpowers history stays
  ignored. `.claude/` stays ignored. **(Already applied on `feat/QoL` to host this spec.)**
- Restore three tracked files from `feat/v2-rebuild`:
  - `docs/2026-06-13-starter-rethink-design.md`
  - `docs/plans/2026-06-13-v2-rebuild.md`
  - `docs/plans/2026-06-13-review-findings.md`

  via `git checkout feat/v2-rebuild -- <paths>`.

## Component 4 — spec/plan location convention

This QoL spec and its implementation plan are tracked under `docs/` (not the gitignored
`docs/superpowers/`), matching the restored docs. The implementation plan lands at
`docs/plans/2026-06-16-qol-ci-and-docs-plan.md`.

## Verification

- Workflow YAML parses (e.g. `actionlint` or a no-op push to a throwaway PR).
- `npm run gate` runs locally green against the current tree (no changed prod files → skips, or
  passes on a trivial change).
- `npm ci && npm run typecheck && npm run lint && npm test && npm run build` all green after
  the new devDeps land.
- The three restored docs are tracked (`git ls-files docs`) and render.

## Risks / notes

- New devDeps must resolve against ESLint 10 flat config. `eslint-plugin-sonarjs` supports flat
  config; pin a version that lists ESLint 10 as a peer. Verify on install.
- The gate is blocking but changed-files-only, so it cannot retroactively fail unrelated code.
- `feat/QoL` is based on `master`, which has diverged from `feat/v2-rebuild`; only the three doc
  files are pulled across, not any v2 app code.
