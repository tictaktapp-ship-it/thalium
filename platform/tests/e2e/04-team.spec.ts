import { test, expect } from '@playwright/test';

test.describe('team management', () => {
  test('team page shows org name', async ({ page }) => {
    await page.goto('/app/team');
    await expect(page.getByRole('heading', { name: /team/i })).toBeVisible();
    await expect(page.getByText('E2E Test Org')).toBeVisible();
  });

  test('invite member button is visible', async ({ page }) => {
    await page.goto('/app/team');
    await expect(page.getByRole('button', { name: /invite member/i })).toBeVisible();
  });

  test('invite modal opens on button click', async ({ page }) => {
    await page.goto('/app/team');
    await page.getByRole('button', { name: /invite member/i }).click();
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible({ timeout: 5000 });
  });

  test('role permissions section is visible', async ({ page }) => {
    await page.goto('/app/team');
    await expect(page.getByText(/role permissions/i)).toBeVisible();
  });
});