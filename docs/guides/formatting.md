# Money and date formatting

Formatting is part of the product contract. Amounts and dates should use the
configured locale while preserving the currency and timestamp supplied by the
domain model.

## Money

- format with `Intl.NumberFormat`
- use the transaction's currency when available
- do not calculate with formatted strings
- make negative and pending amounts visually distinct without relying on color

## Dates

- keep stored and transported timestamps unambiguous
- format only at the display boundary
- use relative labels only when the exact time remains accessible
- handle invalid or absent timestamps without rendering `Invalid Date`

Tests should use fixed inputs and explicit locales so results do not depend on
the machine running the suite.
