import { test, expect } from '@playwright/test';
test.describe('Chat Interaction Workflow', () => {
    test('displays chat window and welcome message', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByText('Semantic Code Assistant')).toBeVisible();
        await expect(page.getByText('DeepRepo (The Dark Side)')).toBeVisible();
        const textarea = page.locator('textarea');
        await expect(textarea).toBeVisible();
    });
});
//# sourceMappingURL=chat.spec.js.map