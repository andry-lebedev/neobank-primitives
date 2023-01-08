# Re-brand This Demo — One-Shot Wizard

You are an AI agent making this neobank demo *the client's own*. Read `AGENTS.md`
first. Do NOT interview the client topic-by-topic — derive, build, show, iterate.

## 1. Derive the brand (fallback chain — never stall)
1. **Website given** → fetch it. Extract: company name, logo (favicon or og:image
   if no better asset), primary + accent colors, font feel, tone of voice.
2. **No site, but a description** → build the palette/tone from the description.
3. **Name only** → invent a tasteful identity yourself (palette + tone fitting the
   name and industry). State clearly what you chose and why.

Ask the client something ONLY if you are genuinely blocked (e.g. the site is
unreachable). Otherwise pick sensible defaults and say so in your summary.

## 2. Apply it
1. `git checkout -b brand/<client-slug>`
2. Edit `src/theme.css` — the `:root` variables (background, foreground, primary,
   radius, `--font-brand`, …). Add a Google-Fonts link in `index.html` only if the
   brand font requires it.
3. Edit `src/brand.config.ts` — name, tagline, logoSrc (drop the client's logo
   into `public/`), greeting, locale/currency, feature toggles.
4. Optionally adjust `src/explainers.ts` wording to the client's voice.
5. Touch NOTHING else. `src/data/live/*` is off-limits.

## 3. Verify and hand back
- `npm run typecheck && npx vitest run && npm run lint && npm run build` — all green.
- `npm run dev` — confirm the app loads in demo mode wearing the new brand.
- Reply with: what you derived (colors/font/tone and from where), what you chose
  yourself, and the branch name. Then iterate on the client's feedback
  ("more corporate", "green not purple", "drop the crypto tab" → feature toggle).

## Follow-up requests
- "Drop/keep a feature" → toggle in `src/brand.config.ts`.
- "Add a page/feature" → Path 2 in `AGENTS.md` (registry + new page file).
- "Wire my analytics/notifications" → fill slots in `src/integrations/index.ts`.
