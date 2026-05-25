import { test, expect } from '@playwright/test';

const BRAIN_ID = '685a078f-948f-4709-8ce8-5b0ef7cf9ab9';

test.describe('brain instances', () => {
  test('instances list shows at least one instance', async ({ page }) => {
    await page.goto('/app/instances');
    await expect(page.getByRole('heading', { name: /brain instances/i })).toBeVisible();
    await expect(page.getByText('E2E Brain')).toBeVisible();
  });

  test('instance dashboard loads', async ({ page }) => {
    await page.goto(`/app/instances/${BRAIN_ID}`);
    await expect(page).toHaveURL(new RegExp(BRAIN_ID));
    await expect(page.getByText('E2E Brain')).toBeVisible();
  });

  test('memory browser loads', async ({ page }) => {
    await page.goto(`/app/instances/${BRAIN_ID}/memory`);
    await expect(page).toHaveURL(/\/memory$/);
    await expect(page.getByText('Coverage Map')).toBeVisible();
  });

  test('audit log loads', async ({ page }) => {
    await page.goto(`/app/instances/${BRAIN_ID}/audit`);
    await expect(page).toHaveURL(/\/audit$/);
  });

  test('API keys page loads', async ({ page }) => {
    await page.goto(`/app/instances/${BRAIN_ID}/keys`);
    await expect(page).toHaveURL(/\/keys$/);
    await expect(page.getByRole('heading', { name: /api keys/i })).toBeVisible();
  });

  test('config page loads', async ({ page }) => {
    await page.goto(`/app/instances/${BRAIN_ID}/config`);
    await expect(page).toHaveURL(/\/config$/);
  });

  test('settings page loads', async ({ page }) => {
    await page.goto(`/app/instances/${BRAIN_ID}/settings`);
    await expect(page).toHaveURL(/\/settings$/);
  });

  test('new instance page loads', async ({ page }) => {
    await page.goto('/app/instances/new');
    await expect(page.getByRole('heading', { name: /new brain instance/i })).toBeVisible();
    await expect(page.locator('input[type="text"], input[placeholder*="Brain"]')).toBeVisible();
  });
});
