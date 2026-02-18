import { expect, test } from '@playwright/test';

test('large table keeps horizontal clipping configured in both density modes', async ({ page }) => {
  await page.goto('/?lang=en');
  await expect(page.getByRole('heading', { name: 'Big Data Viz Lab' })).toBeVisible();

  const tableCard = page.getByRole('region', { name: 'Large Table' }).first();
  await expect(tableCard).toBeVisible();

  const viewport = tableCard.locator('div.h-full.overflow-y-auto.overflow-x-hidden').first();
  await expect(viewport).toBeVisible();

  const initialOverflowX = await viewport.evaluate(
    (element) => window.getComputedStyle(element).overflowX,
  );
  expect(initialOverflowX).toBe('hidden');

  const initialPageOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1;
  });
  expect(initialPageOverflow).toBe(true);

  await tableCard
    .getByRole('button', {
      name: /Toggle density|Switch to compact view|Switch to comfortable view/i,
    })
    .click();
  await expect(tableCard.getByText('Compact density')).toBeVisible();

  const compactOverflowX = await viewport.evaluate(
    (element) => window.getComputedStyle(element).overflowX,
  );
  expect(compactOverflowX).toBe('hidden');

  const compactPageOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1;
  });
  expect(compactPageOverflow).toBe(true);
});
