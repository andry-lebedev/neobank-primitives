# Release checklist

## Product

- exercise home, send, add-money, activity, profile, and customer entry
- verify enabled and disabled feature combinations
- confirm demo reset returns to a known state
- review pending, success, empty, and error states

## Integration

- validate connection and disconnect behavior
- verify customer restoration and switching
- confirm tracked events contain no sensitive values
- test adapter errors and recovery

## Experience

- check keyboard navigation, focus, contrast, and reduced motion
- test mobile and desktop layouts
- review money, currency, and date formatting

## Engineering

- run typecheck, tests, lint, complexity gate, and production build
- inspect the final diff for secrets and unrelated files
- document deployment configuration and rollback ownership
