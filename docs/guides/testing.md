# Testing

The test suite focuses on domain behavior, data-source contracts, contexts, and
critical user flows. Vitest provides the runner and React Testing Library covers
rendered interactions.

## Test layers

- unit tests for formatting, validation, and state transitions
- contract tests shared by demo and live-facing adapters where practical
- context tests for loading, refresh, and mode changes
- page tests for important form and navigation behavior
- guard tests for theme tokens and configuration validity

Prefer observable outcomes over implementation details. A transfer test should
assert validation, submission, and resulting state rather than private hook
calls.

Run `npm test` during development and the full quality command set before
publishing a change.
