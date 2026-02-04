import { test, expect } from '@playwright/test';

test('relationship graph renders with cluster filters', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Big Data Viz Lab' })).toBeVisible();

  const graph = page.getByTestId('relationship-graph');
  await expect(graph).toBeVisible();

  await expect(page.getByRole('button', { name: 'cluster-1' })).toBeVisible();
});
