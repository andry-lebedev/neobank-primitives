# API-driven neobank rebuild — Design

Date: 2026-06-09
Project: dummy-neobank (Swipelux demo, React 19 + Vite + Tailwind, axios)

## Goal

Make the demo a Revolut-like neobank flow driven entirely by the Swipelux API, with
no hardcoded wallet/account/recipient identifiers and no mock-data fallback. A new
customer is created, provisioned with a wallet and a virtual bank account, and can
top up, send a bank payout, and send wallet-to-wallet — all against live sandbox.

## Scope

In scope:
1. Provisioning on onboarding (create wallet + virtual IBAN after customer created).
2. Recipients (replace fake P2P/bank env vars with real recipients).
3. Kill mocks (live API only; real loading/empty/error states).
4. Cleanup (fix `status` → `verificationStatus` bug, single axios client, trim env).

Out of scope (deferred):
- **KYC flow** — initiating verification and driving `verificationStatus` to approved
  is its own spec. This rebuild reads the real status and soft-gates on it, but does
  not build the KYC initiation/polling UI.
- Multi-wallet / multi-currency / multi-account management (YAGNI for the demo).
- Business customers, separate Recipients page.

## Locked decisions

- **Scope**: core (provisioning + recipients + kill mocks + cleanup); KYC deferred.
- **P2P**: no user directory exists in the API. P2P = paste a destination wallet ID
  (`wal_xxx`), send wallet-to-wallet. The fake email→wallet lookup is removed.
- **KYC gate**: soft. Read real `verificationStatus`; block sending only when
  `rejected`; otherwise allow and show a status banner. Hard enforcement lands with
  the future KYC spec.
- **Provisioning trigger**: onboarding chains it (approach A). Onboarding owns
  provisioning; dashboard just consumes ready state.
- **Implementation**: code written by codex gpt-5.5, reviewed + verified before commit.

## API facts (from api-docs/api-1.json, OpenAPI 3.1)

- Auth: `apiKey` scheme, header `X-API-Key`, global security. One key works for all
  calls including `/v1/sandbox/topup` — no separate sandbox client needed.
- `POST /v1/customers/{customerId}/wallets` — body `{ chain }` (enum: polygon,
  ethereum, base, arbitrum, optimism, bsc, avalanche) or `{ chains: [...] }`.
- `POST /v1/customers/{customerId}/accounts` — body `{ type, country(2), currency(3),
  targetWallet(wal_xxx, custodial), label? }`; `type` enum sepa|swift|ach|fedwire|
  pix|wire. Required: type, country, currency, targetWallet.
- `GET/POST /v1/customers/{customerId}/recipients` — create body `{ type
  (individual|business), relationship?, firstName?, lastName?, companyName?, email?,
  phone? }`. firstName/lastName required when type=individual.
- `GET/POST /v1/customers/{customerId}/recipients/{recipientId}/accounts` — create
  (SEPA branch) body `{ rail:'sepa', details:{ iban, bic?, bankName?, bankAddress?,
  accountHolderName, country(2), currency(3) } }` (required: iban, accountHolderName,
  country, currency). SWIFT branch uses `{ rail:'swift', details:{ swiftCode,
  accountNumber, ... } }`. Recipient accounts are **bank rails only** — no crypto
  recipient type.
- `POST /v1/payout` — `{ from:{ id(wal_xxx), amount(>=0.1), currency? }, to:{ id,
  amount?, currency? } }`. `to.id` accepts wallet (`wal_xxx`), customer account
  (`acc_xxx`), or recipient account (`racc_xxx`).
- `POST /v1/payout/quote` — same shape, returns fee/rate/destination_amount.
- `POST /v1/sandbox/topup` — `{ wallet, amount(string), currency }`.
- Customer object exposes `verificationStatus` (not_started|pending|approved|
  rejected), NOT `status`.

## Changes

### 1. API layer (`src/api/`)

- **`wallets.js`** — add:
  ```js
  export function createWallet(customerId, chain = 'polygon') {
    return client.post(`/v1/customers/${customerId}/wallets`, { chain }).then(r => r.data)
  }
  ```
  Keep `listWallets`, `getWallet`.
- **`accounts.js`** — add:
  ```js
  export function createAccount(customerId, { type = 'sepa', country, currency, targetWallet, label }) {
    const body = { type, country, currency, targetWallet }
    if (label) body.label = label
    return client.post(`/v1/customers/${customerId}/accounts`, body).then(r => r.data)
  }
  ```
  Keep `listAccounts`.
- **`recipients.js`** (new):
  ```js
  export function listRecipients(customerId)
  export function createRecipient(customerId, { type='individual', relationship, firstName, lastName, companyName, email, phone })
  export function listRecipientAccounts(customerId, recipientId)
  export function createRecipientAccount(customerId, recipientId, { rail='sepa', details })
  ```
  Each strips empty optional fields (reuse a compact helper) and returns `r.data`.
- **`transfers.js`** — delete the duplicate `sandboxClient`. `sandboxTopup` posts via
  the main `client`. `createPayout`/`createPayoutQuote`/`listTransfers`/`getTransfer`
  unchanged in shape.
- **`customers.js`** — unchanged.

### 2. Onboarding — provisioning chain (`src/pages/Onboarding.jsx`)

After `createCustomer` succeeds, run a sequential provisioning chain with visible
per-step progress (new sub-step between the current form step and the success step):

1. `createWallet(id, 'polygon')` → wallet.
2. `createAccount(id, { type:'sepa', country:'EE', currency:'EUR', targetWallet: wallet.id })`.
3. `localStorage.setItem('swipelux_customer_id', id)`; navigate `/`.

- Progress UI: labelled steps ("Creating wallet…", "Opening bank account…") each
  showing pending/done/error.
- Error handling: a failing step stops the chain and shows the error + a Retry that
  resumes from the failed step (the customer is already created — never recreate it;
  the wallet, once created, is not recreated either). Errors also surface via the
  axios interceptor toast.
- Defaults `polygon` / `EE` / `EUR` are module constants, not env vars.

### 3. AppContext — live state, no mocks (`src/context/AppContext.jsx`)

- `resolveCustomerId()` unchanged: `localStorage.getItem('swipelux_customer_id') ??
  import.meta.env.VITE_CUSTOMER_ID`.
- Initial state: `customer=null`, `wallet=null`, `accounts=[]`, `transferLog=[]`,
  `loading = Boolean(resolveCustomerId())`, `error=null`.
- Load effect (when a customer id exists): fetch customer, wallets (then first
  wallet detail), accounts, transfers. On any fetch error, set a user-facing `error`
  and leave the corresponding data empty. **No mock fallback anywhere.**
- No customer id: not loading, empty state (screens show their "set up account"
  empty states).
- `addTransfer`, `refreshWallet` unchanged in behavior (no mock fallback in
  `refreshWallet`).

### 4. Kill mocks

- Delete `src/mocks.js` and every import of `MOCK_*`.
- Per-screen states:
  - **Dashboard** (`Dashboard.jsx`): `loading` → existing skeletons; `error` → retry
    banner; no wallet → "Set up your account" CTA navigating to `/onboarding`;
    wallet with empty balances → show `0.00`.
  - **AddMoney** (`AddMoney.jsx`): no virtual account → "No account yet" empty copy;
    no wallet → hide stablecoin tab address / show placeholder.
  - **Profile** (`Profile.jsx`): render from live customer/accounts; missing →
    graceful empties.
  - **History** (`History.jsx`): no transfers → existing empty state.

### 5. Send (`src/pages/Send.jsx`)

- **Bank payout** — remove `VITE_RECIPIENT_ACCOUNT_ID`:
  - Load recipients via `listRecipients`. Select a recipient → load its accounts via
    `listRecipientAccounts` → select a recipient account (`racc_xxx`).
  - If no recipients exist, show an inline "Add recipient" form: create recipient
    (type=individual, firstName/lastName/email) + a SEPA recipient account
    (iban/accountHolderName/country/currency). On success, it becomes selectable.
  - Quote + payout use `to.id = racc_xxx`, `toCurrency` from the recipient account
    currency (EUR for the SEPA demo).
- **P2P** — remove `VITE_RECIPIENT_WALLET_ID`, `VITE_DEMO_EMAIL`, `resolveEmail`:
  - Input = destination wallet ID; validate `wal_` prefix (and non-empty). Remove the
    fake "Arthur K. ✓ User found" card.
  - Payout `to.id = <wallet id>`, `toCurrency:'USDC'`.
- **KYC soft gate**: compute from `customer.verificationStatus`. `canSend = status !==
  'rejected'`. Show a banner: `not_started` → "Verify your identity to lift limits";
  `pending` → "Verification under review"; `rejected` → blocking "Verification failed"
  message and disabled send. Replace the old `kycOk = customer?.status==='approved'`.

### 6. Recipients management

Lives inline in the Send bank-payout tab (no separate page — YAGNI). Reuses the
recipients API helpers. A created recipient + account are immediately usable in the
same session via re-fetch.

### 7. Cleanup / bug fixes

- **Field bug**: replace `customer.status` with `customer.verificationStatus` in
  `Send.jsx` and `Profile.jsx` (`getKycLabel(customer?.verificationStatus)`), and in
  `DevPanel.jsx` `stateSnapshot`. Also fix `DevPanel` customer name: real customer
  exposes `personal.firstName/lastName`, not top-level — read `customer.personal?.*`
  with a fallback.
- Remove `resolveEmail` from `src/utils.js`.
- **Single client**: only `client` in `src/api/client.js`; no `sandboxClient`.
- **DevPanel topup**: target `wallet?.id` from context; drop `VITE_SANDBOX_WALLET_ID`
  and the `SANDBOX_WALLET` constant.
- **Env trim** — final `.env.example`:
  ```
  VITE_API_URL=https://platform.sbx.swipelux.com
  VITE_API_TOKEN=your-api-key-here
  VITE_CUSTOMER_ID=
  ```
  Removed: `VITE_SANDBOX_TOKEN`, `VITE_RECIPIENT_ACCOUNT_ID`,
  `VITE_RECIPIENT_WALLET_ID`, `VITE_DEMO_EMAIL`, `VITE_SANDBOX_WALLET_ID`.

## Testing

- `npm run lint` clean; `npm run build` succeeds.
- Unit (vitest):
  - `createWallet` posts `{ chain }` to the right path.
  - `createAccount` posts required fields and omits absent `label`.
  - recipient helpers post correct bodies and strip empties.
  - P2P wallet-id validation accepts `wal_...`, rejects empty/other.
  - soft-gate logic: `rejected` blocks; `not_started`/`pending`/`approved` allow.
- Manual (real sandbox key in local `.env`):
  - `/onboarding` → create customer → wallet + IBAN provisioned → land on Dashboard
    showing live (empty) balance and the new IBAN.
  - DevPanel topup credits the real wallet; balance refreshes.
  - Bank payout: add a recipient + SEPA account, quote, confirm → payout created.
  - P2P: paste a wallet id, send → payout created.
  - No mock data appears at any point; empty states render when data is absent.

## Implementation

Code written by codex gpt-5.5 (`codex exec -m gpt-5.5 -s workspace-write
--skip-git-repo-check`). Constraints to pass to codex: do not commit; do not modify
`.env`; do not add dependencies. After codex returns, review and independently verify
(lint, build, tests, prop/contract checks) before committing.
