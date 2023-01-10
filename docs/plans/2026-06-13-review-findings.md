# neobank-starter v2 — Review Findings to Fix

Branch: feat/v2-rebuild. Confirmed by adversarial review. Apply on this branch.
Keep `npm run typecheck`, `npx vitest run`, `npm run lint`, `npm run build` green after each fix.
Design invariants (do NOT change): client-side API key is by-design; session-entry ≠ auth; demo balances are play money; src/components/ui/* generated.

## Medium

### M1 — Send: negative/zero amounts bypass guards and credit the wallet
- file: src/pages/Send.tsx (getQuote ~line 188, confirm ~line 214, sendCrypto ~line 235; guards use `Number(amount)` / `!Number(amount)`)
- problem: `Number('-50')` is truthy, so negative amounts pass the enabled-button and submit guards. In demo mode `createPayout` then calls `adjustBalance(currency, -input.amount)` → double-negative ADDS funds. Wrong-direction money movement.
- fix: introduce a single positive-amount check, e.g. `const amountNum = Number(amount); const validAmount = Number.isFinite(amountNum) && amountNum > 0`. Use `validAmount` to gate the Get-quote, Confirm, and Send buttons and to early-return in getQuote/confirm/sendCrypto. Do not change the demo store math.

### M2 — validateApiKey accepts a bad key on any non-401/403 response
- file: src/data/mode.ts:34-44 (validateApiKey)
- problem: returns `true` for any axios error whose status is not 401/403 (404, 429, 5xx) and only `false` on network failure. "Go live" can switch to live mode with a key the sandbox never accepted.
- fix: treat only a genuine success as valid. Resolve `true` only when the GET resolves (2xx). On an axios error, return `false` for 401/403 specifically as "rejected"; for other statuses, also return `false` (could not verify) rather than `true`. Keep the network-failure path returning `false`. Update src/data/mode.test.ts expectations accordingly (the 400 case should now be false).

### M3 — Send: stale quote + wrong-currency across tabs
- file: src/pages/Send.tsx (currency default `useState('EUR')` ~line 28; quote not cleared on currency change ~line 232; amount shared between bank and crypto tabs; switching tabs keeps a stale quote)
- problem: `currency` defaults to hardcoded 'EUR' which may not be a wallet balance option; changing the currency `<select>` or the crypto amount, or switching tabs, leaves a previously fetched `quote` in place, so Confirm can submit a stale/mismatched quote.
- fix: default `currency` from the first wallet balance (fallback 'EUR'); clear `quote` (`setQuote(null)`) whenever currency changes, when switching tabs, and when the crypto amount changes; ensure the bank Confirm is only enabled while a fresh `quote` exists for the current amount/currency.

### M4 — Crypto-vs-bank classification by toId.startsWith('0x')
- file: src/data/demo/store.ts:216 (createPayout) and src/pages/Send.tsx (which calls createPayout with toId)
- problem: payout type is inferred from `toId.startsWith('0x')`. Non-EVM or unprefixed wallet addresses are misclassified as bank offramps; a recipient-account id that happens to start with 0x would misclassify the other way.
- fix: pass an explicit destination kind from the caller. Add an optional `kind: 'bank' | 'wallet'` (or reuse transfer type) to the PayoutInput the Send page already knows (the crypto tab vs bank tab), and have the demo store branch on that instead of sniffing the id. Keep the live source unchanged (it already routes by toId per the API). Update types in src/data/types.ts if needed and any affected tests.

## Low

### L1 — Live-mode poll effect thrashes on transferLog dependency
- file: src/context/AppContext.tsx:74-87
- problem: the polling `useEffect` lists `transferLog` in deps, so every transfer update tears down and recreates the interval, resetting the 5s clock.
- fix: keep a `transferLogRef` (latest-ref pattern, like refreshWalletRef) and read it inside the interval; depend only on `[mode, source]`.

### L2 — Toaster timeouts not cleared on unmount
- file: src/components/Toaster.tsx:8-18
- problem: each toast's auto-dismiss `setTimeout` handle is never cleared; firing after unmount calls setState on an unmounted component.
- fix: track timeout ids and clear them in the effect cleanup (or clear per-toast on removal).

### L3 — formatDate throws on invalid/missing date
- file: src/lib/format.ts:16-21
- problem: `new Date(iso)` with undefined/invalid input yields Invalid Date and `Intl.DateTimeFormat.format` throws RangeError.
- fix: guard for `Number.isNaN(date.getTime())` and return '' (or the raw input) instead of throwing.

### L4 — transferTitle can return undefined
- file: src/lib/format.ts:23-29
- problem: declared `: string` but the switch has no default, so an unknown live transfer type returns undefined.
- fix: add a default branch returning 'Transfer'.

### L5 — CopyField reports success even when clipboard write fails
- file: src/components/CopyField.tsx:7-11
- problem: `navigator.clipboard?.writeText(value).catch(() => {})` then unconditionally sets copied=true.
- fix: only set copied=true in the promise `.then`; on failure (or missing clipboard) do not show the success state.

### L6 — Profile external KYC link: reverse tabnabbing
- file: src/pages/Profile.tsx:24
- problem: `window.open(session.verificationUrl, '_blank')` lacks noopener/noreferrer.
- fix: `window.open(url, '_blank', 'noopener,noreferrer')`.

### L7 — theme-token guard misses inline-style hex and named/arbitrary colors
- file: src/theme-forbidden.js:7-14
- problem: the guard regexes only catch className palette/hex utilities; raw hex in inline `style={{ color: '#fff' }}` and arbitrary named colors slip past, weakening the 2-file re-brand promise.
- fix: add a pattern catching hex literals in inline style objects within src/components and src/pages (e.g. `(?:color|background|backgroundColor|borderColor|fill|stroke)\s*:\s*['"]?#[0-9a-fA-F]{3,8}`). Keep DevPanel-style exemptions if any. Update the guard test if needed; ensure it still passes on the current tree.

### L8 — Onboarding has no rollback/idempotency on partial failure (live)
- file: src/pages/Onboarding.tsx:23-42
- problem: if a step fails mid-chain in live mode, earlier-created entities (customer/wallet) are orphaned and a retry creates duplicates.
- fix: minimal — on failure, surface which step failed and offer retry-from-where-it-failed rather than restarting the whole chain (track completed step results and resume). Keep demo behavior intact.

### L9 — topup default currency diverges demo (EUR) vs live (USDC)
- file: src/data/demo/store.ts:238 and src/data/live/source.ts (topup) and src/pages/AddMoney.tsx (which picks currency by mode)
- problem: the simulated-deposit currency differs by mode, which is confusing and not driven by config.
- fix: make the simulate-deposit currency consistent / derive it from the wallet's primary balance or brand.currency in both modes; if the live sandbox topup requires USDC, keep that but align the demo to match the same default and document the choice in one place.

### L10 — Unreachable duplicate explainer flow 'deposit'
- file: src/explainers.ts (FlowKey 'deposit' duplicates 'topup'; EVENT_FLOW maps topup.* to 'topup' only)
- problem: dead, byte-identical duplicate flow.
- fix: remove the 'deposit' FlowKey and its entry; update the FlowKey type and the explainers test if it enumerates flows.
