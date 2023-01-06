# Tailored Demo Spec — <Client Name>

> Filled by the wizard in `PROMPT.md`. Client approves this before any code is written.

## Brand
- Company name: <...>
- Logo: <path or URL>
- Accent color: <#hex>
- Surface/base color: <#hex>
- Card color: <#hex>
- Font: <...>

## Features
| Feature | Keep / Drop / Add | Notes |
|---------|-------------------|-------|
| Dashboard | keep | |
| Send | keep | |
| Add money | keep | |
| Profile | keep | |
| History | keep | |
| <new feature> | add | route, purpose |

## Integrations (named slots)
| Slot | Wire to | Notes |
|------|---------|-------|
| `track` | <provider / none> | |
| `onSession` | <store / none> | |
| `notify` | <toast default / their system> | |
| `resolveCustomerId` | <source> | |
| `setCustomerId` | <session store / localStorage default> | |

## Copy / Locale
- <changes or "none">

## Out of scope (unchanged)
- Swipelux API layer (`src/api/*`), `AppContext` data binding, auth beyond `resolveCustomerId`, `.env`.
