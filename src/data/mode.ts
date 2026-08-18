import axios from 'axios'
import { emitAction } from '@/lib/events'
import { clearCustomerId } from '@/integrations'
import type { AppMode } from './types'
import { APP_SUPPORT } from '@/support'

// A stored Swipelux API key selects provider-backed mode; VITE_API_URL can
// optionally point the client at a different API environment.
const KEY_STORAGE = 'swipelux_api_key'
const DEFAULT_BASE_URL = APP_SUPPORT.live.defaultBaseUrl

export function getBaseUrl(): string {
  return import.meta.env.VITE_API_URL ?? DEFAULT_BASE_URL
}

export function getApiKey(): string {
  // The key lives only in-app (localStorage), set via Go live and removed via
  // Disconnect. No .env fallback — nothing sensitive is read from env.
  return localStorage.getItem(KEY_STORAGE) ?? ''
}

export function setApiKey(key: string): void {
  localStorage.setItem(KEY_STORAGE, key)
  emitAction({ type: 'mode.changed', mode: 'live' })
}

// Disconnect returns to demo and forgets the active customer, so reconnecting
// with a different key never loads the previous key's customer.
export function clearApiKey(): void {
  localStorage.removeItem(KEY_STORAGE)
  clearCustomerId()
  emitAction({ type: 'mode.changed', mode: getMode() })
}

export function getMode(): AppMode {
  return getApiKey() ? 'live' : 'demo'
}

// Only a successful response confirms the key was accepted.
export async function validateApiKey(key: string): Promise<boolean> {
  try {
    await axios.get(`${getBaseUrl()}/v3/capabilities`, { headers: { 'X-API-Key': key } })
    return true
  } catch {
    return false
  }
}
