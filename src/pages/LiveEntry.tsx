import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useApp } from '@/context/useApp'
import { setCustomerId } from '@/integrations'
import { brand } from '../brand.config'

// Live mode with a key but no customer yet. Session entry, NOT auth.
export default function LiveEntry() {
  const { reload } = useApp()
  const navigate = useNavigate()
  const [id, setId] = useState('')

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-5 px-4">
      <div className="text-center">
        <img src={brand.logoSrc} alt="" className="mx-auto mb-3 size-12 rounded-xl" />
        <h1 className="text-xl font-extrabold">You're live</h1>
        <p className="text-sm text-muted-foreground">Connected to the Swipelux sandbox. Whose account should we open?</p>
      </div>

      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="text-sm">New customer</CardTitle>
          <CardDescription>Run the full onboarding: customer → KYC → wallet → IBAN.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={() => navigate('/onboarding')}>Start onboarding</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="text-sm">Existing customer</CardTitle>
          <CardDescription>Load a customer you already created in this sandbox.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="cust">Customer id</Label>
          <Input id="cust" placeholder="cus_…" value={id} onChange={e => setId(e.target.value)} />
          <Button variant="outline" className="w-full" disabled={!id.trim()} onClick={() => { setCustomerId(id.trim()); reload() }}>
            Continue
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
