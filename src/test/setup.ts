import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Node exposes an experimental `localStorage` global in recent releases. In
// worker processes without `--localstorage-file` it is only a partial object,
// so install deterministic browser-compatible storage at the public seam.
function createMemoryStorage(): Storage {
  const values = new Map<string, string>()
  return {
    get length() { return values.size },
    clear: () => values.clear(),
    getItem: key => values.get(key) ?? null,
    key: index => [...values.keys()][index] ?? null,
    removeItem: key => { values.delete(key) },
    setItem: (key, value) => { values.set(key, String(value)) },
  }
}

Object.defineProperties(globalThis, {
  localStorage: { configurable: true, value: createMemoryStorage() },
  sessionStorage: { configurable: true, value: createMemoryStorage() },
})

// Unmount React trees between tests so renders don't leak across cases in the
// same file (vitest globals are off, so RTL's auto-cleanup isn't registered).
afterEach(cleanup)
