import axios from 'axios'

// Dev listener registry — DevPanel registers here to receive request events
const listeners = new Set()

export function addDevListener(fn) {
  listeners.add(fn)
}

export function removeDevListener(fn) {
  listeners.delete(fn)
}

function notify(event) {
  listeners.forEach(fn => fn(event))
}

export const client = axios.create({
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
      requestBody: config.data ? JSON.parse(config.data) : null,
      responseBody: null,
      timestamp: new Date().toISOString(),
    },
  })
  return config
})

client.interceptors.response.use(
  response => {
    const id = response.config._devId
    const durationMs = Math.round(performance.now() - response.config._devStart)
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
  error => {
    const id = error.config?._devId
    const durationMs = error.config?._devStart
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
