import { expect, test } from '@playwright/test';

const SAMPLE_COUNT = Number(process.env.PERF_RENDER_SAMPLES ?? 3);
const TARGET_DATASET_SIZE = Number(process.env.PERF_RENDER_DATASET_SIZE ?? 50_000_000);
const TABLE_BUDGET_MS = Number(process.env.PERF_MAX_TABLE_RENDER_MS ?? 3000);
const GRAPH_BUDGET_MS = Number(process.env.PERF_MAX_GRAPH_RENDER_MS ?? 3000);

function median(values: number[]) {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
}

test('meets render budgets for large table and relationship graph', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Big Data Viz Lab' })).toBeVisible({
    timeout: 15_000,
  });

  const tableSamples: number[] = [];
  const graphSamples: number[] = [];

  for (let index = 0; index < SAMPLE_COUNT; index += 1) {
    const tablePage = await page.context().newPage();
    await tablePage.goto(`/?size=${TARGET_DATASET_SIZE}`, { waitUntil: 'domcontentloaded' });
    await expect(tablePage.getByRole('heading', { name: 'Big Data Viz Lab' })).toBeVisible({
      timeout: 15_000,
    });
    await expect(tablePage.getByText('Rows loaded:')).toBeVisible({ timeout: 15_000 });
    tableSamples.push(await tablePage.evaluate(() => Math.round(performance.now())));
    await tablePage.close();

    const graphPage = await page.context().newPage();
    await graphPage.goto(`/?size=${TARGET_DATASET_SIZE}`, { waitUntil: 'domcontentloaded' });
    await expect(graphPage.getByRole('heading', { name: 'Big Data Viz Lab' })).toBeVisible({
      timeout: 15_000,
    });
    await expect(graphPage.locator('[data-testid="relationship-graph"]')).toBeVisible({
      timeout: 15_000,
    });
    await expect(graphPage.getByText('Legend')).toBeVisible({ timeout: 15_000 });
    graphSamples.push(await graphPage.evaluate(() => Math.round(performance.now())));
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
