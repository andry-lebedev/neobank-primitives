// NAMED INTEGRATION SLOTS — the only place a client wires their own infra.
// Safe stubs shipped. A tailoring AI fills the bodies; it must NOT rename or
// remove these exports — call sites across the app depend on them.

import type { Customer } from '@/data/types'

export type NotifyKind = 'success' | 'error'

// Analytics. Stub: console in dev. Client: forward to their analytics SDK.
export function track(event: string, props: Record<string, unknown> = {}): void {
  if (import.meta.env.DEV) console.debug('[track]', event, props)
}

// Called once when the customer session loads. Client: identify the user in
// their session/user store.
export function onSession(customer: Customer): void {
  if (import.meta.env.DEV) console.debug('[onSession]', customer?.id)
}

// User-facing notification. Stub: in-app toast via DOM event. Client: route to
// their notification system if desired.
export function notify(message: string, kind: NotifyKind = 'success'): void {
  window.dispatchEvent(new CustomEvent('app-toast', { detail: { message, kind } }))
}

// Session entry (live mode): how the app learns which customer to load.
// NOT authentication. Client: resolve from their auth/session instead.
export function resolveCustomerId(): string {
  return localStorage.getItem('swipelux_customer_id') ?? ''
}

export function setCustomerId(id: string): void {
  localStorage.setItem('swipelux_customer_id', id)
}

// Forget the active customer. Called when the key changes (Go live with a blank
// customer / Disconnect) so a new key never inherits the prior key's customer.
export function clearCustomerId(): void {
  localStorage.removeItem('swipelux_customer_id')
}
