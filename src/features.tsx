import type { ComponentType } from 'react'
import { CircleUser, House, List, Plus, SendHorizontal, type LucideIcon } from 'lucide-react'
import Home from './pages/Home'
import Send from './pages/Send'
import AddMoney from './pages/AddMoney'
import Activity from './pages/Activity'
import Profile from './pages/Profile'
import Onboarding from './pages/Onboarding'
import { brand } from './brand.config'

export interface Feature {
  id: string
  route: string
  element: ComponentType
  enabled: boolean
  inNav: boolean
  navOrder: number
  navIcon?: LucideIcon
  navLabel?: string
  end?: boolean
}

// DEPTH SEAM — single source of truth for pages + nav.
// A feature EXISTS here; whether it's ON comes from brand.config.ts toggles.
// To ADD a feature: create a page in src/pages/ and push an entry here.
export const features: Feature[] = [
  { id: 'home',       route: '/',           element: Home,       enabled: true,                      inNav: true,  navOrder: 0, navIcon: House,          navLabel: 'Home',      end: true },
  { id: 'send',       route: '/send',       element: Send,       enabled: brand.features.send,       inNav: true,  navOrder: 1, navIcon: SendHorizontal, navLabel: 'Send' },
  { id: 'add-money',  route: '/add-money',  element: AddMoney,   enabled: brand.features.addMoney,   inNav: true,  navOrder: 2, navIcon: Plus,           navLabel: 'Add money' },
  { id: 'activity',   route: '/activity',   element: Activity,   enabled: brand.features.activity,   inNav: true,  navOrder: 3, navIcon: List,           navLabel: 'Activity' },
  { id: 'profile',    route: '/profile',    element: Profile,    enabled: brand.features.profile,    inNav: true,  navOrder: 4, navIcon: CircleUser,     navLabel: 'Profile' },
  { id: 'onboarding', route: '/onboarding', element: Onboarding, enabled: brand.features.onboarding, inNav: false, navOrder: 99 },
]

export const routeItems = features.filter(f => f.enabled)
export const navItems = features.filter(f => f.enabled && f.inNav).sort((a, b) => a.navOrder - b.navOrder)
