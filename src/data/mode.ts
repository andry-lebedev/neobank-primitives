import axios from 'axios'
import { emitAction } from '@/lib/events'
import { clearCustomerId } from '@/integrations'
import type { AppMode } from './types'

// The ONLY configuration in this app is the Swipelux API key.
// No key → demo mode (local realistic data). Key → live sandbox.
const KEY_STORAGE = 'swipelux_api_key'
const DEFAULT_BASE_URL = 'https://platform.sbx.swipelux.com'

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
    await axios.get(`${getBaseUrl()}/v1/transfers`, { headers: { 'X-API-Key': key } })
    return true
  } catch {
    return false
  }
}
