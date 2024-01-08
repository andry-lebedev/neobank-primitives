import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CopyField } from './CopyField'
import { StatusBadge } from './StatusBadge'
import { TransactionRow } from './TransactionRow'
import { MemoryRouter } from 'react-router-dom'

describe('shared components', () => {
  it('CopyField shows label and value', () => {
    render(<CopyField label="IBAN" value="IE29 AIBK" />)
    expect(screen.getByText('IBAN')).toBeInTheDocument()
    expect(screen.getByText('IE29 AIBK')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument()
  })

  it('StatusBadge maps states to labels', () => {
    render(<StatusBadge state="completed" />)
    expect(screen.getByText('Completed')).toBeInTheDocument()
  })

  it('TransactionRow renders title, counterparty and signed amount', () => {
    render(
      <MemoryRouter>
        <TransactionRow transfer={{ id: 't1', type: 'onramp', state: 'completed', createdAt: '2026-06-01T00:00:00Z', from: { identifier: 'Acme Payroll', rail: 'sepa' }, to: { amount: '1200.00', currency: 'EUR' } }} />
      </MemoryRouter>,
    )
    expect(screen.getByText('Deposit')).toBeInTheDocument()
    expect(screen.getByText(/Acme Payroll/)).toBeInTheDocument()
    expect(screen.getByText(/\+.*1,200/)).toBeInTheDocument()
  })
})
