import { describe, it, expect, beforeEach, vi } from 'vitest'
import axios from 'axios'
import { getApiKey, setApiKey, clearApiKey, getMode, validateApiKey } from './mode'
import { onAction, type ActionEvent } from '@/lib/events'

vi.mock('axios')

describe('mode', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubEnv('VITE_API_TOKEN', '')
  })

  it('no key → demo; stored key → live', () => {
    expect(getMode()).toBe('demo')
    setApiKey('sk_test')
    expect(getApiKey()).toBe('sk_test')
    expect(getMode()).toBe('live')
    clearApiKey()
    expect(getMode()).toBe('demo')
  })

  it('emits mode.changed on set/clear', () => {
    const events: ActionEvent[] = []
    const off = onAction(e => events.push(e))
    setApiKey('sk_test')
    clearApiKey()
    expect(events).toEqual([
      { type: 'mode.changed', mode: 'live' },
      { type: 'mode.changed', mode: 'demo' },
    ])
    off()
  })

  it('validateApiKey: 401/403 → false, network 200/400 → true', async () => {
    vi.mocked(axios.get).mockRejectedValueOnce({ isAxiosError: true, response: { status: 401 } })
    vi.mocked(axios.isAxiosError).mockReturnValue(true)
    expect(await validateApiKey('bad')).toBe(false)

    vi.mocked(axios.get).mockResolvedValueOnce({ data: [] })
    expect(await validateApiKey('good')).toBe(true)

    vi.mocked(axios.get).mockRejectedValueOnce({ isAxiosError: true, response: { status: 400 } })
    expect(await validateApiKey('good-but-400')).toBe(true)
  })
})
