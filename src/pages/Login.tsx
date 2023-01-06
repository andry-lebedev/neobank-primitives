import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { UserPlus } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import { getCustomer } from '../api/customers'
import { setCustomerId } from '../integrations'
import { brand } from '../brand'

export default function Login() {
  const navigate = useNavigate()
  const [id, setId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const trimmed = id.trim()
    if (!trimmed) return
    setLoading(true)
    setError('')
    try {
      await getCustomer(trimmed) // validate it exists before storing
      setCustomerId(trimmed)
      window.location.assign('/') // reload so AppContext re-initialises
    } catch (err) {
      const message = axios.isAxiosError<{ message?: string }>(err) ? err.response?.data?.message : undefined
      setError(message ?? 'Customer not found')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-base flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <img src={brand.logoSrc} alt={brand.name} className="w-14 h-14 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-fg-strong">{brand.name}</h1>
          <p className="text-sm text-muted mt-1">Open your account — enter your customer ID to continue.</p>
        </div>

        <Card className="p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-subtle mb-1.5" htmlFor="login-customer-id">Customer ID</label>
              <input
                id="login-customer-id"
                value={id}
                onChange={e => setId(e.target.value)}
                placeholder="cus_..."
                className="w-full bg-card border border-card-hover rounded-xl px-4 py-3 text-fg-strong font-mono placeholder-faint focus:outline-none focus:border-accent transition-colors duration-150"
              />
              {error && <p className="text-xs text-danger mt-1.5">{error}</p>}
            </div>
            <Button fullWidth type="submit" loading={loading} disabled={!id.trim()}>
              Continue
            </Button>
          </form>
        </Card>

        <Button variant="ghost" fullWidth onClick={() => navigate('/onboarding')}>
          <UserPlus size={15} />
          Create a new customer
        </Button>
      </div>
    </div>
  )
}
