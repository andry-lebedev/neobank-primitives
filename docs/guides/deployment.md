# Deployment

The production build is a static Vite application:

```bash
npm run build
```

Deploy the generated `dist/` directory with a host that falls back to
`index.html` for client-side routes. Verify direct navigation to every enabled
feature, not only navigation from the home page.

## Before release

- run every quality command
- verify demo mode without environment configuration
- confirm live configuration is injected through the intended secret boundary
- review caching rules for the HTML entry point and hashed assets
- test the smallest supported viewport
- verify disconnect and error recovery paths

Do not place long-lived privileged service credentials in Vite environment
variables; values delivered to the browser are not server-side secrets.
