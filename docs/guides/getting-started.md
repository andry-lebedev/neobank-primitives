# Getting started

Neobank Primitives runs as a complete local demo before any external service is
configured. Use that path to understand the product surface, then opt into live
mode only when an integration is ready.

## Local setup

```bash
npm install
npm run dev
```

Open the URL printed by Vite. The default demo includes balances, recipients,
transfers, KYC states, and an activity history.

## First verification

```bash
npm run typecheck
npm test
npm run lint
npm run build
```

Keep demo mode available while changing branding or navigation. It is the
fastest way to verify the full experience without depending on network state.
