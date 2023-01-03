import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useApp } from '@/context/useApp'
import { notify, setCustomerId, track } from '@/integrations'
import { brand } from '../brand.config'
import { cn } from '@/lib/utils'
import { provisionCustomer, type OnboardingReceipt, type OnboardingStepCode } from '@/financial/onboarding'

const STEPS = ['Customer', 'Verification', 'Wallet', 'Bank account'] as const

export default function Onboarding() {
  const { source, financialProvider, mode, reload } = useApp()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [step, setStep] = useState(-1) // -1 = form, 0..3 = provisioning, 4 = done
  const [error, setError] = useState<string | null>(null)
  const [receipt, setReceipt] = useState<OnboardingReceipt | null>(null)

  async function run() {
    setError(null)
    setStep(0)
    try {
      const stepIndex: Record<OnboardingStepCode, number> = {
        customer_created: 1,
        identity_verified: 2,
        wallet_provisioned: 3,
        bank_account_issued: 4,
      }
      const result = await provisionCustomer({
        source,
        mode,
        input: { firstName, lastName, email },
        verificationProvider: mode === 'live' ? financialProvider : undefined,
        onStep: completed => setStep(stepIndex[completed.code]),
      })
      setReceipt(result)
      setStep(4)
      track('onboarding.completed', {})
      if (mode === 'live') setCustomerId(result.customer.id)
      notify('Account created')
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'Onboarding failed.'
      setError(`Setup failed: ${reason}`)
      setStep(-1)
    }
  }

  if (step === 4 && receipt) {
    return (
      <div className="flex flex-col items-center gap-4 pt-16 text-center">
        <CheckCircle2 className="size-14 text-success" />
        <h1 className="text-xl font-extrabold">Account ready</h1>
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>Identity {receipt.customer.verificationStatus} · evidence: {receipt.steps[1].source}</p>
          <p>Custody: {receipt.wallet.custody?.type ?? 'not reported'}{receipt.wallet.custody?.custodianName ? ` by ${receipt.wallet.custody.custodianName}` : ''}</p>
          <p>Bank account: {receipt.account.iban ?? receipt.account.id}</p>
        </div>
        <Button asChild onClick={() => reload()}><Link to="/">Open {brand.name}</Link></Button>
      </div>
    )
  }

  if (step >= 0) {
    return (
      <div className="space-y-5 pt-8">
        <h1 className="text-center text-xl font-extrabold">Setting things up…</h1>
        <Card>
          <CardContent className="space-y-3 pt-4">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-3 text-sm">
                <span className={cn(
                  'flex size-5 items-center justify-center rounded-full text-[10px] font-bold',
                  i < step ? 'bg-success text-primary-foreground' : i === step ? 'bg-info text-primary-foreground' : 'bg-muted text-muted-foreground',
                )}>
                  {i < step ? <Check className="size-3" /> : i === step ? <Loader2 className="size-3 animate-spin" /> : i + 1}
                </span>
                <span className={cn(i > step && 'text-muted-foreground')}>{label}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight">Open an account</h1>
        <p className="text-sm text-muted-foreground">Verification must be approved before the wallet and bank account are provisioned.</p>
      </div>
      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="text-sm">About you</CardTitle>
          <CardDescription>Used for identity verification.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="first">First name</Label>
            <Input id="first" value={firstName} onChange={e => setFirstName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="last">Last name</Label>
            <Input id="last" value={lastName} onChange={e => setLastName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button className="w-full" disabled={!firstName || !lastName || !email} onClick={run}>
            Create account
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
