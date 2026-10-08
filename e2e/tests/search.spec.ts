import { test, expect } from '@playwright/test';

test.describe('Semantic Search Workflow', () => {
  test('allows typing a query and triggering search', async ({ page }) => {
    await page.goto('/');

    const searchInput = page.locator('input[placeholder*="Semantic search"]');
    await expect(searchInput).toBeVisible();

    await searchInput.fill('how do we authenticate?');
    await searchInput.press('Enter');

    // Search input retains query
    await expect(searchInput).toHaveValue('how do we authenticate?');
  });
});
