import { test, expect } from '@playwright/test';
test.describe('Repository Indexing Workflow', () => {
    test('renders repository selector and enters repository path to index', async ({ page }) => {
        await page.goto('/');
        // Check title and header
        await expect(page.locator('h1')).toContainText('DeepRepo');
        await expect(page.getByText('Active Repository')).toBeVisible();
        // Fill repository path
        const input = page.locator('input[placeholder*="e.g."]');
        await input.fill('C:/mock/repo');
        // Click index button
        const indexBtn = page.getByRole('button', { name: /Index Codebase/i });
        await expect(indexBtn).toBeEnabled();
    });
});
//# sourceMappingURL=indexing.spec.js.map