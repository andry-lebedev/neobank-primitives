# Security boundaries

The starter demonstrates financial product flows, but a production deployment
must supply its own authentication, authorization, secret management, and
operational controls.

## Minimum rules

- never commit API keys or customer secrets
- keep privileged credentials out of browser-delivered bundles
- authorize customer access on a trusted backend
- validate amounts, currencies, recipients, and destinations server-side
- avoid personal and financial data in analytics events
- use explicit confirmation for irreversible operations
- redact sensitive values from errors and support material

Demo data is fictional and must remain obviously so. Live mode should be treated
as an adapter demonstration until the host system enforces production-grade
identity and policy boundaries.
