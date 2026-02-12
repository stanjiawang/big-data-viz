import { expect, test } from '@playwright/test';

test('dashboard interactive controls work across detail, table, and graph sections', async ({
  page,
}) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Big Data Viz Lab' })).toBeVisible();

  await page.getByLabel('Dataset size').selectOption('50000000');
  await expect(page.getByText('Dataset Size: 50M')).toBeVisible();

  await page.getByLabel('Source').selectOption('user');
  await expect(page.getByText('Source: user')).toBeVisible();

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

  const tableViewport = page.locator('div.h-80.overflow-auto').first();
  await tableViewport.evaluate((element) => {
    element.scrollTop = 500;
  });
  const scrollTop = await tableViewport.evaluate((element) => element.scrollTop);
  expect(scrollTop).toBeGreaterThan(100);

  await page.getByRole('button', { name: 'cluster-1' }).click();
  await expect(page.getByRole('button', { name: 'Clear' })).toBeVisible();
  await page.getByRole('button', { name: /Hide edges/i }).click();
  await expect(page.getByRole('button', { name: /Show edges/i })).toBeVisible();
});
