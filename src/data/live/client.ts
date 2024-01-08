import axios from 'axios'
import { getApiKey, getBaseUrl } from '../mode'

// Thin axios instance for the Swipelux sandbox. The key is read at request
// time so "Go live" (pasting a key in-app) works without a rebuild.
export const client = axios.create({
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use(config => {
  config.baseURL = getBaseUrl()
  config.headers['X-API-Key'] = getApiKey()
  return config
})
