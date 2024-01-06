/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_API_TOKEN: string
  readonly VITE_CUSTOMER_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
