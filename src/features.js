import { Home, Send as SendIcon, PlusCircle, User } from 'lucide-react'
import Dashboard from './pages/Dashboard'
import AddMoney from './pages/AddMoney'
import Send from './pages/Send'
import History from './pages/History'
import Profile from './pages/Profile'
import Onboarding from './pages/Onboarding'

// Single source of truth for pages + bottom-nav.
// Client AI: drop a feature with `enabled: false`; add one by pushing an entry.
// `inNav` + `navOrder` control the bottom tab bar; `navIcon`/`navLabel` its display.
export const features = [
  { id: 'dashboard', route: '/',          element: Dashboard,  enabled: true,  inNav: true,  navOrder: 0, navIcon: Home,       navLabel: 'Home',      end: true },
  { id: 'send',      route: '/send',      element: Send,       enabled: true,  inNav: true,  navOrder: 1, navIcon: SendIcon,   navLabel: 'Send',      end: false },
  { id: 'add-money', route: '/add-money', element: AddMoney,   enabled: true,  inNav: true,  navOrder: 2, navIcon: PlusCircle, navLabel: 'Add money', end: false },
  { id: 'profile',   route: '/profile',   element: Profile,    enabled: true,  inNav: true,  navOrder: 3, navIcon: User,       navLabel: 'Profile',   end: false },
  { id: 'history',   route: '/history',   element: History,    enabled: true,  inNav: false, navOrder: 99 },
  { id: 'onboarding',route: '/onboarding',element: Onboarding, enabled: true,  inNav: false, navOrder: 99 },
]

export const routeItems = features.filter(f => f.enabled)
export const navItems = features
  .filter(f => f.enabled && f.inNav)
  .sort((a, b) => a.navOrder - b.navOrder)
