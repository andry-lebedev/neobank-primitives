import { describe, it, expect } from 'vitest'
import { features, routeItems, navItems } from './features'
import { brand } from './brand.config'

describe('feature registry', () => {
  it('disabled features produce no route and no nav entry', () => {
    for (const f of features) {
      if (!f.enabled) {
        expect(routeItems.find(r => r.id === f.id)).toBeUndefined()
        expect(navItems.find(n => n.id === f.id)).toBeUndefined()
      }
    }
  })

  it('toggles mirror brand.config', () => {
    expect(features.find(f => f.id === 'send')?.enabled).toBe(brand.features.send)
    expect(features.find(f => f.id === 'activity')?.enabled).toBe(brand.features.activity)
  })

  it('nav is sorted and home is always present', () => {
    const orders = navItems.map(n => n.navOrder)
    expect([...orders].sort((a, b) => a - b)).toEqual(orders)
    expect(routeItems.find(r => r.route === '/')).toBeDefined()
  })
})
