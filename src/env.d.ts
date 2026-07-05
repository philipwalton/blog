/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_PARTIAL_PATH: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
