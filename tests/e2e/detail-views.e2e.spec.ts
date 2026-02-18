import { expect, test } from '@playwright/test';

async function openAndReturn(
  page: import('@playwright/test').Page,
  cardHeading: string,
  detailLabel: string,
) {
  const card = page
    .getByRole('heading', { name: cardHeading })
    .locator('xpath=ancestor::section[1]');
  await card.getByRole('button', { name: 'Open detail' }).first().click();
  await expect(page.getByText(`Detailed View: ${detailLabel}`)).toBeVisible();
  await page.getByRole('button', { name: 'Back to dashboard' }).click();
  await expect(page.getByRole('heading', { name: 'Big Data Viz Lab' })).toBeVisible();
}

test('supports open-detail navigation across all dashboard feature cards', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Big Data Viz Lab' })).toBeVisible();

  await openAndReturn(page, 'Summary', 'Summary');
  await openAndReturn(page, 'Time Series', 'Time Series');
  await openAndReturn(page, 'Embedding Cloud', 'Embedding Cloud');
  await openAndReturn(page, 'Relationship Graph', 'Relationship Graph');
  await openAndReturn(page, 'D3 Scatter', 'D3 Scatter');
  await openAndReturn(page, 'Large Table', 'Large Table');
});

test('allows D3 detail interactions including filters, zoom, and reset', async ({ page }) => {
  await page.goto('/');

  const d3Card = page
    .getByRole('heading', { name: 'D3 Scatter' })
    .locator('xpath=ancestor::section[1]');
  await d3Card.getByRole('button', { name: 'Open detail' }).first().click();

  await expect(page.getByText('Detailed View: D3 Scatter')).toBeVisible();
  await expect(page.getByTestId('d3-embedding-scatter')).toBeVisible();

  await page.getByRole('button', { name: 'class-A' }).click();
  await expect(page.getByText('No points for selected labels.')).not.toBeVisible();

  await page.getByRole('button', { name: 'Reset view' }).click();
  await expect(page.getByText('No points for selected labels.')).not.toBeVisible();
});
