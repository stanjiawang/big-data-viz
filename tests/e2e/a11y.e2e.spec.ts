import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

function formatViolations(
  violations: Array<{ id: string; impact?: string | null; nodes: Array<{ target: string[] }> }>,
) {
  return violations
    .map((violation) => {
      const targets = violation.nodes
        .slice(0, 3)
        .map((node) => node.target.join(' '))
        .join(', ');
      return `${violation.impact ?? 'unknown'}:${violation.id} (${targets || 'no target'})`;
    })
    .join('\n');
}

async function expectNoSeriousOrCriticalA11yIssues(page: Page, includeSelector: string) {
  const results = await new AxeBuilder({ page })
    .include(includeSelector)
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();

  const violations = results.violations.filter((violation) => {
    return violation.impact === 'serious' || violation.impact === 'critical';
  });

  expect(
    violations,
    violations.length > 0 ? formatViolations(violations) : 'No serious or critical axe violations',
  ).toEqual([]);
}

test('dashboard meets axe serious/critical baseline', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Big Data Viz Lab' })).toBeVisible();

  await expectNoSeriousOrCriticalA11yIssues(page, '#app-main');
});

test('mobile filters dialog meets axe serious/critical baseline', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Filters' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();

  await expectNoSeriousOrCriticalA11yIssues(page, '[role="dialog"]');
});

test('detail view meets axe serious/critical baseline', async ({ page }) => {
  await page.goto('/detail/graph');
  await expect(page.getByRole('heading', { name: /Detailed View:/i })).toBeVisible();

  await expectNoSeriousOrCriticalA11yIssues(page, '#app-main');
});
