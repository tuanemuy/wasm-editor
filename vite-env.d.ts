interface ViteTypeOptions {
  strictImportMetaEnv: unknown;
}

interface ImportMetaEnv {
  readonly VITE_DATABASE_PATH: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
