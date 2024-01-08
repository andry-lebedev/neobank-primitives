import { describe, it, expect, afterEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { setSourceOverride } from '@/data'
import Onboarding from './Onboarding'

afterEach(() => setSourceOverride(null))

describe('Onboarding', () => {
  it('runs the full provisioning chain', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Onboarding />)
    await user.type(screen.getByLabelText(/first name/i), 'Ada')
    await user.type(screen.getByLabelText(/last name/i), 'Lovelace')
    await user.type(screen.getByLabelText(/email/i), 'ada@example.com')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByText(/account ready/i, undefined, { timeout: 4000 })).toBeInTheDocument()
  })
})
