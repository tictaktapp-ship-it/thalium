import { test, expect } from '@playwright/test';

test.describe('authentication', () => {
  test('authenticated user can access app', async ({ page }) => {
    await page.goto('/app/instances');
    await expect(page).toHaveURL(/\/app\/instances/, { timeout: 15000 });
    await expect(page).not.toHaveURL(/login/);
  });

  test('login page renders sign in heading', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: undefined });
    const page = await ctx.newPage();
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible({ timeout: 10000 });
    await ctx.close();
  });

  test('unauthenticated access redirects to login', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: undefined });
    const page = await ctx.newPage();
    await page.goto('/app/instances');
    await page.waitForURL(/login/, { timeout: 15000 });
    await expect(page).toHaveURL(/login/);
    await ctx.close();
  });
});