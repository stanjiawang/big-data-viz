import { expect, test } from '@playwright/test';

async function signInWithMockAccount(page: import('@playwright/test').Page) {
  await expect(page.getByRole('heading', { name: 'Sign in required' })).toBeVisible();
  await expect(page.getByText('analyst@example.com')).toBeVisible();
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: 'Big Data Viz Lab' })).toBeVisible();
}

test('requires mock sign-in before rendering dashboard', async ({ page }) => {
  await page.goto('/');

  await signInWithMockAccount(page);
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
});

test('returns to auth gate after sign out', async ({ page }) => {
  await page.goto('/');
  await signInWithMockAccount(page);

  await page.getByRole('button', { name: 'Sign out' }).click();

  await expect(page.getByRole('heading', { name: 'Sign in required' })).toBeVisible();
});

test('supports auth bootstrap for large dataset overview and graph detail routes', async ({
  page,
}) => {
  await page.goto('/?size=50000000');
  await signInWithMockAccount(page);
  await expect(page.getByText('Rows loaded:')).toBeVisible({ timeout: 20_000 });

  await page.goto('/detail/graph?size=50000000', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-testid="relationship-graph"]')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText('Legend')).toBeVisible({ timeout: 20_000 });
});
