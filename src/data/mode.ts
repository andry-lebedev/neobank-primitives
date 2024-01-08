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
  return localStorage.getItem(KEY_STORAGE) ?? import.meta.env.VITE_API_TOKEN ?? ''
}

export function setApiKey(key: string): void {
  localStorage.setItem(KEY_STORAGE, key)
  emitAction({ type: 'mode.changed', mode: 'live' })
}

// Note: cannot clear a key supplied via VITE_API_TOKEN env — only stored keys.
export function clearApiKey(): void {
  localStorage.removeItem(KEY_STORAGE)
  emitAction({ type: 'mode.changed', mode: getMode() })
}

export function getMode(): AppMode {
  return getApiKey() ? 'live' : 'demo'
}

// A 401/403 means the key is bad. Anything else (200, or 400 from a
// parameterless list call) means auth passed.
export async function validateApiKey(key: string): Promise<boolean> {
  try {
    await axios.get(`${getBaseUrl()}/v1/transfers`, { headers: { 'X-API-Key': key } })
    return true
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      return err.response.status !== 401 && err.response.status !== 403
    }
    return false // network failure — treat as not validated
  }
}
