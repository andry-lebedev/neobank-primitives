/// <reference types="node" />

import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { FORBIDDEN, UI_DIRS, EXEMPT_DIRS } from '../theme-forbidden.js'

const SRC = join(__dirname, '..')

function walk(dir: string): string[] {
  let out: string[] = []
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) out = out.concat(walk(full))
    else if (/\.(ts|tsx)$/.test(name) && !/\.test\./.test(name)) out.push(full)
  }
  return out
}

describe('theme token guard', () => {
  it('no raw color literals in components/pages', () => {
    const offenders: string[] = []
    for (const dir of UI_DIRS) {
      let files: string[]
      try {
        files = walk(join(SRC, dir))
      } catch {
        continue // dir may not exist yet
      }
      for (const file of files) {
        const rel = relative(SRC, file).replace(/\\/g, '/')
        if (EXEMPT_DIRS.some(ex => rel.startsWith(ex))) continue
        const lines = readFileSync(file, 'utf8').split('\n')
        lines.forEach((line, i) => {
          for (const re of FORBIDDEN) {
            if (re.test(line)) offenders.push(`${rel}:${i + 1}  ${line.trim()}`)
          }
        })
      }
    }
    expect(offenders, `Raw color literals found — use semantic tokens:\n${offenders.join('\n')}`).toEqual([])
  })

  it('flags raw hex in inline style objects', () => {
    const samples = [
      `style={{ color: '#fff' }}`,
      `style={{ backgroundColor: "#0F172A" }}`,
      `<div style={{ borderColor: '#abc123' }} />`,
    ]
    for (const s of samples) {
      expect(FORBIDDEN.some(re => re.test(s)), s).toBe(true)
    }
  })
})
