import { expect, test } from '@playwright/test';

const SAMPLE_COUNT = Number(process.env.PERF_RENDER_SAMPLES ?? 3);
const TARGET_DATASET_SIZE = Number(process.env.PERF_RENDER_DATASET_SIZE ?? 50_000_000);
const TABLE_BUDGET_MS = Number(process.env.PERF_MAX_TABLE_RENDER_MS ?? 3000);
const GRAPH_BUDGET_MS = Number(process.env.PERF_MAX_GRAPH_RENDER_MS ?? 3200);
const PAGE_READY_TIMEOUT_MS = Number(process.env.PERF_PAGE_READY_TIMEOUT_MS ?? 25_000);
const GRAPH_READY_TIMEOUT_MS = Number(process.env.PERF_GRAPH_READY_TIMEOUT_MS ?? 30_000);

function median(values: number[]) {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
}

async function gotoDashboardAndWait(
  page: import('@playwright/test').Page,
  url: string,
  maxAttempts = 2,
) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle');
      await expect(page.locator('#app-main')).toBeVisible({
        timeout: PAGE_READY_TIMEOUT_MS,
      });
      return;
    } catch (error) {
      lastError = error;
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
  await gotoDashboardAndWait(page, `${url}&detail=graph`);
  const renderStart = Date.now();
  await expect(page.locator('[data-testid="relationship-graph"]')).toBeVisible({
    timeout: GRAPH_READY_TIMEOUT_MS,
  });
  await expect(page.getByText('Legend')).toBeVisible({ timeout: GRAPH_READY_TIMEOUT_MS });
  return Date.now() - renderStart;
}

test('meets render budgets for large table and relationship graph', async ({ page }) => {
  test.setTimeout(90_000);
  await gotoDashboardAndWait(page, '/');

  const tableSamples: number[] = [];
  const graphSamples: number[] = [];

  for (let index = 0; index < SAMPLE_COUNT; index += 1) {
    const tablePage = await page.context().newPage();
    tableSamples.push(await measureTableRenderMs(tablePage, `/?size=${TARGET_DATASET_SIZE}`));
    await tablePage.close();

    const graphPage = await page.context().newPage();
    graphSamples.push(await measureGraphRenderMs(graphPage, `/?size=${TARGET_DATASET_SIZE}`));
    await graphPage.close();
  }

  const tableMedianMs = median(tableSamples);
  const graphMedianMs = median(graphSamples);

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
    },
  };

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
