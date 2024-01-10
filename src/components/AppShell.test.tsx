import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import { Home } from 'lucide-react'
import { renderWithProviders } from '@/test/utils'
import { setSourceOverride } from '@/data'
import { AppShell, type NavItem } from './AppShell'

beforeEach(() => vi.stubEnv('VITE_API_TOKEN', ''))
afterEach(() => { cleanup(); setSourceOverride(null); vi.unstubAllEnvs() })

const nav: NavItem[] = [
  { id: 'home', route: '/', navIcon: Home, navLabel: 'Home', end: true },
]

describe('AppShell', () => {
  it('renders brand, nav, explainer toggle and demo banner', async () => {
    renderWithProviders(<AppShell nav={nav}><p>page body</p></AppShell>)
    expect(await screen.findByText('page body')).toBeInTheDocument()
    expect(screen.getAllByText('Swipelux').length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: /home/i }).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /how it works/i })).toBeInTheDocument()
    expect(screen.getByText(/demo data/i)).toBeInTheDocument()
  })

  it('hides the back button on home, shows it on sub-pages', () => {
    const { unmount } = renderWithProviders(<AppShell nav={nav}><p>body</p></AppShell>, { route: '/' })
    expect(screen.queryByRole('button', { name: /go back/i })).toBeNull()
    unmount()
    renderWithProviders(<AppShell nav={nav}><p>body</p></AppShell>, { route: '/send' })
    expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument()
  })

  it('wraps routed content in the page-in transition', () => {
    const { container } = renderWithProviders(<AppShell nav={nav}><p>body</p></AppShell>)
    expect(container.querySelector('.animate-page-in')).not.toBeNull()
  })
})
