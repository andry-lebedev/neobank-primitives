<div align="center">

# Neobank Primitives

### Agent-native financial primitives for fintechs and software that can act.

Build accounts, identity flows, deposits, payouts, wallet transfers, and policy-aware operations on a provider-neutral contract. Start with the working neobank demo; extend it into policy-controlled MCP tools and a TypeScript SDK.

[![Live demo](https://img.shields.io/badge/Live_demo-Open-111111?style=for-the-badge)](https://neobank-starter.vercel.app/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-149ECA?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![Status](https://img.shields.io/badge/Status-Early_build-7C5CFC?style=for-the-badge)](#project-status)

[Run locally](#run-it-locally) · [Explore the primitives](#the-primitive-surface) · [See the architecture](#agent-native-architecture) · [Read the roadmap](#project-status)

</div>

![Neobank Primitives — agent-native financial infrastructure](docs/assets/readme/neobank-primitives-hero.png)

## Money movement should be composable

Most financial APIs expose endpoints. Autonomous software needs a safer abstraction: explicit intent, policy evaluation, normalized execution, durable state, and receipts it can reason about.

Neobank Primitives is building that layer for two consumers:

- **Fintech applications** that want reusable identity, account, balance, and transaction building blocks.
- **AI agents** that need narrowly scoped financial tools, machine-readable outcomes, and human approval when policy requires it.

The repository is useful now as an interactive neobank starter with realistic demo data, a Swipelux sandbox integration, and an in-app policy runtime with approvals, receipts, and audit events. The MCP server, standalone SDK, and full KYB surface described below are the direction of the project and are **not yet shipped**; the current runtime is an MVP, not a production compliance system.

## The primitive surface

| Primitive | Working product flow | Target MCP + SDK contract |
| --- | --- | --- |
| **Identity** | Customer onboarding and KYC state | Create, retrieve, and monitor customer identity |
| **Businesses** | Business account persona | Create organizations and track KYB requirements |
| **Accounts** | Fiat accounts, stablecoin wallets, and balances | Provision and query normalized financial accounts |
| **Transactions** | Quotes, bank payouts, and wallet transfers | Quote, authorize, execute, and inspect money movement |
| **Storage** | Local demo ledger, provider-backed state, and a versioned operation journal | Move normalized operation state and receipts to a server-side store |
| **Controls** | Policy evaluation, authorized approval, durable browser receipts, and audit events | Expose the controls through a standalone audit API |

The contract is designed to stay provider-neutral. **Swipelux is the first adapter**, not the shape every integration must inherit.

## A working financial product, not a static mock

Demo mode runs without credentials and remains interactive across personal and business accounts, onboarding, deposits, payouts, and wallet transfers. Turn on **How it works** to see the financial steps behind each product action.

<table>
  <tr>
    <td width="33%" align="center">
      <img src="docs/assets/readme/business-dashboard.png" alt="Business account dashboard with EUR and USDC balances" />
      <br /><sub><b>Business accounts</b> · fiat and stablecoin balances</sub>
    </td>
    <td width="33%" align="center">
      <img src="docs/assets/readme/identity-onboarding.png" alt="Identity onboarding with KYC, wallet, and bank account provisioning" />
      <br /><sub><b>Identity</b> · KYC and account provisioning</sub>
    </td>
    <td width="33%" align="center">
      <img src="docs/assets/readme/deposit-rails.png" alt="SEPA bank transfer and USDC deposit rails" />
      <br /><sub><b>Deposit rails</b> · SEPA and USDC</sub>
    </td>
  </tr>
  <tr>
    <td colspan="3" align="center">
      <img src="docs/assets/readme/transaction-quote.png" alt="Bank payout quote with fee, rate, recipient amount, and execution explainer" />
      <br /><sub><b>Transaction execution</b> · policy decision, provider quote, and payout</sub>
    </td>
  </tr>
</table>

## Agent-native architecture

Agents should not receive an unrestricted payment endpoint. They should receive constrained tools backed by the same typed SDK used by the application, with policy checks between intent and execution.

```mermaid
flowchart LR
    A[Autonomous agent] --> M[MCP tools]
    F[Fintech application] --> S[TypeScript SDK]
    M --> P[Policy engine]
    P --> S
    S --> N[Normalized primitives]
    N --> W[Swipelux adapter]
    N --> X[Additional adapters]
    W --> I[Financial infrastructure]
    X --> I
    P --> H[Human approval for exceptions]
    I --> O[States, receipts, audit history]
    O --> A
    O --> F
```

Every operation follows the same lifecycle:

```text
validate intent → evaluate policy → authorize → execute → normalize → audit
```

The target contract treats idempotency, limits, destination rules, approvals, status, and receipts as first-class concerns—not application-specific afterthoughts.

### What an agent call should look like

> Target interface — illustrative, not yet part of the published runtime.

```json
{
  "name": "transactions.quote",
  "arguments": {
    "sourceAccountId": "acct_operating_eur",
    "destination": { "type": "bank_recipient", "id": "rcpt_maria" },
    "amount": { "value": "250.00", "currency": "EUR" },
    "purpose": "invoice_payment",
    "idempotencyKey": "inv_2041_quote"
  }
}
```

The tool response should give the agent enough information to make the next bounded decision:

```json
{
  "status": "approval_required",
  "quoteId": "quote_01",
  "recipientGets": { "value": "247.75", "currency": "EUR" },
  "fee": { "value": "2.25", "currency": "EUR" },
  "policy": {
    "decision": "review",
    "reason": "new_destination"
  },
  "expiresAt": "2026-07-13T18:30:00Z"
}
```

## Policy-controlled autonomy

The in-app transaction runtime follows this safety model:

1. An application or agent submits a structured financial intent.
2. Capability and policy checks validate the rail, currency, amount and period limits, destination rules, and approval permissions.
3. Allowed operations execute automatically; exceptions pause for an authorized human.
4. Execution rejects expired or replayed quotes, then records the adapter state, provider references, receipt, and audit events.

This makes autonomy configurable instead of binary. A treasury agent might rebalance approved wallets automatically while a first-time bank recipient always requires review.

## Run it locally

```bash
git clone https://github.com/andry-lebedev/neobank-primitives.git
cd neobank-primitives
npm install
npm run dev
```

No `.env` file is required for demo mode. Open the local URL, switch between personal and business personas, onboard a customer, add funds, request a payout quote, and inspect the execution story.

### Connect the first adapter

Click **Go live** in the app and provide a Swipelux sandbox API key. The key is held in browser storage and validated against the v3 capabilities endpoint before the screens switch from realistic local data to the live adapter.

The read integration lives under [`src/data/live`](src/data/live), behind the same `DataSource` contract used by the demo implementation. Capability-aware onboarding, accounts, recipients, destinations, quotes, transfers, rules, webhooks, and sandbox verification use the typed v3 provider in [`src/financial`](src/financial). Provider documentation: [Swipelux API reference](https://platform.swipelux.com/api-reference) · [Swipelux docs](https://docs.swipelux.com)

## Project status

| Area | Available now | Next |
| --- | --- | --- |
| Product demo | Personal + business personas, verified onboarding, balances, deposits, payouts, wallet transfers, approval, and activity | More operational workflows |
| Identity | Customer onboarding gated on returned KYC state, with custody and account evidence | Full KYB primitives and requirement handling |
| Integrations | Demo provider plus typed Swipelux v3 capability, account, recipient, destination, quote, transfer, rule, webhook, and verification calls | Additional provider adapters |
| Developer surface | Typed in-app domain, financial provider/runtime boundaries, and executable support metadata | Published TypeScript SDK |
| Agent surface | Human-readable operation explainers | MCP server backed by the SDK |
| Controls | Policy limits and destination rules, authorized approval, exact-quote execution, durable browser receipts, and audit events | Server-side persistence and a standalone audit API |

This is an early build. Do not use demo addresses for real funds, and do not treat the current UI as a production compliance or custody system. Production users remain responsible for provider onboarding, credentials, jurisdictional requirements, policy configuration, and operational controls.

## Make the starter yours

The UI is intentionally easy to fork. Give the following prompt to a coding agent after cloning:

```text
Read AGENTS.md and PROMPT.md, then adapt this neobank starter to my product.
Ask for my company name, audience, and brand direction. Work on a new branch,
keep financial flows and tests intact, edit the documented brand surfaces first,
run the quality checks, and show me the finished local app.
```

Brand-only changes are concentrated in `src/theme.css` and `src/brand.config.ts`. Feature extensions should preserve the domain boundary so future SDK and MCP surfaces can share the same primitives.

## Quality commands

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

## Contributing

The most valuable contributions strengthen the primitive boundary: normalized transaction states, adapter contracts, policy decisions, approvals, receipts, KYB requirements, and deterministic demo scenarios. Open an issue before making a large architectural change so the application, SDK, and MCP direction stay aligned.

---

<div align="center">
  <b>Build financial products for humans. Expose financial primitives to agents.</b>
</div>
