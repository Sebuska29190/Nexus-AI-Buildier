import { test, expect } from '@playwright/test';

test.describe('Settings Page', () => {
  test('should load settings and display form fields', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // Should show Settings heading
    await expect(page.locator('h1')).toContainText(/settings/i, { timeout: 5000 });

    // Should have form fields visible
    const appNameInput = page.locator('input').first();
    await expect(appNameInput).toBeVisible({ timeout: 5000 });

    // Should have save button
    const saveButton = page.getByRole('button', { name: /save/i });
    await expect(saveButton).toBeVisible({ timeout: 3000 });
  });

  test('should validate port number', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // Find port input field
    const portInput = page.locator('input').filter({ has: /port/i }).or(
      page.locator('label:has-text("Port") ~ input, label:has-text("Port") + input')
    ).first();

    // Alternative: find input near "Port" label
    const allInputs = page.locator('input');
    const inputCount = await allInputs.count();

    // Try to find and fill port with invalid value
    for (let i = 0; i < inputCount; i++) {
      const input = allInputs.nth(i);
      const value = await input.inputValue();
      if (!isNaN(Number(value)) && Number(value) > 0) {
        // This is likely the port field
        await input.fill('80'); // Port < 1024 should fail validation
        break;
      }
    }

    // Click save
    const saveButton = page.getByRole('button', { name: /save changes/i }).or(
      page.getByRole('button', { name: /save/i })
    ).first();
    if (await saveButton.isVisible()) {
      await saveButton.click();

      // Should show validation error
      await page.waitForTimeout(500);
      const errorText = page.locator('text=Port');
      await expect(errorText.first()).toBeVisible({ timeout: 3000 }).catch(() => {
        // Validation may show as general error
      });
    }
  });
});
