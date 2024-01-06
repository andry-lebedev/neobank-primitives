import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { basename, dirname, join } from 'node:path'

// Seam 1 guard: components must use semantic tokens, never raw color literals.
// DevPanel is the documented exception (internal dev tool, not client surface).
const SRC = dirname(fileURLToPath(import.meta.url))
const EXEMPT = new Set(['DevPanel.jsx'])

const FORBIDDEN = [
  // Tailwind color-scale utilities: text-gray-500, bg-purple-500/20, placeholder-gray-600, ...
  /\b(?:text|bg|border|ring|from|to|via|divide|placeholder|fill|stroke|outline|shadow|ring-offset)-(?:gray|slate|zinc|neutral|stone|green|red|blue|purple|amber|yellow|emerald|orange|teal|cyan|pink|indigo|violet|rose|lime|sky|fuchsia)-\d/,
  // Bare white/black utilities: text-white, bg-black, border-white
  /\b(?:text|bg|border|ring|placeholder|fill|stroke|divide)-(?:white|black)\b/,
  // Arbitrary hex values in classes: bg-[#0F172A]
  /-\[#[0-9a-fA-F]{3,8}\]/,
]

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name)
    return e.isDirectory() ? walk(p) : [p]
  })
}

const files = ['components', 'pages']
  .map((dir) => join(SRC, dir))
  .filter((dir) => existsSync(dir))
  .flatMap((dir) => walk(dir))
  .filter(
    (p) =>
      /\.jsx?$/.test(p) &&
      !/\.test\.jsx?$/.test(p) &&
      !EXEMPT.has(basename(p)),
  )

describe('Seam 1 — no raw color literals in src', () => {
  for (const file of files) {
    const rel = file.slice(SRC.length + 1)
    it(`${rel} uses only semantic tokens`, () => {
      const src = readFileSync(file, 'utf8')
      const hits = []
      for (const re of FORBIDDEN) {
        const g = new RegExp(re, 'g')
        let m
        while ((m = g.exec(src))) hits.push(m[0])
      }
      expect(hits).toEqual([])
    })
  }
})
