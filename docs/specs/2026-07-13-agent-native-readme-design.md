# Agent-Native Financial Primitives README Design

**Date:** 2026-07-13

**Repository:** `andry-lebedev/neobank-primitives`

**Branch:** `codex/market-readme`
**Status:** Approved design

## Summary

Reposition the repository from a Swipelux-branded neobank starter into an
independent, provider-neutral reference project for autonomous-agent finance.
The README will market a future MCP server backed by a TypeScript SDK while
showing the existing neobank demo as the working reference application for the
underlying financial flows.

The primary audience is developers building autonomous agents and fintech
products. The primary call to action is to clone the repository and build.
Swipelux remains visible as the first provider adapter, not as the identity of
the project.

## Goals

- Make the GitHub README feel like a polished product landing page.
- Establish a clear category: financial primitives for autonomous agents.
- Define the intended MCP and TypeScript SDK product contract for later code.
- Show credible financial flows using real screenshots from the working demo.
- Explain policy-controlled autonomy as a core safety boundary.
- Keep current implementation status transparent and technically accurate.
- Correct stale repository names, clone commands, and configuration claims.

## Non-goals

- Implement the MCP server, SDK package, policy engine, or KYB workflow in this
  documentation change.
- Modify the demo UI solely to make screenshots look different.
- Present generated or mocked interfaces as existing application screens.
- Claim production readiness, regulatory coverage, autonomous custody, or
  unsupported settlement guarantees.
- Turn the README into complete API documentation.

## Positioning

### Name

**Neobank Primitives**

### Tagline

**Financial primitives for autonomous agents.**

### Hero description

> A provider-neutral MCP server and TypeScript SDK for identity, KYC/KYB,
> wallets, virtual accounts, deposits, payouts, stablecoin transfers, and
> policy-controlled execution. Clone the runnable reference app, explore
> realistic financial flows, and connect your preferred infrastructure
> provider.

### Calls to action

1. **Clone and build** — primary.
2. **View the demo** — secondary.

### Vocabulary

- Use **autonomous agents** for the runtime product vision.
- Use **AI coding agents** only for repository customization instructions.
- Use **value storage** to mean wallets, balances, and virtual accounts, not
  generic file or object storage.
- Use **transfer activity** when referring to existing demo history; avoid
  implying card purchases or a general ledger.
- Use **provider adapter** for infrastructure-specific integrations.
- Use **policy-controlled autonomy** for budgets, allowlists, limits, and human
  escalation.

## Truth Boundary And Implementation Status

The hero can speak confidently about the designed product, but the README must
include a compact status table near the architecture section.

### Working in the repository

- Zero-configuration, stateful neobank demo.
- Individual, pending, and verified business personas.
- Existing-customer selection and session entry.
- Individual customer creation and KYC initiation.
- Wallet creation and fiat/stablecoin balance display.
- EUR virtual-account issuance and account details.
- Recipients, payout quotes, SEPA payouts, and USDC wallet transfers.
- Deposit instructions, sandbox top-up, transfer states, and activity history.
- Stateful demo and live Swipelux sandbox data sources.
- Brand configuration, feature registry, integration seams, and quality gates.

### Product contract to implement next

- MCP server exposing normalized financial tools.
- Packaged TypeScript SDK shared by MCP tools and fintech applications.
- Policy engine for budgets, recipients, assets, rails, and approvals.
- Complete business creation and KYB initiation flow.
- Durable audit records and agent-oriented transaction receipts.
- Additional provider adapters.

### Explicit limitations

- The current repository has no runtime interface for autonomous agents.
- KYC can be initiated, but onboarding does not wait for verification approval
  before provisioning the remaining demo resources.
- Business customers and KYB status can be read, but business creation and KYB
  initiation are not implemented.
- Interactive payouts create SEPA recipients; SWIFT is represented in types and
  seeded history but not as a complete interactive flow.
- Authentication, approval operations, server-side credential handling,
  webhook ingestion, idempotency, reconciliation, and production operational
  controls remain implementation responsibilities.

## Primitive Model

The README groups the product into five visible primitive families.

| Primitive | Responsibility | Representative operations |
|---|---|---|
| Identity | Represent and verify people and businesses | create customer, start KYC/KYB, read verification status |
| Value storage | Hold and address fiat and stablecoin value | create wallet, issue virtual account, read balances |
| Transactions | Move or convert value across supported rails | fund, quote, convert, payout, wallet transfer |
| Policy | Constrain agent authority before execution | budgets, allowlists, asset limits, rail limits, escalation |
| Observability | Explain and audit financial state changes | status, receipt, failure, timeline, audit history |

## Agent-Native Architecture

The README will include a Mermaid diagram with this primary flow:

```text
Autonomous agent
    -> MCP tools
    -> policy engine
    -> TypeScript SDK
    -> provider adapter
    -> financial infrastructure
```

The runnable React reference app also calls the SDK boundary. Swipelux is shown
as the first adapter, alongside an explicit extension point for future adapters.

### Request lifecycle

1. An agent selects a typed MCP tool.
2. Input is schema-validated.
3. Policy evaluates the operation, amount, asset, rail, and recipient.
4. The operation executes automatically when within policy.
5. Exceptions pause for human approval rather than bypassing policy.
6. The provider response is normalized into a stable SDK result.
7. The agent receives a transaction state and auditable receipt.

### Policy model

The first product contract supports:

- Per-agent and per-period spending budgets.
- Allowed assets, currencies, and transaction rails.
- Approved or blocked recipients and destinations.
- Per-operation limits.
- Human escalation outside pre-authorized policy.
- Audit context containing agent identity, policy decision, and provider result.

## README Information Architecture

1. **Centered hero**
   - Name, tagline, concise description, badges, and primary actions.
   - Full-width cinematic cover image.
2. **Primitive surface**
   - Five compact cards or a GitHub-compatible table.
3. **See it working**
   - Four real demo screenshots and primitive-led captions.
4. **Agent-native architecture**
   - Mermaid system diagram and request lifecycle.
5. **MCP and SDK contract**
   - Short, labeled examples for identity, balance, quote, transfer, and status.
6. **Clone and build**
   - Correct personal-repository commands and zero-config demo instructions.
7. **Implementation status**
   - Working, next, and integration-responsibility columns.
8. **Provider adapters**
   - Provider-neutral contract with Swipelux as the first implementation.
9. **Make it yours**
   - Short AI coding-agent customization prompt.
10. **Quality and reference links**
    - Typecheck, test, lint, build, and relevant API documentation.

The README should stay scannable: short paragraphs, purposeful headings,
consistent tables, one architecture diagram, and no long marketing preamble.

## Visual System

The selected direction is a cinematic product story constrained to what GitHub
Markdown can render. Polish comes from composed image assets, real screenshots,
badges, tables, Mermaid, disciplined copy, and consistent spacing rather than
custom page CSS.

### Asset location

All README assets live under `docs/assets/readme/`.

### Hero cover

`docs/assets/readme/neobank-primitives-hero.png`

- Target size: 1600 x 900.
- Dark editorial background with restrained blue accents.
- Three real demo captures: bank payout, business dashboard, and onboarding.
- Center dashboard is dominant; the other two frames provide depth.
- Cover copy: MCP + TypeScript SDK, the tagline, and the five primitive names.
- Demo or sandbox state remains visible inside captured screens.

### Documentary screenshots

1. `business-dashboard.png`
   - Verified business persona.
   - EUR and USDC balances, virtual IBAN, and transfer activity.
   - Caption: **Hold and observe value.** Fiat, stablecoins, account details,
     and transfer history.
2. `identity-onboarding.png`
   - Customer, verification, wallet, and account provisioning steps.
   - Caption: **Provision a financial identity.** Customer, individual KYC,
     wallet, and virtual-account primitives.
3. `transaction-quote.png`
   - Recipient, amount, fee, rate, destination amount, and workflow explainer.
   - Caption: **Quote, authorize, and transfer.** Rates, fees, recipients,
     policy context, and execution state.
4. `deposit-rails.png`
   - Bank account instructions and Polygon wallet address.
   - Caption: **Fund across bank and crypto rails.** Virtual-account and
     stablecoin deposit instructions.

### Capture requirements

- Capture real application states from demo mode.
- Use deterministic personas and seeded data.
- Exclude API keys, credentials, personal data, local paths, and browser chrome.
- Preserve visible demo/sandbox labeling.
- Use consistent viewport dimensions and crop ratios.
- Optimize PNG files for GitHub without making text illegible.
- Do not add fictional policy UI to documentary screenshots.

## MCP And SDK Examples

Examples serve as an implementation contract and are labeled accordingly until
the packages exist. They should demonstrate a coherent naming scheme rather
than an exhaustive API.

Representative MCP tools:

- `identity.customer.create`
- `identity.verification.start`
- `storage.balance.get`
- `transactions.quote.create`
- `transactions.transfer.create`
- `transactions.transfer.get`
- `policy.evaluate`

The transaction example includes:

- Agent identity.
- Source wallet or account.
- Amount and asset.
- Recipient or destination.
- Policy decision.
- Normalized transaction state and receipt identifier.

## Failure And Safety Communication

- Validation errors return field-level, agent-readable failures.
- Policy denials explain the violated constraint without exposing secrets.
- Approval-required results are distinct from denials and execution failures.
- Provider failures are normalized while preserving a traceable provider code.
- Unknown transaction results remain pending or unknown; they must not be
  presented as failed or retried blindly.
- README examples must never imply that an agent can bypass policy or approval.

## Repository Copy Corrections

- Replace `swipelux/neobank-starter` clone commands with
  `andry-lebedev/neobank-primitives`.
- Rename the README title and remove stale starter-only positioning.
- Replace “Go live” language with “Connect sandbox” where describing the
  current application.
- Remove the stale `VITE_API_TOKEN` instruction; the current app uses in-app
  sandbox-key storage.
- Retain Swipelux API reference links under the first-adapter section.

## Verification

### Documentation and assets

- Render the README on GitHub or in a GitHub-compatible preview.
- Confirm every image path and anchor resolves.
- Confirm the hero remains legible at common GitHub content widths.
- Confirm the screenshot grid works on desktop and collapses acceptably on
  narrow screens.
- Check all clone, demo, and documentation links.
- Review every present-tense claim against the status table.
- Confirm screenshots contain no secrets or personal information.
- Run `git diff --check`.

### Repository checks

The repository guide requires:

- `npm run typecheck`
- `npm test`
- `npm run lint`
- `npm run build`

At design time, the untouched repository fails `npm run typecheck` on macOS
because `AppContext.tsx`/`appContext.ts` and
`ExplainerContext.tsx`/`explainerContext.ts` differ only by case. The README
task will not silently fix this unrelated baseline issue. Verification reports
it explicitly and runs the remaining checks where they are independently
executable.

## Acceptance Criteria

- README leads with the approved agent-native positioning and clone/build CTA.
- Visual composition follows the approved cinematic direction.
- One hero cover and four real demo screenshots render from repository assets.
- Current capabilities and future MCP/SDK contract are clearly distinguishable.
- Provider-neutral architecture is clear, with Swipelux as the first adapter.
- Policy-controlled autonomy is explained through both prose and data flow.
- README contains a concise MCP/SDK implementation contract for subsequent
  development.
- Repository names, commands, and configuration guidance are current.
- No unsupported production, KYB, settlement, or autonomous-execution claim is
  presented as already implemented without a status qualifier.
