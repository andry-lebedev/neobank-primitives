# Live mode

Live mode selects the API-backed `DataSource` and uses the configured customer
session to load financial data. The UI continues to depend on domain methods,
not on transport-specific response shapes.

## Connection flow

1. Provide an API key through the supported in-app connection flow.
2. Validate the key before changing modes.
3. Resolve or select a customer identifier.
4. Load customer, account, recipient, and transfer state.
5. Return to demo mode if the connection is removed.

Treat the API key as secret material. Do not commit it, place it in screenshots,
or include it in bug reports. Live mode is an integration surface, not an
authentication system for end users.

When debugging, identify whether a failure comes from key validation, customer
selection, the adapter request, or domain mapping before changing page code.
