import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import checker from 'vite-plugin-checker';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  return {
    plugins: [
      react(),
      checker({
        typescript: true,
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(rootDir, './src'),
      },
    },
    define: {
      __APP_MODE__: JSON.stringify(mode),
      __APP_API_BASE_URL__: JSON.stringify(env.VITE_API_BASE_URL ?? ''),
      __APP_API_TIMEOUT_MS__: JSON.stringify(env.VITE_API_TIMEOUT_MS ?? ''),
      __APP_API_RETRY_COUNT__: JSON.stringify(env.VITE_API_RETRY_COUNT ?? ''),
      __APP_ENABLE_MSW__: JSON.stringify(env.VITE_ENABLE_MSW ?? ''),
    },
  };
});
