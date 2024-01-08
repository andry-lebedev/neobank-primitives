import { NavLink } from 'react-router-dom'
import { Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { DemoBanner } from './DemoBanner'
import { ExplainerDrawer } from './ExplainerDrawer'
import { Toaster } from './Toaster'
import { useApp } from '@/context/useApp'
import { useExplainer } from '@/context/useExplainer'
import { brand } from '../brand.config'
import { cn } from '@/lib/utils'

export interface NavItem {
  id: string
  route: string
  navIcon?: LucideIcon
  navLabel?: string
  end?: boolean
}

export function AppShell({ nav, children }: { nav: NavItem[]; children: ReactNode }) {
  const { mode, customer } = useApp()
  const { open, toggle } = useExplainer()
  const initials = [customer?.personal?.firstName?.[0], customer?.personal?.lastName?.[0]].filter(Boolean).join('') || '•'

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex flex-col items-center gap-1 rounded-lg p-2 text-[10px] font-medium transition-colors md:flex-row md:justify-center',
      isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
    )

  return (
    <div className="min-h-screen bg-background">
      <DemoBanner />

      {/* Desktop sidebar */}
      <nav aria-label="Main" className="fixed inset-y-0 left-0 z-30 hidden w-16 flex-col items-center gap-2 border-r bg-card pt-4 md:flex">
        <img src={brand.logoSrc} alt={brand.name} className="mb-4 size-8 rounded-lg" />
        {nav.map(item => {
          const Icon = item.navIcon
          return (
            <NavLink key={item.id} to={item.route} end={item.end} className={linkClass} aria-label={item.navLabel}>
              {Icon && <Icon className="size-5" />}
            </NavLink>
          )
        })}
      </nav>

      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur md:pl-16">
        <div className="mx-auto flex h-14 w-full max-w-md items-center justify-between px-4">
          <span className="flex items-center gap-2 font-bold md:hidden">
            <img src={brand.logoSrc} alt="" className="size-6 rounded-md" /> {brand.name}
          </span>
          <span className="hidden items-center gap-2 font-bold md:flex">{brand.name}</span>
          <div className="flex items-center gap-2">
            {mode === 'live' && (
              <span className="flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-[10px] font-semibold text-success">
                <span className="size-1.5 rounded-full bg-success" /> Live · sandbox
              </span>
            )}
            <Button variant={open ? 'default' : 'outline'} size="sm" className="h-7 gap-1 rounded-full px-3 text-xs" onClick={toggle}>
              <Zap className="size-3" /> How it works
            </Button>
            <span className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {initials}
            </span>
          </div>
        </div>
      </header>

      {/* Centered content column — the explainer floats over it, so it never shifts on open */}
      <main className="md:pl-16">
        <div className="mx-auto w-full max-w-md px-4 pb-28 pt-6 md:pb-12">{children}</div>
      </main>

      {/* Mobile bottom tabs */}
      <nav aria-label="Main mobile" className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
        {nav.map(item => {
          const Icon = item.navIcon
          return (
            <NavLink key={item.id} to={item.route} end={item.end} className={linkClass}>
              {Icon && <Icon className="size-5" />}
              {item.navLabel}
            </NavLink>
          )
        })}
      </nav>

      <ExplainerDrawer />
      <Toaster />
    </div>
  )
}
