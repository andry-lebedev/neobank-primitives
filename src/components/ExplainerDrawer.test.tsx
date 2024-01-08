import { describe, it, expect, afterEach } from 'vitest'
import { act, screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils'
import { setSourceOverride } from '@/data'
import { ExplainerDrawer } from './ExplainerDrawer'
import { useExplainer } from '@/context/ExplainerContext'
import { emitAction } from '@/lib/events'
import { useEffect } from 'react'

function ForceOpen() {
  const { setOpen } = useExplainer()
  useEffect(() => setOpen(true), [setOpen])
  return null
}

afterEach(() => setSourceOverride(null))

describe('ExplainerDrawer', () => {
  it('narrates a payout and advances steps on transfer.updated', async () => {
    renderWithProviders(<><ForceOpen /><ExplainerDrawer /></>)

    act(() => emitAction({
      type: 'payout.created',
      transfer: { id: 'tx9', type: 'offramp', state: 'pending', createdAt: new Date().toISOString() },
    }))
    expect(await screen.findByText('Behind a bank payout')).toBeInTheDocument()
    expect(screen.getByText('Quote locked')).toBeInTheDocument()

    act(() => emitAction({
      type: 'transfer.updated',
      transfer: { id: 'tx9', type: 'offramp', state: 'completed', createdAt: new Date().toISOString() },
    }))
    // all 4 steps done → 4 checkmarks
    expect(screen.getAllByTestId('step-done')).toHaveLength(4)
  })

  it('shows idle hint when nothing happened yet', () => {
    renderWithProviders(<><ForceOpen /><ExplainerDrawer /></>)
    expect(screen.getByText(/do something/i)).toBeInTheDocument()
  })
})
