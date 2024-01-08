import type { BrandConfig } from './lib/brand-schema'

/*
 * ─── BRAND CONFIG — re-brand edit point 2 of 2 ───────────────────────────────
 * Name, logo, copy tone, locale and feature toggles. Validated by
 * src/lib/brand-schema.ts (test fails on malformed edits).
 * Colors/font/radius live in src/theme.css.
 */
export const brand: BrandConfig = {
  name: 'Swipelux',
  tagline: 'Banking, powered by stablecoins',
  logoSrc: '/logo.svg',
  greeting: 'Welcome back',
  locale: 'en-IE',
  currency: 'EUR',
  features: {
    send: true,
    addMoney: true,
    activity: true,
    profile: true,
    onboarding: true,
  },
  explainerDefaultOn: false,
}
