import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import checker from 'vite-plugin-checker';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

function defineLiteral(value: string | undefined) {
  return value === undefined ? 'undefined' : JSON.stringify(value);
}

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
      __APP_API_BASE_URL__: defineLiteral(env.VITE_API_BASE_URL),
      __APP_API_TIMEOUT_MS__: defineLiteral(env.VITE_API_TIMEOUT_MS),
      __APP_API_RETRY_COUNT__: defineLiteral(env.VITE_API_RETRY_COUNT),
      __APP_API_RETRY_BASE_DELAY_MS__: defineLiteral(env.VITE_API_RETRY_BASE_DELAY_MS),
      __APP_API_RETRY_MAX_DELAY_MS__: defineLiteral(env.VITE_API_RETRY_MAX_DELAY_MS),
      __APP_API_RETRY_JITTER_RATIO__: defineLiteral(env.VITE_API_RETRY_JITTER_RATIO),
      __APP_ENABLE_MSW__: defineLiteral(env.VITE_ENABLE_MSW),
      __APP_ENABLE_AUTH__: defineLiteral(env.VITE_ENABLE_AUTH),
      __APP_ENABLE_TELEMETRY__: defineLiteral(env.VITE_ENABLE_TELEMETRY),
      __APP_AUTH_REQUIRED_ROLES__: defineLiteral(env.VITE_AUTH_REQUIRED_ROLES),
      __APP_AUTH_REQUIRE_TENANT__: defineLiteral(env.VITE_AUTH_REQUIRE_TENANT),
      __APP_AUTH_TENANT_ID__: defineLiteral(env.VITE_AUTH_TENANT_ID),
    },
  };
});
