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
      __APP_RELEASE__: defineLiteral(env.VITE_APP_RELEASE),
      __APP_COMMIT_SHA__: defineLiteral(env.VITE_APP_COMMIT_SHA),
      __APP_AUTH_REQUIRED_ROLES__: defineLiteral(env.VITE_AUTH_REQUIRED_ROLES),
      __APP_AUTH_REQUIRE_TENANT__: defineLiteral(env.VITE_AUTH_REQUIRE_TENANT),
      __APP_AUTH_TENANT_ID__: defineLiteral(env.VITE_AUTH_TENANT_ID),
      __APP_AUTH_PROVIDER__: defineLiteral(env.VITE_AUTH_PROVIDER),
      __APP_AUTH_OIDC_AUTHORIZE_URL__: defineLiteral(env.VITE_AUTH_OIDC_AUTHORIZE_URL),
      __APP_AUTH_OIDC_TOKEN_URL__: defineLiteral(env.VITE_AUTH_OIDC_TOKEN_URL),
      __APP_AUTH_OIDC_CLIENT_ID__: defineLiteral(env.VITE_AUTH_OIDC_CLIENT_ID),
      __APP_AUTH_OIDC_SCOPE__: defineLiteral(env.VITE_AUTH_OIDC_SCOPE),
      __APP_AUTH_OIDC_AUDIENCE__: defineLiteral(env.VITE_AUTH_OIDC_AUDIENCE),
      __APP_AUTH_OIDC_REDIRECT_URI__: defineLiteral(env.VITE_AUTH_OIDC_REDIRECT_URI),
      __APP_AUTH_OIDC_ROLE_CLAIM__: defineLiteral(env.VITE_AUTH_OIDC_ROLE_CLAIM),
      __APP_AUTH_OIDC_TENANT_CLAIM__: defineLiteral(env.VITE_AUTH_OIDC_TENANT_CLAIM),
      __APP_AUTH_OIDC_POST_LOGOUT_REDIRECT_URI__: defineLiteral(
        env.VITE_AUTH_OIDC_POST_LOGOUT_REDIRECT_URI,
      ),
      __APP_AUTH_OIDC_LOGOUT_URL__: defineLiteral(env.VITE_AUTH_OIDC_LOGOUT_URL),
    },
    build: {
      // Chunk budgets are enforced by scripts/check-performance.mjs;
      // raise Vite's generic warning threshold to avoid duplicate noisy CI warnings.
      chunkSizeWarningLimit: 2300,
      rollupOptions: {
        onwarn(warning, warn) {
          const message = warning.message ?? '';
          const isLoadersGlSpawnWarning =
            warning.code === 'MISSING_EXPORT' &&
            message.includes('"spawn" is not exported by "__vite-browser-external"') &&
            message.includes('@loaders.gl/worker-utils');
          if (isLoadersGlSpawnWarning) {
            return;
          }
          warn(warning);
        },
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/react-intl') || id.includes('node_modules/@formatjs/')) {
              return 'intl';
            }
            if (id.includes('node_modules/echarts')) {
              return 'charts-echarts';
            }
            if (id.includes('node_modules/d3')) {
              return 'charts-d3';
            }
            if (id.includes('node_modules/@deck.gl/') || id.includes('node_modules/@loaders.gl/')) {
              return 'viz-deckgl';
            }
            if (
              id.includes('node_modules/@react-sigma/') ||
              id.includes('node_modules/graphology')
            ) {
              return 'viz-graph';
            }
            return undefined;
          },
        },
      },
    },
  };
});
