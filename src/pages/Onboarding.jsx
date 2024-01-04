import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronDown } from 'lucide-react'
import Button from '../components/Button'
import Card from '../components/Card'
import { showToast } from '../components/showToast'
import { createCustomer } from '../api/customers'
import { createWallet } from '../api/wallets'
import { createAccount } from '../api/accounts'

const ADDRESS_FIELDS = ['country', 'streetLine1', 'streetLine2', 'city', 'state', 'postalCode']
const TAX_TYPES = ['ssn', 'itin', 'ein', 'tin', 'vat', 'cpf', 'other']
const PROVISION_CHAIN = 'polygon'
const PROVISION_COUNTRY = 'EE'
const PROVISION_CURRENCY = 'EUR'

const EMPTY_FORM = {
  firstName: '',
  middleName: '',
  lastName: '',
  birthDate: '',
  email: '',
  phone: '',
}

const EMPTY_ADDRESS = {
  country: '',
  streetLine1: '',
  streetLine2: '',
  city: '',
  state: '',
  postalCode: '',
}

const EMPTY_TAX_INFO = {
  country: '',
  type: '',
  value: '',
}

function TextField({ id, label, type = 'text', value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1.5" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-[#1F2937] border border-[#374151] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#F97316] transition-colors duration-150"
      />
    </div>
  )
}

function FieldGroup({ title, children }) {
  return (
    <details className="group rounded-2xl border border-[#374151] bg-[#1F2937]">
      <summary className="flex items-center justify-between px-4 py-3 cursor-pointer list-none">
        <span className="text-sm font-medium text-gray-200">{title}</span>
        <ChevronDown size={16} className="text-gray-500 transition-transform duration-150 group-open:rotate-180" />
      </summary>
      <div className="px-4 pb-4 pt-1 space-y-4">
        {children}
      </div>
    </details>
  )
}

function anyFilled(obj) {
  return Object.values(obj).some(Boolean)
}

function allFilled(obj) {
  return Object.values(obj).every(Boolean)
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function Onboarding() {
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY_FORM)
  const [address, setAddress] = useState(EMPTY_ADDRESS)
  const [taxInfo, setTaxInfo] = useState(EMPTY_TAX_INFO)
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(false)
  const [provStep, setProvStep] = useState(null)
  const [provError, setProvError] = useState('')
  const [createdWallet, setCreatedWallet] = useState(null)

  function updateForm(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function updateAddress(key, value) {
    setAddress(prev => ({ ...prev, [key]: value }))
  }

  function updateTaxInfo(key, value) {
    setTaxInfo(prev => ({ ...prev, [key]: value }))
  }

  function validate() {
    if (!form.email) {
      showToast('Email is required', 'error')
      return false
    }
    if (!isValidEmail(form.email)) {
      showToast('Enter a valid email address', 'error')
      return false
    }
    if (anyFilled(address) && !ADDRESS_FIELDS.every(k => address[k])) {
      showToast('Complete every address field or leave address empty', 'error')
      return false
    }
    if (anyFilled(taxInfo) && !allFilled(taxInfo)) {
      showToast('Complete every tax info field or leave tax info empty', 'error')
      return false
    }
    return true
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const created = await createCustomer({
        ...form,
        address,
        taxInfo,
        metadata: { source: 'dummy-neobank-onboarding' },
      })
      setCustomer(created)
      showToast('Customer created')
      await provision(created.id)
    } catch {
      // Error toast already fired by axios interceptor
    } finally {
      setLoading(false)
    }
  }

  async function provision(customerId) {
    setProvError('')
    try {
      let wallet = createdWallet
      if (!wallet) {
        setProvStep('wallet')
        wallet = await createWallet(customerId, PROVISION_CHAIN)
        setCreatedWallet(wallet)
      }
      setProvStep('account')
      await createAccount(customerId, {
        type: 'sepa',
        country: PROVISION_COUNTRY,
        currency: PROVISION_CURRENCY,
        targetWallet: wallet.id,
      })
      setProvStep('done')
      localStorage.setItem('swipelux_customer_id', customerId)
      navigate('/')
    } catch (err) {
      setProvStep('error')
      setProvError(err?.response?.data?.message ?? err?.message ?? 'Provisioning failed')
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-28 space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-[#1F2937] transition-colors duration-150 cursor-pointer text-gray-400 hover:text-white">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-white">Create customer</h1>
      </div>

      {provStep && (
        <Card className="p-5">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Setting up your account</h2>
            <ul className="space-y-2 text-sm">
              <li className={provStep === 'wallet' ? 'text-[#F97316]' : 'text-gray-400'}>
                {createdWallet ? '✓' : '•'} Creating wallet
              </li>
              <li className={provStep === 'account' ? 'text-[#F97316]' : 'text-gray-400'}>
                {provStep === 'done' ? '✓' : '•'} Opening bank account
              </li>
            </ul>
            {provStep === 'error' && (
              <div className="space-y-3">
                <p className="text-sm text-red-400">{provError}</p>
                <Button fullWidth onClick={() => provision(customer.id)}>Retry</Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {!provStep && <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="p-5 space-y-4">
          <TextField
            id="customer-email"
            label="Email"
            type="email"
            placeholder="person@example.com"
            value={form.email}
            onChange={value => updateForm('email', value)}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              id="customer-first-name"
              label="First name"
              value={form.firstName}
              onChange={value => updateForm('firstName', value)}
            />
            <TextField
              id="customer-last-name"
              label="Last name"
              value={form.lastName}
              onChange={value => updateForm('lastName', value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              id="customer-phone"
              label="Phone"
              type="tel"
              value={form.phone}
              onChange={value => updateForm('phone', value)}
            />
            <TextField
              id="customer-birth-date"
              label="Birth date"
              type="date"
              value={form.birthDate}
              onChange={value => updateForm('birthDate', value)}
            />
          </div>
        </Card>

        <FieldGroup title="Address">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              id="customer-address-country"
              label="Country"
              placeholder="US"
              value={address.country}
              onChange={value => updateAddress('country', value)}
            />
            <TextField
              id="customer-address-state"
              label="State"
              placeholder="NY"
              value={address.state}
              onChange={value => updateAddress('state', value)}
            />
          </div>
          <TextField
            id="customer-address-street-1"
            label="Street line 1"
            value={address.streetLine1}
            onChange={value => updateAddress('streetLine1', value)}
          />
          <TextField
            id="customer-address-street-2"
            label="Street line 2"
            value={address.streetLine2}
            onChange={value => updateAddress('streetLine2', value)}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              id="customer-address-city"
              label="City"
              value={address.city}
              onChange={value => updateAddress('city', value)}
            />
            <TextField
              id="customer-address-postal-code"
              label="Postal code"
              value={address.postalCode}
              onChange={value => updateAddress('postalCode', value)}
            />
          </div>
        </FieldGroup>

        <FieldGroup title="Tax info">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              id="customer-tax-country"
              label="Country"
              placeholder="US"
              value={taxInfo.country}
              onChange={value => updateTaxInfo('country', value)}
            />
            <div>
              <label className="block text-xs text-gray-500 mb-1.5" htmlFor="customer-tax-type">Type</label>
              <select
                id="customer-tax-type"
                value={taxInfo.type}
                onChange={e => updateTaxInfo('type', e.target.value)}
                className="w-full bg-[#1F2937] border border-[#374151] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#F97316] transition-colors duration-150"
              >
                <option value="">Select type</option>
                {TAX_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
          <TextField
            id="customer-tax-value"
            label="Value"
            value={taxInfo.value}
            onChange={value => updateTaxInfo('value', value)}
          />
        </FieldGroup>

        <Button fullWidth type="submit" loading={loading}>Create customer</Button>
      </form>}
    </div>
  )
}
