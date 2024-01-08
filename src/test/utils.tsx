import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactElement } from 'react'
import { AppProvider } from '@/context/AppContext'
import { ExplainerProvider } from '@/context/ExplainerContext'
import { setSourceOverride } from '@/data'
import { withTracking } from '@/data/tracked'
import { createDemoSource } from '@/data/demo/source'
import { demoStore } from '@/data/demo/store'

// Renders UI inside the full provider stack against a fresh, zero-latency
// demo source. Call setSourceOverride(null) in afterEach.
export function renderWithProviders(ui: ReactElement, { route = '/' } = {}) {
  sessionStorage.clear()
  localStorage.clear()
  demoStore.reset()
  setSourceOverride(withTracking(createDemoSource({ latencyMs: 0 })))
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AppProvider>
        <ExplainerProvider>{ui}</ExplainerProvider>
      </AppProvider>
    </MemoryRouter>,
  )
}
