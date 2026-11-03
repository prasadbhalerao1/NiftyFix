interface ImportMetaEnv {
  readonly PUBLIC_SITE_ORIGIN: string;
  readonly PUBLIC_FRAME_ORIGIN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
