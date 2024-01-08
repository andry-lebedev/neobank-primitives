import axios from 'axios'
import { emitAction } from '@/lib/events'
import type { AppMode } from './types'

// The ONLY configuration in this app is the Swipelux API key.
// No key → demo mode (local realistic data). Key → live sandbox.
const KEY_STORAGE = 'swipelux_api_key'
const DEFAULT_BASE_URL = 'https://platform.sbx.swipelux.com'

export function getBaseUrl(): string {
  return import.meta.env.VITE_API_URL ?? DEFAULT_BASE_URL
}

export function getApiKey(): string {
  // A present localStorage entry — even an empty string — is the user's
  // explicit choice (Go live / Disconnect) and overrides the env fallback.
  // Only when nothing is stored do we fall back to VITE_API_TOKEN.
  const stored = localStorage.getItem(KEY_STORAGE)
  if (stored !== null) return stored
  return import.meta.env.VITE_API_TOKEN ?? ''
}

export function setApiKey(key: string): void {
  localStorage.setItem(KEY_STORAGE, key)
  emitAction({ type: 'mode.changed', mode: 'live' })
}

// Records an explicit disconnect ('' beats the VITE_API_TOKEN env fallback),
// so Disconnect returns to demo even when a key is set in .env.
export function clearApiKey(): void {
  localStorage.setItem(KEY_STORAGE, '')
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
