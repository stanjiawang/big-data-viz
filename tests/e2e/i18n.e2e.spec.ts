import { expect, test } from '@playwright/test';

test('renders Chinese locale when lang query is set', async ({ page }) => {
  await page.goto('/?lang=zh-CN');

  await expect(page.getByRole('heading', { name: '大数据可视化实验室' })).toBeVisible();
  await expect(page.getByText('总记录数')).toBeVisible();
});

test('persists locale change from language switcher across reload', async ({ page }) => {
  await page.goto('/');

  await page.getByLabel('Language').click();
  await page.getByRole('option', { name: 'Chinese (Simplified)' }).click();
  await expect(page.getByRole('heading', { name: '大数据可视化实验室' })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('heading', { name: '大数据可视化实验室' })).toBeVisible();
  await expect(page.getByText('时间戳').first()).toBeVisible();
  await expect(page.getByText('来源').first()).toBeVisible();
});
