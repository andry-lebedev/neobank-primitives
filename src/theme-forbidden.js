// Forbidden raw color literals — single source of truth consumed by BOTH the
// vitest build gate (src/guards/theme-tokens.test.ts) and the ESLint rule
// (eslint.config.js). Components/pages must use semantic tokens
// (bg-background, text-primary, text-success, …) so a re-brand is pure
// token editing. src/components/ui is exempt (generated shadcn primitives).

export const FORBIDDEN = [
  // Tailwind palette utilities: text-gray-500, bg-purple-500/20, …
  /\b(?:text|bg|border|ring|from|to|via|divide|placeholder|fill|stroke|outline|shadow|ring-offset)-(?:gray|slate|zinc|neutral|stone|green|red|blue|purple|amber|yellow|emerald|orange|teal|cyan|pink|indigo|violet|rose|lime|sky|fuchsia)-\d/,
  // Bare white/black utilities: text-white, bg-black
  /\b(?:text|bg|border|ring|placeholder|fill|stroke|divide)-(?:white|black)\b/,
  // Arbitrary hex values in classes: bg-[#0F172A]
  /-\[#[0-9a-fA-F]{3,8}\]/,
]

export const UI_DIRS = ['components', 'pages']
export const EXEMPT_DIRS = ['components/ui']
