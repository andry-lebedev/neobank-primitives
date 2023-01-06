# Seam 1 Neutral Tokens + Kit Docs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the Seam 1 leak by tokenizing the neutral (gray/white) text ramp so a client re-skin needs zero component edits, add a guard test that bans raw color literals, and fix the kit docs (README + wizard drift).

**Architecture:** Add semantic neutral tokens to `tailwind.config.js`, mechanically swap every raw `*-gray-*` / `text-white` class in components/pages for those tokens, and lock it in with a vitest guard that scans `src/` for forbidden color literals (DevPanel exempt). Then rewrite the boilerplate README into a kit front-door and patch the `setCustomerId` slot drift in `PROMPT.md` / `TAILORED-SPEC.md` / `AGENTS.md`.

**Tech Stack:** React 19, Vite, Tailwind 3, Vitest. No new dependencies.

**Context for the implementer (zero-context safe):**
- This repo is a "self-building integration kit". Seam 1 = theme tokens in `tailwind.config.js`. Rule (AGENTS.md): components must NOT contain raw color literals; only semantic Tailwind tokens.
- Status colors (`success/danger/info/warning`) and surfaces (`base/card/card-hover/accent`) are ALREADY tokenized. The ONLY leak is the neutral ramp: `text-white` and `text-gray-200/300/400/500/600`, `placeholder-gray-600`, `bg-gray-500/20`.
- `DevPanel.jsx` is the documented exception (internal dev tool) — never edit it for color, and the guard test must skip it.
- Verified inventory (outside DevPanel/tests): `text-gray-500`×69, `text-white`×56, `text-gray-400`×33, `text-gray-300`×21, `text-gray-200`×19, `placeholder-gray-600`×14, `text-gray-600`×5, `bg-gray-500/20`×3. No `green/red/blue/purple/...` status literals leak — already clean.

**Token mapping (memorize — used in Tasks 1 & 3):**

| Raw class | Hex (Tailwind default) | New token class |
|-----------|------------------------|-----------------|
| `text-white` | `#FFFFFF` | `text-fg-strong` |
| `text-gray-200` | `#E5E7EB` | `text-fg` |
| `text-gray-300` | `#D1D5DB` | `text-fg-muted` |
| `text-gray-400` | `#9CA3AF` | `text-muted` (already exists) |
| `text-gray-500` | `#6B7280` | `text-subtle` |
| `text-gray-600` | `#4B5563` | `text-faint` |
| `placeholder-gray-600` | `#4B5563` | `placeholder-faint` |
| `bg-gray-500/20` | `#6B7280` @ 20% | `bg-subtle/20` |

Hex values are chosen to equal the Tailwind defaults being replaced → **pixel-identical demo after the swap** (the parity requirement from the design spec).

---

## File Structure

- **Modify** `tailwind.config.js` — add neutral token block (Task 1).
- **Create** `src/theme-tokens.test.js` — guard test scanning `src/` for raw color literals (Task 2).
- **Modify** all component/page files containing neutral literals (Task 3): `src/App.jsx`, `src/components/{Badge,BottomNav,Button,CopyField,Skeleton,Toast,TransactionRow}.jsx`, `src/pages/{AddMoney,Dashboard,History,Login,Onboarding,Profile,Send}.jsx`. (DevPanel.jsx intentionally untouched.)
- **Modify** `README.md` — kit front-door rewrite (Task 4).
- **Modify** `AGENTS.md`, `PROMPT.md`, `TAILORED-SPEC.md` — neutral tokens doc + `setCustomerId` drift fix (Task 5).

---

## Task 1: Add neutral semantic tokens

**Files:**
- Modify: `tailwind.config.js:6-19` (the `colors` block)

- [ ] **Step 1: Replace the `colors` block with the neutral-aware version**

Replace the existing `colors: { ... }` object (currently lines 6–19) with exactly:

```js
      colors: {
        base: '#111827',
        card: '#1F2937',
        'card-hover': '#374151',
        accent: {
          DEFAULT: '#F97316',
          hover: '#EA6C0A',
        },
        // Neutral text ramp — semantic emphasis levels (Seam 1).
        // Components use these, never raw `*-gray-*` or `text-white`.
        'fg-strong': '#FFFFFF',
        fg: '#E5E7EB',
        'fg-muted': '#D1D5DB',
        muted: '#9CA3AF',
        subtle: '#6B7280',
        faint: '#4B5563',
        success: '#22C55E',
        danger: '#EF4444',
        info: '#3B82F6',
        warning: '#F59E0B',
      },
```

- [ ] **Step 2: Verify build still passes (demo unchanged — tokens defined but not yet used)**

Run: `npx vite build`
Expected: `✓ built in ...` with no errors.

- [ ] **Step 3: Commit**

```bash
git add tailwind.config.js
git commit -m "feat(theme): add neutral semantic tokens (Seam 1)"
```

---

## Task 2: Guard test banning raw color literals

**Files:**
- Create: `src/theme-tokens.test.js`

- [ ] **Step 1: Write the failing guard test**

Create `src/theme-tokens.test.js` with exactly:

```js
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

// Seam 1 guard: components must use semantic tokens, never raw color literals.
// DevPanel is the documented exception (internal dev tool, not client surface).
const SRC = dirname(fileURLToPath(import.meta.url))
const EXEMPT = new Set(['DevPanel.jsx'])

const FORBIDDEN = [
  // Tailwind color-scale utilities: text-gray-500, bg-purple-500/20, placeholder-gray-600, ...
  /\b(?:text|bg|border|ring|from|to|via|divide|placeholder|fill|stroke|outline|shadow|ring-offset)-(?:gray|slate|zinc|neutral|stone|green|red|blue|purple|amber|yellow|emerald|orange|teal|cyan|pink|indigo|violet|rose|lime|sky|fuchsia)-\d/,
  // Bare white/black utilities: text-white, bg-black, border-white
  /\b(?:text|bg|border|ring|placeholder|fill|stroke|divide)-(?:white|black)\b/,
  // Arbitrary hex values in classes: bg-[#0F172A]
  /-\[#[0-9a-fA-F]{3,8}\]/,
]

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name)
    return e.isDirectory() ? walk(p) : [p]
  })
}

const files = walk(SRC).filter(
  (p) =>
    /\.jsx?$/.test(p) &&
    !/\.test\.jsx?$/.test(p) &&
    !EXEMPT.has(p.split('/').pop()),
)

describe('Seam 1 — no raw color literals in src', () => {
  for (const file of files) {
    const rel = file.slice(SRC.length + 1)
    it(`${rel} uses only semantic tokens`, () => {
      const src = readFileSync(file, 'utf8')
      const hits = []
      for (const re of FORBIDDEN) {
        const g = new RegExp(re, 'g')
        let m
        while ((m = g.exec(src))) hits.push(m[0])
      }
      expect(hits).toEqual([])
    })
  }
})
```

- [ ] **Step 2: Run the guard test to verify it FAILS**

Run: `npx vitest run src/theme-tokens.test.js`
Expected: FAIL — multiple files (e.g. `pages/Send.jsx`, `pages/Dashboard.jsx`, `components/Badge.jsx`) report `text-gray-*` / `text-white` hits in the `expect(hits).toEqual([])` assertion. (This proves the guard works; the swap in Task 3 turns it green.)

- [ ] **Step 3: Commit**

```bash
git add src/theme-tokens.test.js
git commit -m "test(theme): guard against raw color literals in src (Seam 1)"
```

---

## Task 3: Swap raw neutral classes for tokens

**Files (modify — DevPanel.jsx and *.test.* excluded):**
`src/App.jsx`, `src/components/Badge.jsx`, `src/components/BottomNav.jsx`, `src/components/Button.jsx`, `src/components/CopyField.jsx`, `src/components/Skeleton.jsx`, `src/components/Toast.jsx`, `src/components/TransactionRow.jsx`, `src/pages/AddMoney.jsx`, `src/pages/Dashboard.jsx`, `src/pages/History.jsx`, `src/pages/Login.jsx`, `src/pages/Onboarding.jsx`, `src/pages/Profile.jsx`, `src/pages/Send.jsx`

- [ ] **Step 1: Apply the mechanical token swap**

Run exactly (word-boundary anchored; processes every `.jsx`/`.js` in `src/` except DevPanel and test files):

```bash
for f in $(find src \( -name '*.jsx' -o -name '*.js' \) | grep -v DevPanel.jsx | grep -vE '\.test\.'); do
  sed -i \
    -e 's/\btext-white\b/text-fg-strong/g' \
    -e 's/\btext-gray-200\b/text-fg/g' \
    -e 's/\btext-gray-300\b/text-fg-muted/g' \
    -e 's/\btext-gray-400\b/text-muted/g' \
    -e 's/\btext-gray-500\b/text-subtle/g' \
    -e 's/\btext-gray-600\b/text-faint/g' \
    -e 's/\bplaceholder-gray-600\b/placeholder-faint/g' \
    -e 's/\bbg-gray-500\b/bg-subtle/g' \
    "$f"
done
```

Note: `hover:text-gray-300`, `group-open:`, and `/20` opacity suffixes are handled automatically — `sed` matches the inner class substring, and `bg-gray-500/20` becomes `bg-subtle/20` because `\bbg-gray-500\b` matches up to the `/`.

- [ ] **Step 2: Run the guard test — now PASSES**

Run: `npx vitest run src/theme-tokens.test.js`
Expected: PASS — every file reports `uses only semantic tokens`.

- [ ] **Step 3: Confirm no neutral literals remain (belt-and-suspenders)**

Run: `grep -rnE '(text|bg|border|placeholder)-(gray|white)' src --include='*.jsx' --include='*.js' | grep -v DevPanel.jsx | grep -vE '\.test\.'`
Expected: no output.

- [ ] **Step 4: Full test suite + build stay green (visual parity)**

Run: `npx vitest run && npx vite build`
Expected: all suites PASS (49 prior + new guard cases), build `✓ built`.

- [ ] **Step 5: Commit**

```bash
git add src
git commit -m "refactor(theme): route neutral classes through semantic tokens (Seam 1)"
```

---

## Task 4: Rewrite README as the kit front-door

**Files:**
- Modify: `README.md` (replace entire file — currently default Vite boilerplate)

- [ ] **Step 1: Replace README.md contents entirely with**

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: rewrite README as self-building kit front-door"
```

---

## Task 5: Doc updates — neutral tokens + `setCustomerId` drift

**Files:**
- Modify: `AGENTS.md` (Seam 1 section)
- Modify: `PROMPT.md` (Phase 1 integrations list)
- Modify: `TAILORED-SPEC.md` (integrations table)

- [ ] **Step 1: Update AGENTS.md Seam 1 to document the neutral ramp + ban**

In `AGENTS.md`, replace the Seam 1 body paragraph (the one starting "All brand + status colors are Tailwind tokens:" and ending "...internal dev tool, not client-facing surface.") with exactly:

```markdown
All brand, neutral, and status colors are Tailwind tokens. Brand/surface: `accent`
(+`accent.hover`), `base`, `card`, `card-hover`. Neutral text ramp (high→low emphasis):
`fg-strong`, `fg`, `fg-muted`, `muted`, `subtle`, `faint`. Status: `success`, `danger`, `info`,
`warning`. Re-skin = edit the `colors` block and swap the brand name/logo — **zero component
edits**. Do NOT reintroduce raw hex (`bg-[#...]`), color-scale literals (`text-gray-500`,
`text-green-400`), or bare `text-white`/`bg-black` in components — the `src/theme-tokens.test.js`
guard fails the build if you do. Exception: `DevPanel.jsx` keeps `purple-*`/`gray-*`/`#0F172A` —
it is an internal dev tool, not client-facing surface, and is exempt from the guard.
```

- [ ] **Step 2: Add `setCustomerId` to the PROMPT.md interview**

In `PROMPT.md`, under Phase 1 item 3 (Integrations), after the `resolveCustomerId` bullet
(`- \`resolveCustomerId\` → how is the customer id obtained in their app?`), add exactly:

```markdown
   - `setCustomerId` → where should the resolved id be persisted — their session store or the default `localStorage`?
```

- [ ] **Step 3: Add `setCustomerId` row to the TAILORED-SPEC.md template**

In `TAILORED-SPEC.md`, in the Integrations table, after the `resolveCustomerId` row
(`| \`resolveCustomerId\` | <source> | |`), add exactly:

```markdown
| `setCustomerId` | <session store / localStorage default> | |
```

- [ ] **Step 4: Verify nothing broke**

Run: `npx vitest run && npx vite build`
Expected: all PASS, build `✓ built`.

- [ ] **Step 5: Commit**

```bash
git add AGENTS.md PROMPT.md TAILORED-SPEC.md
git commit -m "docs: document neutral tokens + setCustomerId slot in kit docs"
```

---

## Self-Review

**Spec coverage:**
- Seam 1 leak (neutral ramp) → Tasks 1 + 3. ✅
- Badge.jsx `bg-gray-500/20` status literal → folded into Task 3 swap (`bg-subtle/20`). ✅
- README boilerplate → Task 4. ✅
- `setCustomerId` wizard drift (PROMPT + TAILORED-SPEC) → Task 5. ✅
- Guard so the leak can't reopen → Task 2. ✅
- Out of scope (not in this plan, by design): the locked-non-goal deviation (Login/CustomerGate identity surface) — that's a design-doc decision, not a code fix; raise separately. `api-docs/` untracked dir — housekeeping, decide commit vs gitignore separately.

**Placeholder scan:** none — every step has exact code/commands.

**Type/name consistency:** token names (`fg-strong`, `fg`, `fg-muted`, `muted`, `subtle`, `faint`) defined in Task 1 match the swap targets in Task 3 and the doc in Task 5. Hex values match Tailwind defaults → visual parity preserved.
