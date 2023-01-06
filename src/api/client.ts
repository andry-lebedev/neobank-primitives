import axios from 'axios'
import type { AxiosError, AxiosInstance, AxiosResponse } from 'axios'

declare module 'axios' {
  interface InternalAxiosRequestConfig {
    _devId?: number
    _devStart?: number
  }
}

export type DevEntryStatus = 'pending' | 'success' | 'error'

export interface DevLogEntry {
  id?: number
  method: string
  url?: string
  status: DevEntryStatus
  statusCode: number | null
  durationMs: number | null
  requestBody: unknown
  responseBody: unknown
  timestamp: string
}

export interface DevEvent {
  type: 'request' | 'response'
  entry: DevLogEntry
}

export type DevListener = (event: DevEvent) => void

// Dev listener registry — DevPanel registers here to receive request events
const listeners = new Set<DevListener>()

export function addDevListener(fn: DevListener) {
  listeners.add(fn)
}

export function removeDevListener(fn: DevListener) {
  listeners.delete(fn)
}

function notify(event: DevEvent) {
  listeners.forEach(fn => fn(event))
}

export const client: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  headers: {
    'X-API-Key': import.meta.env.VITE_API_TOKEN ?? '',
    'Content-Type': 'application/json',
  },
})

let reqCounter = 0

client.interceptors.request.use(config => {
  const id = ++reqCounter
  config._devId = id
  config._devStart = performance.now()
  notify({
    type: 'request',
    entry: {
      id,
      method: (config.method ?? 'GET').toUpperCase(),
      url: config.url,
      status: 'pending',
      statusCode: null,
      durationMs: null,
      requestBody: config.data ?? null,
      responseBody: null,
      timestamp: new Date().toISOString(),
    },
  })
  return config
})

client.interceptors.response.use(
  (response: AxiosResponse) => {
    const id = response.config._devId
    const durationMs = response.config._devStart !== undefined
      ? Math.round(performance.now() - response.config._devStart)
      : null
    notify({
      type: 'response',
      entry: {
        id,
        method: (response.config.method ?? 'GET').toUpperCase(),
        url: response.config.url,
        status: 'success',
        statusCode: response.status,
        durationMs,
        requestBody: response.config.data ? JSON.parse(response.config.data) : null,
        responseBody: response.data,
        timestamp: new Date().toISOString(),
      },
    })
    return response
  },
  (error: AxiosError<{ message?: string }>) => {
    const id = error.config?._devId
    const durationMs = error.config?._devStart !== undefined
      ? Math.round(performance.now() - error.config._devStart)
      : null
    notify({
      type: 'response',
      entry: {
        id,
        method: (error.config?.method ?? 'GET').toUpperCase(),
        url: error.config?.url ?? '?',
        status: 'error',
        statusCode: error.response?.status ?? null,
        durationMs,
        requestBody: error.config?.data ? JSON.parse(error.config.data) : null,
        responseBody: error.response?.data ?? { message: error.message },
        timestamp: new Date().toISOString(),
      },
    })
    const message = error.response?.data?.message ?? error.message ?? 'Request failed'
    window.dispatchEvent(new CustomEvent('api-error', { detail: { message } }))
    return Promise.reject(error)
  }
)

export default client
