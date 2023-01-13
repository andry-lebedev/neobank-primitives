import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Unmount React trees between tests so renders don't leak across cases in the
// same file (vitest globals are off, so RTL's auto-cleanup isn't registered).
afterEach(cleanup)
