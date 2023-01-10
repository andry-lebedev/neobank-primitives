import { describe, it, expect, afterEach } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MakeItYoursFab } from './MakeItYoursFab'

describe('MakeItYoursFab', () => {
  afterEach(cleanup)

  it('opens a dialog with the re-brand prompt and a copy button', async () => {
    const user = userEvent.setup()
    render(<MakeItYoursFab />)

    await user.click(screen.getByRole('button', { name: /make this app yours/i }))

    expect(await screen.findByText(/re-brand it as mine/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /copy prompt/i })).toBeInTheDocument()
  })
})
