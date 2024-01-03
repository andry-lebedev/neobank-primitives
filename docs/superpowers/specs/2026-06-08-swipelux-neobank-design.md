# Swipelux NeoBank Demo — Design Spec

**Date:** 2026-06-08  
**Stack:** React + Vite + Tailwind CSS + Axios + React Router v6 + Lucide React  
**Purpose:** Live onboarding demo showing end-to-end Swipelux payment infrastructure

---

## API Contract

**Base URL:** `VITE_API_URL=http://localhost:3000`  
**Auth:** `X-API-Key: <VITE_API_TOKEN>` header on every request

### Endpoints used

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/v1/customers/{id}` | Customer name, email, KYC status |
| GET | `/v1/customers/{id}/balances` | Total balance across wallets |
| GET | `/v1/customers/{id}/wallets` | List wallets |
| GET | `/v1/customers/{id}/wallets/{walletId}` | Wallet address + balances[] |
| GET | `/v1/customers/{id}/accounts` | Virtual bank accounts (SEPA, SWIFT) |
| POST | `/v1/payout/quote` | Create payout quote |
| POST | `/v1/payout` | Execute payout (bank or P2P) |
| GET | `/v1/transfers/{id}` | Fetch transfer status by ID |
| POST | `/v1/sandbox/topup` | Credit sandbox wallet (dev helper) |

**No transaction list endpoint exists.** History is built from:
1. Session-state `transferLog` (transfers created during the session)
2. Mock seed data (3–5 pre-populated entries shown on boot)

### Key response shapes

**Customer** (`GET /v1/customers/{id}`):
```
{ id, firstName, lastName, email, phone, status: "not_started|pending|approved|rejected" }
```

**Wallet** (`GET /v1/customers/{id}/wallets/{walletId}`):
```
{ id, chain, address, type, balances: [{ currency, amount }], createdAt }
```

**Account** (`GET /v1/customers/{id}/accounts`) — two relevant types:
- SEPA: `{ id, type:"sepa", source:"virtual", iban, bic, bankName, accountHolderName, paymentReference, currency }`
- SWIFT: `{ id, type:"swift", source:"virtual", swiftCode, accountNumber, bankName, accountHolderName, routingNumber }`

**Transfer** (`GET /v1/transfers/{id}`):
```
{ id, type:"onramp|wallet_to_wallet|offramp", state:"awaiting_funds|pending|in_progress|completed|failed",
  from: { identifier, amount, rail, currency }, to: { identifier }, createdAt, updatedAt, failureReason }
```

**Payout quote** (`POST /v1/payout/quote`):
```json
{
  "from": { "id": "wal_xxx", "amount": 100, "currency": "USDC" },
  "to": { "id": "racc_xxx", "currency": "EUR" }
}
```

**Payout execute** (`POST /v1/payout`):
```json
{
  "from": { "id": "wal_xxx", "amount": 100, "currency": "USDC" },
  "to": { "id": "racc_xxx OR wal_xxx", "currency": "EUR" }
}
```

---

## Environment Variables

```env
VITE_API_URL=http://localhost:3000
VITE_API_TOKEN=<api-key>
VITE_CUSTOMER_ID=cus_xxx
VITE_RECIPIENT_ACCOUNT_ID=racc_xxx    # pre-created bank payout recipient account
VITE_RECIPIENT_WALLET_ID=wal_xxx      # P2P transfer target wallet
VITE_DEMO_EMAIL=ak2@swipelux.com      # email that resolves to recipient wallet in P2P flow
```

---

## Architecture

### File structure

```
src/
  api/
    client.js          # axios instance — X-API-Key header, VITE_API_URL base
    customers.js       # getCustomer, getBalances
    wallets.js         # listWallets, getWallet
    accounts.js        # listAccounts
    transfers.js       # getTransfer, createPayoutQuote, createPayout
    sandbox.js         # topup
  components/
    Card.jsx           # rounded-2xl, bg-card, border, shadow-sm wrapper
    Badge.jsx          # status chip: pending(amber) / completed(green) / failed(red)
    Button.jsx         # primary(orange) / ghost variants; disabled+spinner during mutation
    CopyField.jsx      # label + value + copy-to-clipboard icon button
    Skeleton.jsx       # animate-pulse placeholder blocks
    TransactionRow.jsx # direction icon + description + amount + status badge + relative time
    Toast.jsx          # fixed top-right, auto-dismiss after 4s
    BottomNav.jsx      # fixed bottom, 4 tabs: Home / Send / Add money / Profile
    DevPanel.jsx       # developer transparency overlay (see below)
  pages/
    Dashboard.jsx
    AddMoney.jsx
    Send.jsx
    History.jsx
    Profile.jsx
  context/
    AppContext.jsx      # customer, wallet, accounts, transferLog, loading, error
  App.jsx              # BrowserRouter + AppProvider + routes
  main.jsx
```

### AppContext state

```js
{
  customer: null,       // GET /v1/customers/{id}
  wallet: null,         // GET /v1/customers/{id}/wallets/{walletId} (first wallet)
  accounts: [],         // GET /v1/customers/{id}/accounts
  transferLog: [],      // transfers created this session + mock seeds
  loading: true,        // boot fetch in progress
  error: null,          // boot-level error message
}
```

Boot sequence (parallel fetches on mount):
1. `getCustomer(VITE_CUSTOMER_ID)`
2. `listWallets(VITE_CUSTOMER_ID)` → pick first → `getWallet(customerId, walletId)`
3. `listAccounts(VITE_CUSTOMER_ID)`
4. Seed `transferLog` with 3 mock entries

Each call catches errors and falls back to corresponding `MOCK_*` constant.

---

## Design System

**Source:** `design-system/swipelux-neobank/MASTER.md`

### Color tokens

| Token | Value | Usage |
|-------|-------|-------|
| `bg-base` | `#111827` | App background |
| `bg-card` | `#1F2937` | Cards, panels |
| `bg-card-hover` | `#374151` | Card hover |
| `border` | `#374151` | Card borders |
| `accent` | `#F97316` | CTAs, active nav, highlights |
| `accent-hover` | `#EA6C0A` | Hover on accent elements |
| `text-primary` | `#F9FAFB` | Main text |
| `text-muted` | `#9CA3AF` | Labels, secondary copy |
| `green` | `#22C55E` | Credit amounts, success |
| `red` | `#EF4444` | Debit amounts, errors |
| `amber` | `#F59E0B` | Pending status, warnings |

### Typography

Font: **Inter** (Google Fonts, weights 300/400/500/600/700)

| Element | Class |
|---------|-------|
| Balance amount | `text-4xl font-bold text-white` |
| Section heading | `text-lg font-semibold text-white` |
| Body / description | `text-sm text-gray-400` |
| Transaction amount | `text-base font-semibold` |
| Button label | `text-sm font-medium` |

### Motion

- Micro-interactions (hover, tap): `duration-150 ease-out`
- Panel open/close: `duration-300 ease-in-out`
- New request entry in DevPanel: `duration-200` `opacity-0→1` + `translateY(-8px)→0`
- Status dot resolve: `duration-300` color transition
- Always gate behind `prefers-reduced-motion: reduce` — skip transforms, keep color transitions
- Use `transform` and `opacity` only — never animate `width`/`height`

### Components

**Card:** `rounded-2xl bg-[#1F2937] border border-[#374151] shadow-sm p-4 md:p-6`

**Badge variants:**
- `pending` → `bg-amber-500/20 text-amber-400 rounded-full px-2 py-0.5 text-xs`
- `completed` → `bg-green-500/20 text-green-400 ...`
- `failed` → `bg-red-500/20 text-red-400 ...`
- `approved` → same as `completed`

**Button primary:** `bg-[#F97316] hover:bg-[#EA6C0A] text-white rounded-xl px-4 py-3 text-sm font-medium transition-colors duration-150 cursor-pointer disabled:opacity-50`

**CopyField:** value text + Lucide `Copy` icon button. On copy: icon swaps to `Check` for 1.5s.

---

## Screens

### Dashboard `/`

**Data:** customer + wallet + accounts + transferLog (all from context)

**Layout:**
1. Header: "Good morning, {firstName}" + notification icon
2. Balance card (Card): large USDC amount, wallet ID truncated `wal_xxxx…xxxx` + Copy
3. Virtual account card (Card): first `source=virtual` account, preferring SEPA over SWIFT — SEPA shows IBAN+BIC, SWIFT shows accountNumber+swiftCode; paymentReference if present
4. Quick actions row: 3 pill buttons → `/add-money`, `/send`, `/history`
5. "Recent activity" heading + last 5 TransactionRows from transferLog
6. KYC banner (amber, top of page): shown if `customer.status !== 'approved'`; Send actions disabled

**Loading state:** Skeleton blocks for balance card and account card while context loads.

---

### Add Money `/add-money`

**Data:** accounts + wallet (from context — no new API calls)

**Layout:**
1. Back arrow + "Add money" heading
2. Tab bar: SEPA | SWIFT | Stablecoin (hide tab if no account of that type)
3. **SEPA tab:** Card with CopyField rows: IBAN, BIC, Bank name, Account holder, Payment reference; instructional copy below
4. **SWIFT tab:** Card with CopyField rows: Account number, SWIFT code, Bank name, Routing number (if present)
5. **Stablecoin tab:** Card with CopyField (wallet address) + dashed `w-32 h-32` QR placeholder
6. "Share details" button (copies all fields to clipboard as formatted text)

---

### Send `/send`

**Data:** wallet from context; mutations push to transferLog

**Layout:**
1. Back arrow + "Send" heading
2. Segmented control: `Bank payout` | `P2P Transfer`

**Bank payout sub-flow (3 steps):**
- Step 1 — Form:
  - Pre-filled recipient card: read-only, name + masked account from `VITE_RECIPIENT_ACCOUNT_ID`
  - Amount input (number, min 0.1) + currency badge "USDC"
  - Memo input (optional, placeholder "Payment reference")
  - "Review" CTA
- Step 2 — Review:
  - Summary card: from wallet, to recipient, amount, estimated fee (from quote response), estimated arrival
  - `POST /v1/payout/quote` fires on entering this step; fee + destination amount shown
  - "Confirm & Send" CTA (disabled + spinner while in flight)
- Step 3 — Success:
  - Green check icon, "Transfer initiated", transfer ID, estimated arrival
  - "Back to home" button
  - Transfer pushed to `transferLog`

**P2P sub-flow (3 steps):**
- Step 1 — Form:
  - Email input; `VITE_DEMO_EMAIL` resolves to `VITE_RECIPIENT_WALLET_ID`; any other email shows "User not found" toast and clears
  - When resolved: recipient card appears (name "Arthur K.", avatar initials)
  - Amount input + note input
  - "Review" CTA (disabled until recipient resolved)
- Step 2 — Review: summary card
- Step 3 — Success: same as bank payout
  - Submit: `POST /v1/payout` with `to.id = VITE_RECIPIENT_WALLET_ID`, `to.currency = "USDC"`

---

### History `/history`

**Data:** `transferLog` from context (session transfers + mock seeds)

**Layout:**
1. "Transaction history" heading + filter bar
2. Filters: direction pills (All / In / Out) + status pills (All / Completed / Pending / Failed)
3. List grouped by date label ("Today", "Yesterday", date string)
4. Each row: TransactionRow component
5. Row tap/click: expands inline detail panel — transfer ID, rail, from/to identifiers, fee, timestamps
6. Empty state: Lucide `Inbox` icon + "No transactions yet. Add money to get started."

---

### Profile `/profile`

**Data:** customer from context

**Layout:**
1. Avatar circle (initials, accent background)
2. Full name (`firstName + lastName`), email, phone
3. KYC status card: large Badge + descriptive copy per status
4. Account details section: customer ID CopyField, account type pill
5. Wallet address CopyField
6. Virtual account card (same component as Dashboard)
7. "Log out" button (ghost, red text) — sets `loggedOut: true` in AppContext → renders a static "You've been signed out" screen with a "Sign back in" button that calls `window.location.reload()`

---

## DevPanel Component

Fixed overlay for demo transparency. Toggled by FAB (bottom-right, orange, `z-50`).

**Desktop:** slide-in panel `w-96` from right edge, full viewport height, `bg-[#0F172A]` with `border-l border-[#374151]`

**Mobile:** bottom sheet, `h-[60vh]`, slides up from bottom

**Two tabs:**

### Requests tab

Each API call intercepted by axios request/response interceptors → dispatched to DevPanel state.

Request entry shape:
```js
{ id, method, url, status: "pending|success|error", statusCode, durationMs, requestBody, responseBody, timestamp }
```

Visual per entry:
- Method badge: GET=blue / POST=orange / PATCH=purple / DELETE=red
- URL truncated to path only
- Status: amber pulsing dot while pending → green check / red X on resolve
- Duration badge (ms) — shown after resolve
- Chevron to expand: request body + response body as syntax-highlighted JSON (`<pre>`)
- **Entry animation:** slides in from top, `opacity-0→1` + `translateY(-8px)→0`, `duration-200`

### State tab

Live AppContext snapshot. Three collapsible sections (accordion):
- Customer — key fields only (id, name, status)
- Wallet — id, address, balances
- Transfer log — list of {id, type, state, amount}

Values flash amber for 500ms on change via `transition-colors duration-500`.

---

## Error & Edge Cases

- **Non-2xx API response:** axios interceptor catches → `Toast` with `response.data.message ?? "Request failed"`. Never expose stack trace.
- **Boot fetch fails:** show error banner "Failed to load account. Using demo data." — app still renders with mock data.
- **KYC not approved:** amber banner on Dashboard, Send CTAs disabled with tooltip "Verification required".
- **Network offline:** `window.addEventListener('offline')` → persistent amber banner "No internet connection".
- **Empty transfer log:** empty state shown in History and on Dashboard recent activity.
- **Skeleton placeholders:** shown for balance card, account card, transaction list — `animate-pulse` gray blocks matching real content dimensions.

---

## Mock Seed Data

```js
export const MOCK_CUSTOMER = {
  id: "cust_demo_001",
  firstName: "Arthur",
  lastName: "Kupriyanov",
  email: "ak@swipelux.com",
  phone: "+1 555 0100",
  status: "approved",
};

export const MOCK_WALLET = {
  id: "wlt_demo_001",
  chain: "polygon",
  address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
  type: "custodial",
  balances: [{ currency: "USDC", amount: "2500.00" }],
};

export const MOCK_IBAN = {
  id: "acc_demo_001",
  type: "sepa",
  source: "virtual",
  iban: "EE38 2200 2210 2014 5685",
  bic: "HABAEE2X",
  bankName: "Swedbank",
  accountHolderName: "Arthur Kupriyanov",
  paymentReference: "SWPLX-DEMO-001",
  currency: "EUR",
};

export const MOCK_TRANSFERS = [
  { id: "txn_001", type: "onramp", state: "completed", from: { currency: "EUR", amount: "500", rail: "sepa" }, to: { identifier: "wlt_demo_001" }, createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: "txn_002", type: "offramp", state: "completed", from: { identifier: "wlt_demo_001", amount: "200", currency: "USDC" }, to: { identifier: "acc_demo_001" }, createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: "txn_003", type: "wallet_to_wallet", state: "pending", from: { identifier: "wlt_demo_001", amount: "50", currency: "USDC" }, to: { identifier: "wlt_demo_002" }, createdAt: new Date(Date.now() - 3600000).toISOString() },
];
```

---

## Demo Flow Checklist

1. Open Dashboard → balance + IBAN visible
2. Add Money → SEPA tab → copy IBAN, explain bank transfer
3. Send → Bank payout → fill amount → review (shows quote fee) → confirm → success screen + transaction ID
4. Send → P2P → enter demo email → recipient resolves → transfer → success
5. History → two new transactions visible with status
6. Profile → KYC Verified badge
7. DevPanel open throughout → audience sees every request/response live

---

## Definition of Done

- [ ] All 5 screens render without errors
- [ ] Dashboard shows real balance + IBAN from API (mock fallback if API empty)
- [ ] Add Money shows correct virtual account details
- [ ] Bank payout submits quote + payout, shows confirmation + transfer ID
- [ ] P2P transfer submits, shows confirmation
- [ ] History lists session transfers + mock seeds
- [ ] DevPanel shows all requests with animations in real time
- [ ] Responsive at 375px and 1440px
- [ ] No hardcoded strings that would embarrass on live demo
- [ ] prefers-reduced-motion respected
- [ ] All clickable elements have cursor-pointer + visible hover state
