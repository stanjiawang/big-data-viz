import { expect, test } from '@playwright/test';

test('dashboard interactive controls work across detail, table, and graph sections', async ({
  page,
}) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Big Data Viz Lab' })).toBeVisible();

  await page.getByLabel('Dataset size').selectOption('50000000');
  await expect(page.getByText(/Dataset Size:\s*50M/i)).toBeVisible({ timeout: 15_000 });

  await page.getByLabel('Source').selectOption('user');
  await expect(page.getByText(/Source:\s*user/i)).toBeVisible({ timeout: 15_000 });

  await page.getByRole('button', { name: 'Open detail' }).first().click();
  await expect(page.getByText('Detailed View: Summary')).toBeVisible();
  await page.getByRole('button', { name: 'Back to dashboard' }).click();
  await expect(page.getByRole('heading', { name: 'Big Data Viz Lab' })).toBeVisible();

  const tableCard = page.locator('section', {
    has: page.getByRole('heading', { name: 'Large Table' }),
  });
  await tableCard.getByRole('button', { name: 'Switch to compact view' }).click();
  await expect(page.getByText('Compact density')).toBeVisible();
  await expect(page.getByText('Embedding preview')).toBeVisible();

  const tableViewport = tableCard.locator('div.h-full.overflow-auto').first();
  await tableViewport.evaluate((element) => {
    element.scrollTop = 500;
  });
  const scrollTop = await tableViewport.evaluate((element) => element.scrollTop);
  expect(scrollTop).toBeGreaterThan(100);

  await page.getByRole('button', { name: 'cluster-1' }).click();
  await expect(page.getByRole('button', { name: 'Clear' })).toBeVisible();
  await expect(page.getByText('Labels: class-A')).toBeVisible();
  await expect(page.getByText('Search: cluster-1')).toBeVisible();
  await page.getByRole('button', { name: /Hide edges/i }).click();
  await expect(page.getByRole('button', { name: /Show edges/i })).toBeVisible();
});

test('downloads PNG exports from summary and graph cards', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Big Data Viz Lab' })).toBeVisible();

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
