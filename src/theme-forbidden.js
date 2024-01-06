// Seam 1 single source of truth: forbidden raw color literals.
// Consumed by BOTH the vitest build gate (theme-tokens.test.js) and the
// eslint editor-time rule (eslint.config.js). Components must use semantic
// tokens, never raw Tailwind color literals. DevPanel is the documented
// exception (internal dev tool, not a client surface).

export const FORBIDDEN = [
  // Tailwind color-scale utilities: text-gray-500, bg-purple-500/20, placeholder-gray-600, ...
  /\b(?:text|bg|border|ring|from|to|via|divide|placeholder|fill|stroke|outline|shadow|ring-offset)-(?:gray|slate|zinc|neutral|stone|green|red|blue|purple|amber|yellow|emerald|orange|teal|cyan|pink|indigo|violet|rose|lime|sky|fuchsia)-\d/,
  // Bare white/black utilities: text-white, bg-black, border-white
  /\b(?:text|bg|border|ring|placeholder|fill|stroke|divide)-(?:white|black)\b/,
  // Arbitrary hex values in classes: bg-[#0F172A]
  /-\[#[0-9a-fA-F]{3,8}\]/,
]

export const EXEMPT = new Set(['DevPanel.tsx'])

export const UI_DIRS = ['components', 'pages']
