# Troubleshooting

Start by locating the failing boundary instead of changing multiple layers at
once.

## The app does not start

Confirm the supported Node version, reinstall dependencies, and run typecheck
and build separately to expose the first compiler error.

## Demo data looks stale

Use the in-app reset path and reload. Demo state is browser-local and may persist
through navigation.

## Live mode cannot connect

Check key validation, network access, customer selection, and adapter mapping in
that order. Redact credentials and personal data from diagnostics.

## A page is missing

Check its feature-registry entry and enabled flag. Routes and navigation derive
from the same registry.

## Styling is inconsistent

Look for a missing semantic token before editing individual components.
