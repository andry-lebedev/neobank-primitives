import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { setSourceOverride } from '@/data'
import Activity from './Activity'

beforeEach(() => vi.stubEnv('VITE_API_TOKEN', ''))
afterEach(() => { cleanup(); setSourceOverride(null); vi.unstubAllEnvs() })

describe('Activity', () => {
  it('lists seeded transfers and opens a detail dialog', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Activity />)
    const rows = await screen.findAllByText(/Bank payout|Deposit|Wallet transfer/)
    expect(rows.length).toBeGreaterThanOrEqual(10)

    await user.click(screen.getAllByText('Bank payout')[0].closest('button')!)
    expect(await screen.findByText(/transfer id/i)).toBeInTheDocument()
  })

  it('shows failure reason for failed transfers', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Activity />)
    await screen.findAllByText(/Deposit/)
    const failedRow = screen.getByText('Failed').closest('button')!
    await user.click(failedRow)
    expect(await screen.findByText(/recipient bank rejected/i)).toBeInTheDocument()
  })
})
