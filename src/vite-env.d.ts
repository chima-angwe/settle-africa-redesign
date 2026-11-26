/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly SETTLE_AFRICA_BASE_URL?: string;
  readonly SETTLE_AFRICA_API_TIMEOUT_MS?: string;
  readonly SETTLE_AFRICA_SHELL_TOKEN?: string;
  readonly SETTLE_AFRICA_USE_DIRECT_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
