import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AppProvider } from './AppContext'
import { useApp } from './useApp'
import { setSourceOverride } from '@/data'
import { withTracking } from '@/data/tracked'
import { createDemoSource } from '@/data/demo/source'
import { demoStore } from '@/data/demo/store'

function Probe() {
  const { customer, wallet, loading, mode } = useApp()
  if (loading) return <p>loading…</p>
  return (
    <div>
      <p>mode:{mode}</p>
      <p>name:{customer?.personal?.firstName}</p>
      <p>balances:{wallet?.balances?.length}</p>
    </div>
  )
}

describe('AppProvider', () => {
  beforeEach(() => {
    sessionStorage.clear()
    localStorage.clear()
    vi.stubEnv('VITE_API_TOKEN', '')
    demoStore.reset()
    setSourceOverride(withTracking(createDemoSource({ latencyMs: 0 })))
  })
  afterEach(() => setSourceOverride(null))

  it('loads the demo persona in demo mode', async () => {
    render(<AppProvider><Probe /></AppProvider>)
    expect(await screen.findByText('name:Alex')).toBeInTheDocument()
    expect(screen.getByText('mode:demo')).toBeInTheDocument()
    expect(screen.getByText('balances:2')).toBeInTheDocument()
  })
})
