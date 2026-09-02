/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Absolute backend origin in production (e.g. https://taskpilot-api.onrender.com). Empty in dev. */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
