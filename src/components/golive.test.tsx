import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { setSourceOverride } from '@/data'
import { DemoBanner } from './DemoBanner'
import * as mode from '@/data/mode'

describe('demo banner + go live', () => {
  beforeEach(() => { localStorage.clear(); vi.stubEnv('VITE_API_TOKEN', '') })
  afterEach(() => { cleanup(); setSourceOverride(null); vi.unstubAllEnvs(); vi.restoreAllMocks() })

  it('shows the banner with a Go live button in demo mode', () => {
    renderWithProviders(<DemoBanner />)
    expect(screen.getByText(/demo data/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /go live/i })).toBeInTheDocument()
  })

  it('invalid key → error shown, stays demo', async () => {
    vi.spyOn(mode, 'validateApiKey').mockResolvedValue(false)
    const user = userEvent.setup()
    renderWithProviders(<DemoBanner />)
    await user.click(screen.getByRole('button', { name: /go live/i }))
    await user.type(screen.getByLabelText(/api key/i), 'sk_bad')
    await user.click(screen.getByRole('button', { name: /connect/i }))
    expect(await screen.findByText(/key was rejected/i)).toBeInTheDocument()
    expect(mode.getMode()).toBe('demo')
  })

  it('valid key → setApiKey called', async () => {
    vi.spyOn(mode, 'validateApiKey').mockResolvedValue(true)
    const setKey = vi.spyOn(mode, 'setApiKey')
    const user = userEvent.setup()
    renderWithProviders(<DemoBanner />)
    await user.click(screen.getByRole('button', { name: /go live/i }))
    await user.type(screen.getByLabelText(/api key/i), 'sk_good')
    await user.click(screen.getByRole('button', { name: /connect/i }))
    await vi.waitFor(() => expect(setKey).toHaveBeenCalledWith('sk_good'))
  })
})
