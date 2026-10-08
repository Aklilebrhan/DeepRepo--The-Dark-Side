import { test, expect } from '@playwright/test';

test.describe('Settings and Feature Navigation', () => {
  test('navigates between chat, preview, and settings tabs', async ({ page }) => {
    await page.goto('/');

    // Switch to preview tab
    await page.getByRole('button', { name: /Preview/i }).click();
    await expect(page.getByText('No code snippet selected')).toBeVisible();

    // Switch to settings tab
    await page.getByRole('button', { name: /Settings/i }).click();
    await expect(page.getByText('Local System Settings & Offline Models')).toBeVisible();
    await expect(page.getByText('Reset Index')).toBeVisible();

    // Switch back to chat
    await page.getByRole('button', { name: /Chat/i }).click();
    await expect(page.getByText('Semantic Code Assistant')).toBeVisible();
  });
});
