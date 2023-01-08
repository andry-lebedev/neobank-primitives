import { demoSource } from './demo/source'
import { liveSource } from './live/source'
import { withTracking } from './tracked'
import { getMode } from './mode'
import type { DataSource } from './types'

let override: DataSource | null = null

// Test hook: inject a source (pass null to restore normal resolution).
export function setSourceOverride(source: DataSource | null): void {
  override = source
}

export function getSource(): DataSource {
  if (override) return override
  return withTracking(getMode() === 'live' ? liveSource : demoSource)
}
