import { describe, it, expect } from 'vitest'
import { brandSchema } from './brand-schema'
import { brand } from '../brand.config'

describe('brand config', () => {
  it('shipped brand.config.ts satisfies the schema', () => {
    expect(() => brandSchema.parse(brand)).not.toThrow()
  })

  it('rejects a broken edit with a readable error', () => {
    const broken = { ...brand, currency: 'EURO', name: '' }
    const result = brandSchema.safeParse(broken)
    expect(result.success).toBe(false)
  })
})
