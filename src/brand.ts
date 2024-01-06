// BRAND SLOT (Seam 1 companion) — the single place a client sets brand identity.
// Color/font live in tailwind.config.js; name + logo live here.
export interface Brand {
  name: string
  logoSrc: string
}

export const brand: Brand = {
  name: 'Swipelux',
  logoSrc: '/favicon.svg',
}
