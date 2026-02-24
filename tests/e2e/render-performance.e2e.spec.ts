import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { AUTH_SESSION_STORAGE_KEY, MOCK_AUTH_ACCOUNTS } from '../../src/auth/authClient';
import type { AuthSession } from '../../src/auth/types';

const SAMPLE_COUNT = Number(process.env.PERF_RENDER_SAMPLES ?? 3);
const TARGET_DATASET_SIZE = Number(process.env.PERF_RENDER_DATASET_SIZE ?? 50_000_000);
const TABLE_BUDGET_MS = Number(process.env.PERF_MAX_TABLE_RENDER_MS ?? 3000);
const GRAPH_BUDGET_MS = Number(process.env.PERF_MAX_GRAPH_RENDER_MS ?? 3200);
const PAGE_READY_TIMEOUT_MS = Number(process.env.PERF_PAGE_READY_TIMEOUT_MS ?? 25_000);
const GRAPH_READY_TIMEOUT_MS = Number(process.env.PERF_GRAPH_READY_TIMEOUT_MS ?? 30_000);
const SAMPLE_MAX_ATTEMPTS = Number(process.env.PERF_SAMPLE_MAX_ATTEMPTS ?? 3);
const PERF_AUTH_EMAIL = process.env.PERF_AUTH_EMAIL ?? 'analyst@example.com';
const PERF_AUTH_PASSWORD = process.env.PERF_AUTH_PASSWORD ?? 'DemoPass!123';
const PERF_SESSION_TTL_MS = Number(process.env.PERF_SESSION_TTL_MS ?? 8 * 60 * 60 * 1000);
const RENDER_BENCHMARK_ARTIFACT_PATH = path.resolve(
  process.cwd(),
  'artifacts/render-benchmark.json',
);

const primedPages = new WeakSet<Page>();
const RENDER_PERF_LOG_PREFIX = '[render-perf]';

function buildMockSession(): AuthSession {
  const fallbackAccount =
    MOCK_AUTH_ACCOUNTS.find((account) => account.email === PERF_AUTH_EMAIL) ||
    MOCK_AUTH_ACCOUNTS[0];

  if (!fallbackAccount) {
    throw new Error('No mock accounts available to seed the render performance session.');
  }

  return {
    accessToken: 'render-perf-mock-token',
    expiresAt: Date.now() + PERF_SESSION_TTL_MS,
    user: {
      id: `mock-${fallbackAccount.email}`,
      name: fallbackAccount.name,
      email: fallbackAccount.email,
      roles: fallbackAccount.roles,
      tenantId: fallbackAccount.tenantId,
    },
  };
}

async function primeMockSession(page: Page) {
  if (primedPages.has(page)) {
    return;
  }
  primedPages.add(page);
  const sessionPayload = buildMockSession();
  await page.addInitScript(
    ({ storageKey, payload }) => {
      try {
        window.sessionStorage?.setItem(storageKey, payload);
      } catch {
        /* noop */
      }
      try {
        window.localStorage?.setItem(storageKey, payload);
      } catch {
        /* noop */
      }
    },
    { storageKey: AUTH_SESSION_STORAGE_KEY, payload: JSON.stringify(sessionPayload) },
  );
}

async function waitForVisibility(locator: ReturnType<Page['locator']>, timeoutMs: number) {
  try {
    await locator.waitFor({ state: 'visible', timeout: timeoutMs });
    return true;
  } catch {
    return false;
  }
}

async function attemptCredentialLogin(page: Page) {
  const loginEmailField = page.locator(
    'input[type="email"], input[autocomplete="username"], input[name*="email" i]',
  );
  const loginPasswordField = page.locator(
    'input[type="password"], input[autocomplete="current-password"], input[name*="password" i]',
  );
  const loginButton = page.getByRole('button', { name: /sign in|登录/i }).first();
  const loginHeading = page.getByRole('heading', { name: /sign in required|需要登录/i }).first();

  const loginDetected =
    (await waitForVisibility(loginButton, 2_000)) ||
    (await waitForVisibility(loginHeading, 2_000)) ||
    (await waitForVisibility(loginEmailField, 2_000));

  if (!loginDetected) {
    return false;
  }

  console.log(`${RENDER_PERF_LOG_PREFIX} credential form detected; submitting mock account.`);
  await loginEmailField.first().fill(PERF_AUTH_EMAIL, { timeout: 5_000 });
  await loginPasswordField.first().fill(PERF_AUTH_PASSWORD, { timeout: 5_000 });
  await loginButton.click({ timeout: 5_000 });
  return true;
}

function median(values: number[]) {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
}

type TelemetryMetric = {
  name: string;
  value: number;
  path?: string;
  ts?: string;
};

function attachTelemetryLogger(page: import('@playwright/test').Page, sink: TelemetryMetric[]) {
  page.on('console', async (message) => {
    if (message.type() !== 'info') {
      return;
    }

    const args = message.args();
    if (args.length < 2) {
      return;
    }

    const label = await args[0].jsonValue().catch(() => null);
    if (label !== '[telemetry]') {
      return;
    }

    const payload = (await args[1].jsonValue().catch(() => null)) as
      | {
          event?: string;
          name?: string;
          value?: number;
          path?: string;
          ts?: string;
        }
      | undefined
      | null;

    if (!payload || payload.event !== 'metric' || !payload.name) {
      return;
    }

    const metric: TelemetryMetric = {
      name: payload.name,
      value: Number(payload.value ?? NaN),
      path: typeof payload.path === 'string' ? payload.path : undefined,
      ts: typeof payload.ts === 'string' ? payload.ts : undefined,
    };

    sink.push(metric);
    console.log('Telemetry metric:', JSON.stringify(metric));
  });
}

async function gotoDashboardAndWait(
  page: import('@playwright/test').Page,
  url: string,
  maxAttempts = 2,
) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await primeMockSession(page);
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle');
      const sessionStatus = await page
        .evaluate(
          (storageKey) => window.sessionStorage?.getItem(storageKey) ?? null,
          AUTH_SESSION_STORAGE_KEY,
        )
        .catch(() => null);
      const enableAuthFlag = await page
        .evaluate(() => (globalThis as { __APP_ENABLE_AUTH__?: string }).__APP_ENABLE_AUTH__)
        .catch(() => 'unknown');
      console.log(
        `${RENDER_PERF_LOG_PREFIX} auth flag=${enableAuthFlag} session=${
          sessionStatus ? 'present' : 'missing'
        }`,
      );

      const handledLogin = await attemptCredentialLogin(page);
      if (handledLogin) {
        await page.waitForLoadState('networkidle');
      }
      await expect(page.locator('#app-main')).toBeVisible({
        timeout: PAGE_READY_TIMEOUT_MS,
      });
      return;
    } catch (error) {
      lastError = error;
      const currentUrl = page.url();
      const domPreview =
        (await page
          .content()
          .then((html) => html.replace(/\s+/g, ' ').trim())
          .catch(() => '')) || 'unavailable';
      console.warn(
        `${RENDER_PERF_LOG_PREFIX} navigation attempt ${attempt} failed (${currentUrl}): ${
          error instanceof Error ? error.message : error
        }`,
      );
      console.warn(`${RENDER_PERF_LOG_PREFIX} DOM preview: ${domPreview.slice(0, 600)}`);
      if (attempt < maxAttempts) {
        await page.waitForTimeout(500);
      }
    }
  }

  throw lastError;
}

async function measureTableRenderMs(page: import('@playwright/test').Page, url: string) {
  await gotoDashboardAndWait(page, url);
  const renderStart = Date.now();
  await expect(page.getByText('Rows loaded:')).toBeVisible({ timeout: GRAPH_READY_TIMEOUT_MS });
  return Date.now() - renderStart;
}

async function measureGraphRenderMs(page: import('@playwright/test').Page, url: string) {
  await gotoDashboardAndWait(page, `/detail/graph?${url.replace('/?', '')}`);
  const renderStart = Date.now();
  await expect(page.locator('[data-testid="relationship-graph"]')).toBeVisible({
    timeout: GRAPH_READY_TIMEOUT_MS,
  });
  await expect(page.getByText('Legend')).toBeVisible({ timeout: GRAPH_READY_TIMEOUT_MS });
  return Date.now() - renderStart;
}

async function collectSampleWithRetry(
  context: import('@playwright/test').BrowserContext,
  measure: (_page: import('@playwright/test').Page, _url: string) => Promise<number>,
  url: string,
  maxAttempts = SAMPLE_MAX_ATTEMPTS,
  telemetrySink: TelemetryMetric[],
) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const samplePage = await context.newPage();
    attachTelemetryLogger(samplePage, telemetrySink);
    try {
      const sample = await measure(samplePage, url);
      await samplePage.close();
      return sample;
    } catch (error) {
      lastError = error;
      await samplePage.close().catch(() => {
        // ignore close failures from crashed pages and retry
      });
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 750));
      }
    }
  }

  throw lastError;
}

test('meets render budgets for large table and relationship graph', async ({ page }) => {
  test.setTimeout(90_000);
  const telemetryMetrics: TelemetryMetric[] = [];
  attachTelemetryLogger(page, telemetryMetrics);
  await gotoDashboardAndWait(page, '/');

  const tableSamples: number[] = [];
  const graphSamples: number[] = [];

  for (let index = 0; index < SAMPLE_COUNT; index += 1) {
    tableSamples.push(
      await collectSampleWithRetry(
        page.context(),
        measureTableRenderMs,
        `/?size=${TARGET_DATASET_SIZE}`,
        SAMPLE_MAX_ATTEMPTS,
        telemetryMetrics,
      ),
    );

    graphSamples.push(
      await collectSampleWithRetry(
        page.context(),
        measureGraphRenderMs,
        `/?size=${TARGET_DATASET_SIZE}`,
        SAMPLE_MAX_ATTEMPTS,
        telemetryMetrics,
      ),
    );
  }

  const tableMedianMs = median(tableSamples);
  const graphMedianMs = median(graphSamples);

  const telemetrySummary = Object.fromEntries(
    Object.entries(
      telemetryMetrics.reduce<Record<string, number[]>>((acc, metric) => {
        if (!Number.isFinite(metric.value)) {
          return acc;
        }
        acc[metric.name] ??= [];
        acc[metric.name].push(metric.value);
        return acc;
      }, {}),
    ).map(([name, values]) => [
      name,
      {
        count: values.length,
        median: median(values),
        latest: values.at(-1),
      },
    ]),
  );

  const report = {
    generatedAt: new Date().toISOString(),
    sampleCount: SAMPLE_COUNT,
    targetDatasetSize: TARGET_DATASET_SIZE,
    budgets: {
      tableMs: TABLE_BUDGET_MS,
      graphMs: GRAPH_BUDGET_MS,
    },
    metrics: {
      tableSamples,
      graphSamples,
      tableMedianMs,
      graphMedianMs,
      telemetry: {
        samples: telemetryMetrics,
        summary: telemetrySummary,
      },
    },
  };

  await mkdir(path.dirname(RENDER_BENCHMARK_ARTIFACT_PATH), { recursive: true });
  await writeFile(RENDER_BENCHMARK_ARTIFACT_PATH, JSON.stringify(report, null, 2));

  test.info().annotations.push({
    type: 'render-benchmark',
    description: JSON.stringify(report),
  });

  console.log('Render benchmark report:', JSON.stringify(report));

  expect(
    tableMedianMs,
    `table median ${tableMedianMs}ms exceeded budget ${TABLE_BUDGET_MS}ms`,
  ).toBeLessThanOrEqual(TABLE_BUDGET_MS);
  expect(
    graphMedianMs,
    `graph median ${graphMedianMs}ms exceeded budget ${GRAPH_BUDGET_MS}ms`,
  ).toBeLessThanOrEqual(GRAPH_BUDGET_MS);
});
