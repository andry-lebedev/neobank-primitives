# Swipelux Neobank Starter — Self-Building Integration Kit

A working, API-driven neobank demo running on the Swipelux sandbox, structured so an AI agent can
re-skin it and wire it into a client's infrastructure by editing three well-defined seams — without
touching the integration surface or the data flow.

It serves two purposes at once:

1. A runnable reference neobank a client can evaluate.
2. A kit a client's own AI agent reshapes into a branded, integrated demo on the client's stack.

## Try it with Claude

[![Open in Claude](https://img.shields.io/badge/Open%20in-Claude-da7756?logo=anthropic&logoColor=white)](https://claude.ai/new?q=Clone%20the%20Swipelux%20neobank%20self-building%20integration%20kit%20from%20https%3A%2F%2Fgithub.com%2Fswipelux%2Fneobank-starter.git%20and%20cd%20into%20it.%20Then%20read%20AGENTS.md%20and%20follow%20PROMPT.md%20to%20tailor%20it%20for%20me%3A%20interview%20me%20one%20topic%20at%20a%20time%20%28brand%2C%20features%2C%20integrations%2C%20copy%29%2C%20write%20TAILORED-SPEC.md%2C%20and%20stop%20for%20my%20approval%20before%20writing%20any%20code.%20After%20I%20approve%2C%20build%20the%20tailored%20demo%20on%20a%20new%20git%20branch%20and%20keep%20%60npx%20vitest%20run%60%20green%20and%20%60npx%20vite%20build%60%20passing.%20Work%20only%20from%20this%20repository%20and%20the%20Swipelux%20API%20reference%20it%20links.)

The button opens Claude with the kickoff prompt below prefilled. Run it where Claude can clone and
build the repo (Claude Code, or a Claude session with shell access).

Kickoff prompt (clone-first):

```
Clone the Swipelux neobank self-building integration kit from
https://github.com/swipelux/neobank-starter.git and cd into it. Then read
AGENTS.md and follow PROMPT.md to tailor it for me: interview me one topic at a time (brand,
features, integrations, copy), write TAILORED-SPEC.md, and stop for my approval before writing any
code. After I approve, build the tailored demo on a new git branch and keep `npx vitest run` green
and `npx vite build` passing. Work only from this repository and the Swipelux API reference it
links.
```

Already cloned and working inside the repo? Skip the clone and use the prompt under
[Tailor it with an AI agent](#tailor-it-with-an-ai-agent).

## What the demo does

A mobile-style neobank front-end backed by the live Swipelux Wallet API (sandbox). Screens:

- Dashboard — balance, virtual account, recent activity.
- Send — bank payout and P2P wallet transfers, with quote and confirmation.
- Add money — SEPA / SWIFT / crypto deposit details.
- History — transfer list with status and detail view.
- Profile — customer, KYC status, wallet and account details.
- Onboarding — create customer, provision wallet and bank account.
- Login — session entry (enter an existing customer id). This is session entry, not real auth.

## Stack

React 19 + TypeScript + Vite + Tailwind 3 + React Router 7 + axios. Tests: Vitest. Lint: ESLint.

## Layout

```
AGENTS.md              Map for an AI agent: stack, layout, the three seams, house rules.
PROMPT.md              The tailoring wizard an agent follows (interview, then build).
TAILORED-SPEC.md       Template the wizard fills; the client approves it before any code.
tailwind.config.js     Seam 1 — theme tokens (brand, neutral, status colors + font).
src/brand.ts           Seam 1 — brand name + logo (single edit point).
src/features.ts        Seam 2 — feature registry (drives routes and bottom nav).
src/integrations/      Seam 3 — named integration slots (analytics, session, notify, customer id).
src/api/*              Swipelux Wallet API calls. The integration surface — do not change.
src/context/           AppContext loads data from the sandbox; pages read it via useApp().
src/pages/*            Screens.    src/components/*   Shared UI.
design-system/         Brand/design reference for this demo.
```

## Getting started

```bash
npm install
cp .env.example .env     # then fill in the values below
npm run dev              # start the demo against the Swipelux sandbox
```

`.env` keys:

- `VITE_API_URL` — Swipelux base URL (sandbox: `https://platform.sbx.swipelux.com`).
- `VITE_API_TOKEN` — your Swipelux API key.
- `VITE_CUSTOMER_ID` — optional; pre-load a customer id (otherwise use the Login screen).

Other commands:

```bash
npm run build      # production build (must pass)
npm run typecheck  # tsc --noEmit (must stay green)
npx vitest run     # tests (must stay green)
npm run lint       # ESLint, incl. the Seam-1 color-token guard
```

## The three seams

Tailoring happens at three edit points only. Everything else (`src/api/*`, AppContext data
binding, `.env`) stays on the Swipelux sandbox and must not change.

| Seam | File(s) | Edit to... |
|------|---------|------------|
| 1. Brand / theme | `tailwind.config.js` (colors + font), `src/brand.ts` (name + logo) | re-skin — zero component edits; a guard test + ESLint rule keep raw color literals out of components |
| 2. Features | `src/features.ts` | add or drop pages and bottom-nav tabs from one registry |
| 3. Integrations | `src/integrations/index.ts` | wire analytics (`track`), session (`onSession`), notifications (`notify`), and customer id (`resolveCustomerId` / `setCustomerId`) |

## Tailor it with an AI agent

The kit is built to be driven by an AI coding agent (Claude Code, Cursor, Codex, etc.). It works
only from this repository plus the Swipelux API reference — it does not reach into any other docs
or workspace.

1. Open this repo in your AI coding tool.
2. Paste the prompt below to start. The agent interviews you, writes `TAILORED-SPEC.md`, and stops
   for your approval before writing any code.
3. Approve the spec. The agent then builds the tailored demo on a new git branch and hands back the
   running app plus the diff.

Kickoff prompt:

```
You are tailoring this Swipelux neobank demo for me (the client). Read AGENTS.md first, then
follow PROMPT.md exactly.

Phase 1: interview me one topic at a time — brand (name, logo, colors, font), which features to
keep/drop/add, which integration slots to wire and to what, and any copy or locale changes. Wait
for each answer before the next question.

Phase 2: fill in TAILORED-SPEC.md from my answers and STOP. Do not write any code until I approve
the spec.

Phase 3 (only after I approve): create a new git branch and apply the changes against the three
seams only (tailwind.config.js + src/brand.ts, src/features.ts, src/integrations/index.ts). Keep
`npx vitest run` green and `npx vite build` passing. Do not touch src/api/*, the AppContext data
binding, or .env.

Work only from this repository and the Swipelux API reference linked in AGENTS.md. If you need
information that is not in this repo, ask me.
```

To re-skin without the full interview, a shorter ask also works, for example: "Re-skin this demo
for <Company>: primary color <hex>, accent <hex>, logo at <path>, name <Company>. Edit only Seam 1
(`tailwind.config.js` + `src/brand.ts`). Keep tests and build green."

## API reference

`src/api/*` already wraps the Swipelux Wallet API, so you do not need the raw spec to tailor the
demo. If you extend it, use the live reference — do not bundle a spec file into the repo:

- API reference (OpenAPI): https://platform.swipelux.com/api-reference
- Docs: https://docs.swipelux.com
