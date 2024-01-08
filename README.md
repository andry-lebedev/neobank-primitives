# Swipelux Neobank Starter

A beautiful, working neobank you can run in 60 seconds — no configuration at all.
It opens on realistic demo data; pasting a Swipelux sandbox API key ("Go live"
button in the app) switches the same screens to the live API. An AI coding agent
can re-brand the whole thing into *your* product by editing two files.

## Run it

    git clone <repo-url> && cd neobank-starter
    npm install
    npm run dev

That's it. No `.env` needed. Demo mode is fully interactive: send money, add
funds, onboard a customer, watch transfers settle.

## See what Swipelux does underneath

Toggle **“How it works”** in the top bar. Every action narrates itself — quote
locked, compliance screened, stablecoin converted, payout sent — in product
terms, with links to the API docs.

## Go live

Click **Go live** in the demo banner and paste your Swipelux sandbox API key
(get one from the Swipelux team). The app validates it and switches to live
sandbox data. Optionally set `VITE_API_TOKEN` in `.env` instead (see
`.env.example`). The API key is the only configuration that exists.

## Make it yours (AI re-brand)

Open this repo in an AI coding agent (Claude Code, Cursor, Codex, …) and paste:

    Read AGENTS.md, then follow PROMPT.md to re-brand this neobank demo for me.
    I'm <Company>. [Optional: my website is <url> / brand notes: <colors, vibe, audience>]
    Derive my brand (or choose tastefully if I gave you little), apply it on a new git branch by
    editing only src/theme.css and src/brand.config.ts, keep all tests and the build green, then
    show me the result and what you chose.

No website? Describe your brand in a sentence — or give just the name and let
the agent propose something. Iterate in plain words afterwards.

Want more than a re-skin ("add a rewards page", "wire my analytics")? The agent
follows the extension path in `AGENTS.md` — feature registry + integration slots.

## Commands

    npm run dev          # start (demo mode without a key)
    npm run build        # production build (must pass)
    npm run typecheck    # tsc (must stay green)
    npx vitest run       # tests incl. brand-config + theme-token guards
    npm run lint         # eslint incl. the color-literal rule

## API reference

`src/data/live/*` wraps the Swipelux Wallet API. Live reference (do not bundle
specs into this repo): https://platform.swipelux.com/api-reference · Docs:
https://docs.swipelux.com
