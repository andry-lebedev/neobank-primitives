import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { AppProvider } from './context/AppContext'
import { ExplainerProvider } from './context/ExplainerContext'
import { useApp } from './context/useApp'
import { AppShell } from './components/AppShell'
import LiveEntry from './pages/LiveEntry'
import { navItems, routeItems } from './features'

// Live mode without a customer id → session entry (onboarding stays reachable).
function SessionGate({ children }: { children: ReactNode }) {
  const { mode, customerId } = useApp()
  const location = useLocation()
  if (mode === 'live' && !customerId && location.pathname !== '/onboarding') {
    return <LiveEntry />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <ExplainerProvider>
          <SessionGate>
            <AppShell nav={navItems}>
              <Routes>
                {routeItems.map(f => (
                  <Route key={f.id} path={f.route} element={<f.element />} />
                ))}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AppShell>
          </SessionGate>
        </ExplainerProvider>
      </AppProvider>
    </BrowserRouter>
  )
}
