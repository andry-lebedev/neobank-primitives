# Feature registry

`src/features.tsx` is the source of truth for routes and navigation. A feature
entry connects a page component, route, label, icon, and enabled state.

## Adding a feature

1. Create one focused page in `src/pages/`.
2. Read domain state through `useApp()`.
3. Add the feature to the registry.
4. Connect its enabled state to `brand.config.ts` when it is optional.
5. Add explainer copy for financial actions the feature introduces.

Do not create a second navigation list or a parallel router table. Keeping route
and navigation metadata together prevents hidden pages, stale links, and
different desktop and mobile behavior.

A disabled feature should disappear from navigation and routing as one product
decision rather than relying on page-level redirects.
