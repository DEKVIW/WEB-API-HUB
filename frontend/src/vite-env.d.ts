/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  // 可以在这里添加其他环境变量
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

