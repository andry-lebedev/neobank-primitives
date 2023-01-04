# Deployed env + create-customer basics — Design

Date: 2026-06-09
Project: dummy-neobank (Swipelux demo, React 19 + Vite + Tailwind, axios)

## Goal

Point the demo app at a deployed Swipelux environment (sandbox) authenticated by
an API key, and add the basics for creating an **individual customer** through the
app, wiring the new customer id into the existing data-loading flow.

Out of scope (explicitly): org creation (org is implied by the API key), wallet
provisioning, KYC document upload, business customers.

## Facts (from api-docs/api-1.json, OpenAPI 3.1)

- Servers: production `https://platform.swipelux.com`, sandbox `https://platform.sbx.swipelux.com`.
- Auth: `apiKey` security scheme — header `X-API-Key`. Global security applies to all paths.
- Create customer endpoint chosen: `POST /v2/customers`.
  - Individual request body (anyOf branch, `type: "individual"`):
    - `type`: `"individual"` (required)
    - `externalId`: string (optional)
    - `personal` (required): `{ firstName?, middleName?, lastName?, birthDate? (YYYY-MM-DD), email (required, email), phone? }`
    - `address` (optional object; if present, ALL required): `{ country, streetLine1, streetLine2, city, state, postalCode }` (country = ISO 3166-1 alpha-2 or alpha-3)
    - `taxInfo` (optional object; if present, ALL required): `{ country, type, value }`; `type` enum: `ssn|itin|ein|tin|vat|cpf|other`
    - `metadata`: object (optional)
  - Response 200: `{ id, type, verificationStatus ("not_started"|"pending"|"approved"|"rejected"), personal{...}, address{...}, taxInfo{...}, ... }`

## Changes

### 1. Env config (sandbox target)

`.env` is already gitignored and untracked — no change needed there. Update the
committed template `.env.example` so the mock points at sandbox and documents the
api-key var:

```
VITE_API_URL=https://platform.sbx.swipelux.com
VITE_API_TOKEN=your-api-key-here        # sent as X-API-Key
VITE_SANDBOX_TOKEN=your-api-key-here     # used by transfers.js sandbox client
VITE_CUSTOMER_ID=                        # optional; leave blank, create via UI
VITE_RECIPIENT_ACCOUNT_ID=racc_xxx
VITE_RECIPIENT_WALLET_ID=wal_xxx
VITE_DEMO_EMAIL=ak2@swipelux.com
```

User pastes real key + sandbox base into local `.env`.

### 2. API helper — `src/api/customers.js`

Add:

```js
export function createCustomer({ firstName, middleName, lastName, birthDate, email, phone, address, taxInfo, externalId, metadata }) {
  const body = {
    type: 'individual',
    personal: { firstName, middleName, lastName, birthDate, email, phone },
  }
  if (externalId) body.externalId = externalId
  if (metadata) body.metadata = metadata
  // Only attach address if all required sub-fields present
  if (address && ['country','streetLine1','streetLine2','city','state','postalCode'].every(k => address[k])) {
    body.address = address
  }
  // Only attach taxInfo if all required sub-fields present
  if (taxInfo && taxInfo.country && taxInfo.type && taxInfo.value) {
    body.taxInfo = taxInfo
  }
  return client.post('/v2/customers', body).then(r => r.data)
}
```

Strip undefined keys from `personal` before sending (omit empty optional fields).

### 3. Onboarding UI — `src/pages/Onboarding.jsx`, route `/onboarding`

- Two-step screen matching existing page style (Card, Button, `ArrowLeft`
  back-header like `Send.jsx`, dark theme `bg-[#111827]`, `showToast`).
- Step 1 — form:
  - Required: email. Common: firstName, lastName, phone, birthDate.
  - Collapsible "Address" group (all 6 fields; send only if fully filled).
  - Collapsible "Tax info" group (country, type select, value; send only if fully filled).
  - Client-side validation: email format + presence; if any address field filled,
    require all six; same for tax info.
  - Submit → `createCustomer(...)`. Errors surface via the existing axios
    interceptor toast; no duplicate error handling.
- Step 2 — success card:
  - Show returned `id` via `CopyField`, plus `verificationStatus` (Badge).
  - "Use this customer" button → `localStorage.setItem('swipelux_customer_id', id)`
    → navigate to `/` (Dashboard).
- Register route in `src/App.jsx`.

### 4. AppContext — customer id resolution

- Add helper resolving the active customer id:
  `localStorage.getItem('swipelux_customer_id') ?? import.meta.env.VITE_CUSTOMER_ID`.
- Use it in the load `useEffect` and in `refreshWallet` (replace direct
  `import.meta.env.VITE_CUSTOMER_ID` reads).
- A created + selected customer immediately drives data loading on next mount.

### 5. Entry point — DevPanel

- Add a "Create customer" action in `src/components/DevPanel.jsx` that navigates
  to `/onboarding`. BottomNav (5 main tabs) stays unchanged.

## Testing

- `npm run lint` clean.
- Manual: with a real sandbox key in `.env`, open `/onboarding`, create an
  individual customer (email only minimum), confirm `id` returned and copyable,
  click "Use this customer", confirm Dashboard loads data for that id (or falls
  back to mocks gracefully on empty wallets/accounts as today).
- No regression to existing mock fallback when no key/customer id configured.
