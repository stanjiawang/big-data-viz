import { expect, test } from '@playwright/test';

test('enables compare mode and renders compare sections', async ({ page }) => {
  await page.goto('/');

  const compareToggle = page.getByRole('checkbox', { name: 'Compare mode' });
  await compareToggle.check();

  await expect(page.getByText('Primary dataset')).toBeVisible();
  await expect(page.getByText('Compare dataset').nth(1)).toBeVisible();
});

test('renders source and search badges from URL state', async ({ page }) => {
  await page.goto('/?source=user&search=batch-42');

  await expect(page.getByText('Source: user').first()).toBeVisible();
  await expect(page.getByText('Search: batch-42').first()).toBeVisible();
});

test('renders label count badge from URL state', async ({ page }) => {
  await page.goto('/?labels=class-A,class-B');

  await expect(page.getByText('Labels: 2')).toBeVisible();
});

test('shows data failure when tenant context is required but not provided', async ({ page }) => {
  await page.goto('/?mockRequireTenant=true');

  await expect(page.getByText("We couldn't load table data.")).toBeVisible();
});

test('shows data failure for rate-limited backend responses', async ({ page }) => {
  await page.goto('/?mockFailure=rate-limit');

  await expect(page.getByText("We couldn't load table data.")).toBeVisible();
});
