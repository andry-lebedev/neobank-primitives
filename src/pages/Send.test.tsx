import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { setSourceOverride } from '@/data'
import Send from './Send'

beforeEach(() => vi.stubEnv('VITE_API_TOKEN', ''))
afterEach(() => { setSourceOverride(null); vi.unstubAllEnvs() })

describe('Send', () => {
  it('bank flow: pick recipient → quote → confirm → success', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Send />)

    // seeded recipient appears
    await user.click(await screen.findByRole('button', { name: /Maria K\./ }))
    await user.type(screen.getByLabelText(/amount/i), '50')
    await user.click(screen.getByRole('button', { name: /get quote/i }))

    expect(await screen.findByText(/recipient gets/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /confirm/i }))

    expect(await screen.findByText(/on its way/i)).toBeInTheDocument()
  })

  it('auto-selects the first recipient so quoting needs no extra click', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Send />)
    // do NOT click a recipient — the first seeded one should already be selected
    await user.type(await screen.findByLabelText(/amount/i), '50')
    const quote = screen.getByRole('button', { name: /get quote/i })
    await waitFor(() => expect(quote).toBeEnabled())
    await user.click(quote)
    expect(await screen.findByText(/recipient gets/i)).toBeInTheDocument()
  })

  it('shows an error notice for insufficient funds', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Send />)
    await user.click(await screen.findByRole('button', { name: /Maria K\./ }))
    await user.type(screen.getByLabelText(/amount/i), '9999999')
    await user.click(screen.getByRole('button', { name: /get quote/i }))
    await user.click(await screen.findByRole('button', { name: /confirm/i }))
    expect(await screen.findByText(/insufficient/i)).toBeInTheDocument()
  })
})
