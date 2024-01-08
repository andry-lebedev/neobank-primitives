import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils'
import { setSourceOverride } from '@/data'
import Profile from './Profile'

beforeEach(() => vi.stubEnv('VITE_API_TOKEN', ''))
afterEach(() => { setSourceOverride(null); vi.unstubAllEnvs() })

describe('Profile', () => {
  it('shows customer, verification, wallet, connection and tailoring sections', async () => {
    renderWithProviders(<Profile />)
    expect(await screen.findByText('Alex Rivera')).toBeInTheDocument()
    expect(screen.getByText('Verified')).toBeInTheDocument()
    expect(screen.getByText(/0x71C9/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /go live/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reset demo/i })).toBeInTheDocument()
    expect(screen.getByText(/make it yours/i)).toBeInTheDocument()
  })
})
