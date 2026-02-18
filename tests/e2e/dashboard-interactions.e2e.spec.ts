import { expect, test } from '@playwright/test';

test('dashboard interactive controls work across detail, table, and graph sections', async ({
  page,
}) => {
  await page.goto('/?lang=en');

  await expect(
    page.getByRole('heading', { name: /Big Data Viz Lab|大数据可视化实验室/ }),
  ).toBeVisible();

  await page.getByLabel('Dataset size').click();
  await page
    .getByRole('listbox', { name: 'Dataset size' })
    .getByRole('option', { name: '50M' })
    .dispatchEvent('click');
  await expect(page.getByText(/Dataset Size:\s*50M/i)).toBeVisible({ timeout: 15_000 });

  await page.getByLabel('Source').click();
  await page
    .getByRole('listbox', { name: 'Source' })
    .getByRole('option', { name: 'user' })
    .dispatchEvent('click');
  await expect(page.getByText(/Source:\s*user/i).first()).toBeVisible({ timeout: 15_000 });

  const annotationPanel = page.locator('section', {
    has: page.getByRole('heading', { name: 'Annotations' }),
  });
  await annotationPanel
    .getByPlaceholder('e.g. Validate unexpected spike before report export')
    .fill('check table drift');
  await annotationPanel.getByRole('button', { name: 'Add note' }).click();
  await expect(annotationPanel.getByText('check table drift')).toBeVisible();

  await page.getByRole('button', { name: 'Capture snapshot' }).click();
  const snapshotTimeline = page.getByLabel('Snapshot timeline');
  await snapshotTimeline.click();
  await expect(page.getByRole('option', { name: 'Snapshot 1' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear timeline' }).click();
  await page.getByRole('button', { name: 'Capture snapshot' }).click();
  await snapshotTimeline.click();
  await page.getByRole('option', { name: 'Snapshot 1' }).click();
  await page.getByRole('button', { name: 'Replay snapshot' }).click();
  await expect(page.getByText(/Source:\s*user/i).first()).toBeVisible({ timeout: 15_000 });

  await page.getByRole('button', { name: 'Enable live' }).click();
  await expect(page.getByRole('button', { name: 'Disable live' })).toBeVisible();
  await page.getByRole('button', { name: 'Pause' }).click();
  await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible();

  await page.getByRole('button', { name: 'Open detail' }).first().click();
  await expect(page.getByText('Detailed View: Summary')).toBeVisible();
  await page.getByRole('button', { name: 'Back to dashboard' }).click();
  await expect(
    page.getByRole('heading', { name: /Big Data Viz Lab|大数据可视化实验室/ }),
  ).toBeVisible({ timeout: 15_000 });

  const tableCard = page.locator('section', {
    has: page.getByRole('heading', { name: 'Large Table' }),
  });
  await tableCard.getByRole('button', { name: 'Switch to compact view' }).click();
  await expect(page.getByText('Compact density')).toBeVisible();
  await expect(page.getByText('Embedding preview')).toBeVisible();

  const tableViewport = tableCard.locator('div.h-full.overflow-y-auto.overflow-x-hidden').first();
  await tableViewport.evaluate((element) => {
    element.scrollTop = 500;
  });
  const scrollTop = await tableViewport.evaluate((element) => element.scrollTop);
  expect(scrollTop).toBeGreaterThan(100);

  const graphRegion = page.getByTestId('relationship-graph');
  await page.getByRole('button', { name: 'cluster-1' }).click();
  await expect(graphRegion.getByRole('button', { name: 'Clear' })).toBeVisible();
  await expect(page.getByText('Labels: class-A').first()).not.toBeVisible();
  await expect(page.getByText('Search: cluster-1').first()).not.toBeVisible();
  await graphRegion.getByRole('button', { name: /Hide edges/i }).click();
  await expect(graphRegion.getByRole('button', { name: /Show edges/i })).toBeVisible();
});

test('downloads PNG exports from summary and graph cards', async ({ page }) => {
  await page.goto('/?lang=en');
  await expect(
    page.getByRole('heading', { name: /Big Data Viz Lab|大数据可视化实验室/ }),
  ).toBeVisible();

  await page.evaluate(() => {
    (window as Window & { __lastExportedImage?: string }).__lastExportedImage = undefined;
  });

  const summaryCard = page
    .getByRole('heading', { name: 'Summary' })
    .locator('xpath=ancestor::section[1]');
  await summaryCard.getByRole('button', { name: 'Download image' }).click();
  await expect
    .poll(
      () =>
        page.evaluate(
          () => (window as Window & { __lastExportedImage?: string }).__lastExportedImage,
        ),
      { timeout: 15_000 },
    )
    .toBe('summary.png');

  const graphCard = page
    .getByRole('heading', { name: 'Relationship Graph' })
    .locator('xpath=ancestor::section[1]');
  await graphCard.getByRole('button', { name: 'Download image' }).click();
  await expect
    .poll(
      () =>
        page.evaluate(
          () => (window as Window & { __lastExportedImage?: string }).__lastExportedImage,
        ),
      { timeout: 15_000 },
    )
    .toBe('relationship-graph.png');
});

test('keeps realtime control state stable when refreshing data', async ({ page }) => {
  await page.goto('/?lang=en');
  await expect(
    page.getByRole('heading', { name: /Big Data Viz Lab|大数据可视化实验室/ }),
  ).toBeVisible();

  const refreshButton = page.getByRole('button', { name: 'Refresh data' });

  // Off mode: refresh should not toggle realtime mode.
  await expect(page.getByRole('button', { name: 'Enable live' })).toBeVisible();
  await refreshButton.click();
  await expect(page.getByRole('button', { name: 'Enable live' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Pause' })).toBeDisabled();

  // Live mode: refresh should keep stream live.
  await page.getByRole('button', { name: 'Enable live' }).click();
  await expect(page.getByRole('button', { name: 'Disable live' })).toBeVisible();
  await refreshButton.click();
  await expect(page.getByRole('button', { name: 'Disable live' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Pause' })).toBeEnabled();

  // Paused mode: refresh should not auto-resume realtime.
  await page.getByRole('button', { name: 'Pause' }).click();
  await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible();
  await refreshButton.click();
  await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Disable live' })).toBeVisible();
});
