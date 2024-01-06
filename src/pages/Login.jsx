import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogIn, UserPlus } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import { getCustomer } from '../api/customers'
import { setCustomerId } from '../integrations'

export default function Login() {
  const navigate = useNavigate()
  const [id, setId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
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
      setError(err?.response?.data?.message ?? 'Customer not found')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-base flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-3">
            <LogIn size={24} className="text-accent" />
          </div>
          <h1 className="text-xl font-bold text-fg-strong">Open your account</h1>
          <p className="text-sm text-muted mt-1">Enter your customer ID to continue.</p>
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
