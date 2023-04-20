# Integration slots

`src/integrations/index.ts` exposes named seams for application-specific
services without coupling the starter to a vendor.

- `track` forwards typed product events
- `onSession` observes session changes
- `notify` connects user-facing or operational notifications
- `resolveCustomerId` restores a customer selection
- `setCustomerId` persists a customer selection

Keep the exported names and call signatures stable. Implementations may call an
analytics SDK, host application, storage layer, or backend endpoint, but callers
should not need to know which one.

Integration functions must fail safely. A telemetry outage must not block a
transfer form, and an unavailable persistence layer should fall back to explicit
customer selection rather than inventing an identity.
