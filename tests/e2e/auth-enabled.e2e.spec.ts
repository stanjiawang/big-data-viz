import { expect, test } from '@playwright/test';

async function signInWithMockAccount(page: import('@playwright/test').Page) {
  await expect(page).toHaveURL(/\/login(?:$|\?)/);
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();
  await page.locator('input[type="email"]').fill('analyst@example.com');
  await page.locator('input[type="password"]').fill('DemoPass!123');
  await page.getByRole('button', { name: /Sign in|登录/ }).click();
  await expect(page).not.toHaveURL(/\/login(?:$|\?)/, { timeout: 15_000 });
  await expect(
    page.getByRole('heading', { name: /Big Data Viz Lab|大数据可视化实验室/ }),
  ).toBeVisible({ timeout: 15_000 });
}

test('requires mock sign-in before rendering dashboard', async ({ page }) => {
  await page.goto('/?lang=en');

  await signInWithMockAccount(page);
  await expect(page.getByRole('button', { name: /Sign out|登出/ })).toBeVisible();
});

test('returns to auth gate after sign out', async ({ page }) => {
  await page.goto('/?lang=en');
  await signInWithMockAccount(page);

  await page.getByRole('button', { name: /Sign out|登出/ }).click();

  await expect(page).toHaveURL(/\/login(?:$|\?)/);
  await expect(page.locator('input[type="email"]')).toBeVisible();
});

test('supports auth bootstrap for large dataset overview and graph detail routes', async ({
  page,
}) => {
  await page.goto('/?lang=en&size=50000000');
  await signInWithMockAccount(page);
  await expect(page.getByText(/Rows loaded:|已加载行数：/)).toBeVisible({ timeout: 20_000 });

  await page.goto('/detail/graph?lang=en&size=50000000', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-testid="relationship-graph"]')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/Legend|图例/)).toBeVisible({ timeout: 20_000 });
});
