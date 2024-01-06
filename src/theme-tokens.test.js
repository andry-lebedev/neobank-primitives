import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { basename, dirname, join } from 'node:path'
import { FORBIDDEN, EXEMPT, UI_DIRS } from './theme-forbidden'

// Seam 1 guard: components must use semantic tokens, never raw color literals.
// DevPanel is the documented exception (internal dev tool, not client surface).
const SRC = dirname(fileURLToPath(import.meta.url))

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name)
    return e.isDirectory() ? walk(p) : [p]
  })
}

const files = UI_DIRS
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
