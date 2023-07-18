# Architecture map

The application is organized around a small set of stable boundaries:

- `src/data/types.ts` defines financial domain types and the `DataSource`
- `src/data/demo/` provides a stateful local implementation
- `src/data/live/` adapts the live API
- `src/context/` owns application and explainer state
- `src/features.tsx` defines routes and navigation
- `src/integrations/` exposes host-application seams
- `src/components/` contains shared presentation
- `src/pages/` assembles domain state into user flows

The dependency direction runs from pages toward domain contracts, never from
pages directly into transport details. Cross-cutting event tracking wraps data
operations rather than being repeated in view components.

Preserve these boundaries when extending the starter. A new backend belongs
behind `DataSource`; a new page belongs in the feature registry; a host service
belongs behind an integration slot.
