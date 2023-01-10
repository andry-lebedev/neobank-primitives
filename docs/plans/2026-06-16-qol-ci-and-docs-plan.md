# QoL: CI + docs-restore Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a single-file GitHub Actions PR quality guard (typecheck/lint/test/build + a blocking cognitive-complexity/MI gate on changed files) and restore the tracked design/plan docs that currently live only in `feat/v2-rebuild`.

**Architecture:** One workflow file runs the four existing npm scripts then a complexity gate. The gate is a bash script that diffs the PR's changed `src/` TypeScript files and runs two sub-checks — per-function cognitive complexity ≤ 15 (ESLint + `eslint-plugin-sonarjs`) and per-file Maintainability Index ≥ 75 (`typhonjs-escomplex`). Because the gate only inspects files changed in a PR, existing code is grandfathered. Docs restore is a `git checkout` from the sibling branch.

**Tech Stack:** GitHub Actions, Node 22, npm, ESLint 10 (flat config), `eslint-plugin-sonarjs@^4.0.3`, `typhonjs-escomplex@^0.1.0`, TypeScript compiler API (already present).

**Branch:** `feat/QoL` (already created off `master`; `.gitignore` already relaxed to `docs/superpowers/`; design spec already committed at `docs/2026-06-16-qol-ci-and-docs-design.md`).

---

### Task 1: Restore design/plan docs from `feat/v2-rebuild`

Independent, fast, no code. Do it first.

**Files:**
- Restore: `docs/2026-06-13-starter-rethink-design.md`
- Restore: `docs/plans/2026-06-13-v2-rebuild.md`
- Restore: `docs/plans/2026-06-13-review-findings.md`

- [ ] **Step 1: Pull the three files from the sibling branch into the working tree**

```bash
git checkout feat/v2-rebuild -- \
  docs/2026-06-13-starter-rethink-design.md \
  docs/plans/2026-06-13-v2-rebuild.md \
  docs/plans/2026-06-13-review-findings.md
```

- [ ] **Step 2: Verify all three are now staged and tracked**

Run: `git status -s docs && git ls-files docs`
Expected: the three restored paths appear (status `A`), alongside the already-tracked `docs/2026-06-16-qol-ci-and-docs-design.md` and this plan once committed. No `docs/superpowers/` paths appear.

- [ ] **Step 3: Commit**

```bash
git add docs/2026-06-13-starter-rethink-design.md docs/plans/2026-06-13-v2-rebuild.md docs/plans/2026-06-13-review-findings.md
git commit -m "docs(qol): restore v2 design + plan docs onto main line"
```

---

### Task 2: Add gate dependencies + Maintainability-Index gate script

**Files:**
- Modify: `package.json` (devDependencies)
- Modify: `package-lock.json` (generated)
- Create: `scripts/ci/mi-gate.mjs`

- [ ] **Step 1: Install the two new devDependencies**

```bash
npm install -D eslint-plugin-sonarjs@^4.0.3 typhonjs-escomplex@^0.1.0
```

- [ ] **Step 2: Verify they resolved against ESLint 10 with no peer error**

Run: `npm ls eslint-plugin-sonarjs typhonjs-escomplex`
Expected: both listed with no `UNMET PEER DEPENDENCY` / `invalid` lines. (`eslint-plugin-sonarjs@4.0.3` declares peer `eslint: ^8 || ^9 || ^10`.)

- [ ] **Step 3: Create `scripts/ci/mi-gate.mjs`**

```js
#!/usr/bin/env node
// Per-file Maintainability Index gate.
//
// Strips TypeScript types via the compiler API, then runs typhonjs-escomplex
// over the resulting ES module to obtain Halstead V + cyclomatic + SLoC -> MI
// on the Microsoft 0-100 scale.
//
// Usage:
//   node scripts/ci/mi-gate.mjs <file.ts> [file.ts ...]
//
// Env:
//   MIN_MI   default 75. Per-file MI floor.
//   FORMAT   "table" (default) or "json".
//
// Exit codes:
//   0  every file passes
//   1  at least one file is below MIN_MI

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import escomplex from "typhonjs-escomplex";
import ts from "typescript";

const MIN_MI = Number(process.env.MIN_MI ?? 75);
const FORMAT = process.env.FORMAT ?? "table";

function stripTypes(source) {
  return ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.Preserve,
    },
  }).outputText;
}

function analyze(filePath) {
  const source = readFileSync(filePath, "utf8");
  const js = stripTypes(source);
  const report = escomplex.analyzeModule(js);
  return {
    file: filePath,
    mi: Number(report.maintainability.toFixed(1)),
    sloc: report.aggregate.sloc.physical,
    cyclomatic: report.aggregate.cyclomatic,
  };
}

const files = process.argv.slice(2).filter((f) => existsSync(resolve(f)));
if (files.length === 0) {
  console.log("mi-gate: no files to check");
  process.exit(0);
}

const results = [];
for (const f of files) {
  try {
    results.push(analyze(f));
  } catch (err) {
    console.error(`mi-gate: failed to analyze ${f}: ${err.message}`);
    process.exit(1);
  }
}

const failures = results.filter((r) => r.mi < MIN_MI);

if (FORMAT === "json") {
  console.log(JSON.stringify({ minMi: MIN_MI, results, failures }, null, 2));
} else {
  const w = Math.max(...results.map((r) => r.file.length));
  for (const r of results) {
    const flag = r.mi < MIN_MI ? " ✗" : "";
    console.log(
      `${r.file.padEnd(w)}  MI=${String(r.mi).padStart(5)}  SLoC=${String(r.sloc).padStart(4)}  CC=${String(r.cyclomatic).padStart(3)}${flag}`,
    );
  }
}

if (failures.length > 0) {
  console.error(`\nFAIL: ${failures.length} file(s) below MI ${MIN_MI}:`);
  for (const f of failures) {
    console.error(`  ${f.file}  MI=${f.mi}`);
  }
  console.error(
    `\nLower per-file maintainability is usually driven by length, deep nesting, or many branches per function.`,
  );
  console.error(
    `Either split the file (preferred — extract a sibling module) or simplify the densest functions.`,
  );
  process.exit(1);
}

console.log(`\nOK: all ${results.length} file(s) ≥ MI ${MIN_MI}.`);
```

- [ ] **Step 4: Verify the MI gate runs against a real source file**

Run: `node scripts/ci/mi-gate.mjs src/main.tsx`
Expected: one line like `src/main.tsx  MI=...  SLoC=...  CC=...` followed by `OK: all 1 file(s) ≥ MI 75.`, exit 0. (`src/main.tsx` is a 10-line entry file, well above the floor.)

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json scripts/ci/mi-gate.mjs
git commit -m "ci(qol): add MI gate script + sonarjs/escomplex devdeps"
```

---

### Task 3: Add the cognitive-complexity ESLint config

**Files:**
- Create: `eslint.cognitive.config.mjs`

- [ ] **Step 1: Create `eslint.cognitive.config.mjs`**

```js
// Single-purpose ESLint flat config for the cognitive-complexity gate.
// Not the day-to-day linter (eslint.config.js does that) — only the CI
// quality gate. Threshold 15 is Sonar's default.

import sonarjs from "eslint-plugin-sonarjs";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { parser: tsParser },
    plugins: { sonarjs },
    rules: {
      "sonarjs/cognitive-complexity": ["error", 15],
    },
  },
];
```

- [ ] **Step 2: Verify the config runs against a real source file**

Run: `npx --no-install eslint --config eslint.cognitive.config.mjs --no-warn-ignored src/main.tsx`
Expected: no output and exit 0 (the entry file has no function over cognitive complexity 15). If ESLint complains the config is invalid, fix the import before continuing.

- [ ] **Step 3: Commit**

```bash
git add eslint.cognitive.config.mjs
git commit -m "ci(qol): add cognitive-complexity gate config (sonarjs, <=15)"
```

---

### Task 4: Add the complexity-gate runner + `gate` npm script

**Files:**
- Create: `scripts/ci/complexity-gate.sh`
- Modify: `package.json` (scripts)

- [ ] **Step 1: Create `scripts/ci/complexity-gate.sh`**

```bash
#!/usr/bin/env bash
# Quality gate for changed production TypeScript files.
#
# Two checks, run cheapest-signal-first:
#   1. Per-function cognitive complexity <= 15 (Sonar default) via
#      eslint-plugin-sonarjs (eslint.cognitive.config.mjs).
#   2. Per-file Maintainability Index >= MIN_MI (default 75) via
#      scripts/ci/mi-gate.mjs.
#
# Scope: files that exist post-change under src/ (tests excluded).
#
# Env:
#   BASE_SHA, HEAD_SHA   git refs to diff (CI sets these from PR base/head).
#   MIN_MI               default 75. Per-file MI floor.

set -euo pipefail

BASE_SHA="${BASE_SHA:-origin/master}"
HEAD_SHA="${HEAD_SHA:-HEAD}"
MIN_MI="${MIN_MI:-75}"

# Production code only. Tests are excluded — the gate measures behavioural code.
CHANGED_LIST=$(
  git diff --name-only --diff-filter=AM "$BASE_SHA" "$HEAD_SHA" -- \
    'src/**/*.ts' 'src/**/*.tsx' \
    ':(exclude)src/**/*.spec.ts' \
    ':(exclude)src/**/*.test.ts' \
    ':(exclude)src/**/*.spec.tsx' \
    ':(exclude)src/**/*.test.tsx'
)

if [ -z "$CHANGED_LIST" ]; then
  echo "complexity-gate: no production TS files changed — skipping"
  exit 0
fi

CHANGED_COUNT=$(echo "$CHANGED_LIST" | wc -l | tr -d ' ')
echo "complexity-gate: checking ${CHANGED_COUNT} file(s)"
echo "$CHANGED_LIST" | sed 's/^/  /'
echo

# IFS=newline so the unquoted "$CHANGED_LIST" expands to one arg per file.
IFS=$'\n'
# shellcheck disable=SC2086
set -- $CHANGED_LIST
unset IFS

FAILED=0

echo "── per-function cognitive complexity (≤ 15) ──"
if ! npx --no-install eslint --config eslint.cognitive.config.mjs --no-warn-ignored "$@"; then
  FAILED=1
fi
echo

echo "── per-file Maintainability Index (≥ ${MIN_MI}) ──"
if ! MIN_MI="$MIN_MI" node scripts/ci/mi-gate.mjs "$@"; then
  FAILED=1
fi

if [ "$FAILED" -ne 0 ]; then
  echo
  echo "complexity-gate: FAIL — see violations above."
  echo "Split the file or extract dense functions to reduce per-function cognitive load and raise file MI."
  exit 1
fi

echo
echo "complexity-gate: OK"
```

- [ ] **Step 2: Make the script executable**

```bash
chmod +x scripts/ci/complexity-gate.sh
```

- [ ] **Step 3: Add the `gate` script to `package.json`**

In the `"scripts"` block, add the `gate` entry after `"test"`:

```json
    "test": "vitest run",
    "gate": "bash scripts/ci/complexity-gate.sh",
    "preview": "vite preview"
```

- [ ] **Step 4: Verify the gate's no-change skip path**

Run: `BASE_SHA=HEAD HEAD_SHA=HEAD npm run gate`
Expected: `complexity-gate: no production TS files changed — skipping`, exit 0. (Diffing a ref against itself yields no changed files — proves the wiring without depending on `origin/master`.)

- [ ] **Step 5: Verify the gate's check path runs the two sub-gates on a real file**

The runner's check path shells out to the cognitive config and the MI gate. Invoke both directly on a real production file to confirm they execute:

```bash
npx --no-install eslint --config eslint.cognitive.config.mjs --no-warn-ignored src/explainers.ts && node scripts/ci/mi-gate.mjs src/explainers.ts
```
Expected: cognitive check passes (exit 0, no output) and the MI gate prints a `src/explainers.ts  MI=...` line. This confirms both sub-gates the runner calls actually execute. (The runner's own changed-file selection is already proven by Step 4's skip path.)

- [ ] **Step 6: Commit**

```bash
git add scripts/ci/complexity-gate.sh package.json
git commit -m "ci(qol): add changed-file complexity gate runner + npm script"
```

---

### Task 5: Add the GitHub Actions workflow

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  pull_request:
    branches: [master]
    types: [opened, synchronize, reopened]

concurrency:
  group: ci-${{ github.head_ref }}
  cancel-in-progress: true

permissions:
  contents: read

jobs:
  quality:
    name: Quality guard
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          # Full history so the complexity gate can diff base..head.
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Typecheck
        run: npm run typecheck

      - name: Lint
        run: npm run lint

      - name: Test
        run: npm test

      - name: Build
        run: npm run build

      - name: Complexity gate
        env:
          BASE_SHA: ${{ github.event.pull_request.base.sha }}
          HEAD_SHA: ${{ github.event.pull_request.head.sha }}
        run: npm run gate
```

- [ ] **Step 2: Verify the YAML is well-formed**

Run: `node -e "const fs=require('fs');const s=fs.readFileSync('.github/workflows/ci.yml','utf8');if(!/jobs:\s/.test(s)||!/pull_request:/.test(s))throw new Error('bad workflow');console.log('workflow shape ok')"`
Expected: `workflow shape ok`. (If `actionlint` is installed, also run `actionlint .github/workflows/ci.yml` and expect no errors.)

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci(qol): add PR quality-guard workflow (typecheck/lint/test/build/gate)"
```

---

### Task 6: Full local dry run

Confirms every step a PR will run is green locally before the workflow is exercised on GitHub.

- [ ] **Step 1: Run the exact sequence the workflow runs**

```bash
npm run typecheck && npm run lint && npm test && npm run build && BASE_SHA=HEAD HEAD_SHA=HEAD npm run gate
```
Expected: typecheck exit 0; lint exit 0 (4 warnings allowed, 0 errors); 59 tests pass; build succeeds; gate prints the skip line. Overall exit 0.

- [ ] **Step 2: Confirm the branch is clean and all deliverables are committed**

Run: `git status -s && git log --oneline master..feat/QoL`
Expected: clean working tree; commits for the spec, docs restore, MI gate + deps, cognitive config, gate runner, and workflow.

- [ ] **Step 3 (manual, out of band):** Open a PR from `feat/QoL` → `master` on GitHub to exercise the workflow end-to-end. The user merges; this plan does not push or open the PR.

---

## Notes for the implementer

- The complexity gate is **blocking** and inspects **only files changed in the PR**, so it cannot retroactively fail existing `src/`.
- Do not add a sticky PR comment, deploy step, or the sonarjs "smells" preset — all explicitly out of scope.
- The git pathspec `src/**/*.ts` relies on git's wildmatch (same pattern the sibling `wallet-infrastructure` gate uses with `app/**`); `**` matches zero-or-more directories.
- ESLint `--config <file>` uses only that file, bypassing `eslint.config.js`, so the cognitive config stays isolated from day-to-day lint.
