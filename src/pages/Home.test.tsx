import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils'
import { setSourceOverride } from '@/data'
import Home from './Home'

beforeEach(() => vi.stubEnv('VITE_API_TOKEN', ''))
afterEach(() => { setSourceOverride(null); vi.unstubAllEnvs() })

describe('Home', () => {
  it('shows greeting, balance and recent activity from the demo persona', async () => {
    renderWithProviders(<Home />)
    expect(await screen.findByText(/Welcome back, Alex/)).toBeInTheDocument()
    expect(screen.getByText(/21,930/)).toBeInTheDocument()       // EUR balance
    expect(screen.getByText(/2,450\.00 USDC/)).toBeInTheDocument() // secondary balance
    expect(screen.getAllByText('Deposit').length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: /send/i })).toBeInTheDocument()
  })
})
