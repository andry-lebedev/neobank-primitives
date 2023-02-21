# Branding

The starter keeps client identity in two intentional seams:

- `src/brand.config.ts` contains product name, copy, locale, currency, and
  feature switches.
- `src/theme.css` contains colors, typography, spacing feel, and radius tokens.

Change those files before editing components. Shared components consume semantic
tokens, so a focused theme update should flow through every page.

## Branding checklist

- replace the name, tagline, greeting, and logo treatment
- set locale and display currency deliberately
- check light backgrounds and status colors for contrast
- verify desktop navigation and the mobile tab bar
- exercise empty, loading, success, and error states
- run the brand schema and theme-token guards

Avoid raw color literals in pages and components. Add or adjust a semantic token
when the design needs a new reusable role.
