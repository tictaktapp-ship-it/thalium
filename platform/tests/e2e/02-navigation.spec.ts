import { test, expect } from '@playwright/test';

test.describe('navigation', () => {
  test('instances list loads', async ({ page }) => {
    await page.goto('/app/instances');
    await expect(page.getByRole('heading', { name: /brain instances/i })).toBeVisible();
  });

  test('activity page loads', async ({ page }) => {
    await page.goto('/app/activity');
    await expect(page).toHaveURL(/\/app\/activity/);
  });

  test('team page loads', async ({ page }) => {
    await page.goto('/app/team');
    await expect(page).toHaveURL(/\/app\/team/);
    await expect(page.getByRole('heading', { name: /team/i })).toBeVisible();
  });

  test('billing page loads with subscription data', async ({ page }) => {
    await page.goto('/app/billing');
    await expect(page).toHaveURL(/\/app\/billing/);
    await expect(page.getByRole('heading', { name: /billing/i })).toBeVisible();
    // E2E org is on Neuron plan
    await expect(page.getByText(/neuron/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Active').first()).toBeVisible({ timeout: 10000 });
  });
});
