import { expect, test } from '@playwright/test';

test('renders dashboard in healthy mode', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Big Data Viz Lab' })).toBeVisible();
  await expect(page.getByTestId('relationship-graph')).toBeVisible();
});

test('shows async boundary errors when server failures are simulated', async ({ page }) => {
  await page.goto('/?mockFailure=server-error');

  await expect(page.getByText("We couldn't load table data.")).toBeVisible();
});

test('surfaces parse failures from malformed mock payloads', async ({ page }) => {
  await page.goto('/?mockFailure=malformed');

  await expect(page.getByText("We couldn't load table data.")).toBeVisible();
});

test('supports tenant-required mocks when tenant context is provided', async ({ page }) => {
  await page.goto('/?mockRequireTenant=true&mockTenantId=tenant-e2e');

  await expect(page.getByRole('heading', { name: 'Big Data Viz Lab' })).toBeVisible();
  await expect(page.getByTestId('relationship-graph')).toBeVisible();
});
