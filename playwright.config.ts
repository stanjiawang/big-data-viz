import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const skipRenderPerf = process.env.SKIP_RENDER_PERF === '1';

export default defineConfig({
  testDir: './tests',
  testIgnore: skipRenderPerf ? ['**/render-performance.spec.ts'] : undefined,
  timeout: 30_000,
  fullyParallel: true,
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'on-first-retry',
  },
  webServer: {
    command: `pnpm exec vite --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      VITE_ENABLE_MSW: 'true',
      VITE_ENABLE_AUTH: 'false',
      VITE_AUTH_PROVIDER: 'mock',
      VITE_API_BASE_URL: '',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
