import { describe, it, expect } from 'vitest'
import { features, navItems, routeItems } from './features'

describe('feature registry', () => {
  it('every feature has required fields', () => {
    for (const f of features) {
      expect(typeof f.id).toBe('string')
      expect(typeof f.route).toBe('string')
      expect(f.element).toBeTruthy()
      expect(typeof f.enabled).toBe('boolean')
    }
  })

  it('routeItems includes only enabled features', () => {
    expect(routeItems.every(f => f.enabled)).toBe(true)
  })

  it('navItems are enabled, inNav, and sorted by navOrder', () => {
    expect(navItems.every(f => f.enabled && f.inNav)).toBe(true)
    const orders = navItems.map(f => f.navOrder)
    expect(orders).toEqual([...orders].sort((a, b) => a - b))
  })

  it('includes the core neobank routes', () => {
    const routes = routeItems.map(f => f.route)
    expect(routes).toEqual(expect.arrayContaining(['/', '/send', '/add-money', '/profile', '/history', '/onboarding']))
  })
})
