import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { setSourceOverride } from '@/data'
import { Toaster } from '@/components/Toaster'
import AddMoney from './AddMoney'

beforeEach(() => vi.stubEnv('VITE_API_TOKEN', ''))
afterEach(() => { cleanup(); setSourceOverride(null); vi.unstubAllEnvs() })

describe('AddMoney', () => {
  it('shows SEPA details and wallet address', async () => {
    renderWithProviders(<AddMoney />)
    expect(await screen.findByText(/IE29/)).toBeInTheDocument()
    expect(screen.getByText(/0x71C9/)).toBeInTheDocument()
  })

  it('simulated deposit adds a transfer', async () => {
    const user = userEvent.setup()
    // Toaster mounted alongside: success copy arrives via the notify() slot
    renderWithProviders(<><AddMoney /><Toaster /></>)
    await user.click(await screen.findByRole('button', { name: /simulate/i }))
    expect(await screen.findByText(/deposit created/i)).toBeInTheDocument()
  })
})
