import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const skipRenderPerf = process.env.SKIP_RENDER_PERF === '1';
const authSuite = process.env.PW_AUTH_SUITE === '1';
const defaultProjectIgnore = [
  '**/auth-enabled.e2e.spec.ts',
  ...(skipRenderPerf ? ['**/render-performance.e2e.spec.ts'] : []),
];

export default defineConfig({
  testDir: './tests',
  testIgnore: skipRenderPerf ? ['**/render-performance.e2e.spec.ts'] : undefined,
  timeout: 30_000,
  fullyParallel: true,
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'on-first-retry',
    acceptDownloads: true,
  },
  webServer: {
    command: `pnpm exec vite --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      VITE_ENABLE_MSW: process.env.VITE_ENABLE_MSW ?? 'true',
      VITE_ENABLE_AUTH: authSuite ? 'true' : 'false',
      VITE_AUTH_PROVIDER: 'mock',
      VITE_API_BASE_URL: '',
    },
  },
  projects: authSuite
    ? [
        {
          name: 'chromium-auth',
          testMatch: ['**/auth-enabled.e2e.spec.ts'],
          use: { ...devices['Desktop Chrome'] },
        },
      ]
    : [
        {
          name: 'chromium',
          testIgnore: defaultProjectIgnore,
          use: { ...devices['Desktop Chrome'] },
        },
      ],
});
