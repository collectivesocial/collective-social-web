/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_OPEN_SOCIAL_WEB_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
