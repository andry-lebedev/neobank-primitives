// NAMED INTEGRATION SLOTS — the only place a client wires their own infra.
// Reference demo ships these as safe stubs. Client AI fills the bodies; it must
// NOT rename or remove these exports — call sites across the app depend on them.

// Analytics. Reference: log to console. Client: forward to their analytics SDK.
export function track(event, props = {}) {
  if (import.meta.env.DEV) console.debug('[track]', event, props)
}

// Called once when the customer session loads. Reference: no-op.
// Client: hydrate their session/user store, identify the user, etc.
export function onSession(customer) {
  if (import.meta.env.DEV) console.debug('[onSession]', customer?.id)
}

// User-facing notification. Reference: delegates to the in-app toast.
// Client: route to their notification system if desired.
export function notify(message, kind = 'success') {
  window.dispatchEvent(new CustomEvent(`api-${kind}`, { detail: { message } }))
}

// Session entry point. Reference: localStorage then env var.
// Client: resolve from their auth/session instead.
export function resolveCustomerId() {
  return localStorage.getItem('swipelux_customer_id') ?? import.meta.env.VITE_CUSTOMER_ID
}
