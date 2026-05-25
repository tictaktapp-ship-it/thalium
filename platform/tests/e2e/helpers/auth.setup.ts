import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(process.cwd(), 'tests/e2e/fixtures/auth.json');

setup('authenticate', async ({ page }) => {
  const email = process.env.PLAYWRIGHT_TEST_EMAIL;
  const password = process.env.PLAYWRIGHT_TEST_PASSWORD;

  if (!email || !password) {
    throw new Error('PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD must be set');
  }

  await page.goto('/login');
  await expect(page).toHaveURL(/login/);

  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('input[type="password"]').press('Enter');

  await page.waitForURL(/\/app\//, { timeout: 15000 });
  await expect(page).toHaveURL(/\/app\//);

  await page.context().storageState({ path: authFile });
});