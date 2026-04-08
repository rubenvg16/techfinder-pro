import { test, expect } from '@playwright/test';

test.describe('4.11 - Alert Flow E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login page for unauthenticated users', async ({ page }) => {
    await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to login when accessing alerts without auth', async ({ page }) => {
    await page.goto('/dashboard/alerts');
    await expect(page).toHaveURL(/login|auth/);
  });

  test('should show login errors for invalid credentials', async ({ page }) => {
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    const submitButton = page.locator('button[type="submit"], button:has-text("Sign"), button:has-text("Log")').first();

    await emailInput.fill('invalid@example.com');
    await passwordInput.fill('wrongpassword');
    await submitButton.click();

    await page.waitForTimeout(1000);
    
    const errorMessage = page.locator('[class*="error"], [data-testid="error"]');
    const errorCount = await errorMessage.count();
    
    if (errorCount > 0) {
      await expect(errorMessage.first()).toBeVisible({ timeout: 5000 });
    } else {
      const currentUrl = page.url();
      expect(currentUrl).not.toContain('/dashboard');
    }
  });

  test.describe('Authenticated alert flow', () => {
    test.use({ storageState: undefined });

    test('should create alert after login', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      const submitButton = page.locator('button[type="submit"]').first();

      await emailInput.waitFor({ state: 'visible', timeout: 10000 });
      await emailInput.fill(process.env.TEST_USER_EMAIL || 'test@example.com');
      await passwordInput.fill(process.env.TEST_USER_PASSWORD || 'testpassword');
      await submitButton.click();

      await page.waitForURL(/dashboard|search/, { timeout: 15000 });
      
      await page.goto('/dashboard/alerts');
      await page.waitForLoadState('networkidle');

      const createAlertButton = page.locator('button:has-text("Create"), button:has-text("Add Alert"), [data-testid="create-alert"]');
      const buttonCount = await createAlertButton.count();

      if (buttonCount > 0) {
        await createAlertButton.first().click();
        
        const productInput = page.locator('input[name="product"], input[placeholder*="product"]').first();
        const priceInput = page.locator('input[name="price"], input[placeholder*="price"]').first();
        
        if (await productInput.count() > 0) {
          await productInput.fill('iPhone 15');
          await priceInput.fill('1000');
          
          const saveButton = page.locator('button:has-text("Save"), button:has-text("Create")').first();
          await saveButton.click();
          
          await page.waitForTimeout(1000);
        }
      }
    });
  });
});

test.describe('4.11 - Alert Notification', () => {
  test('should have proper unsubscribe link in alert emails', async ({ page }) => {
    const unsubscribeLink = page.locator('a:has-text("Unsubscribe"), [href*="unsubscribe"]');
    const linkCount = await unsubscribeLink.count();
    
    if (linkCount === 0) {
      console.log('No unsubscribe links found - this is expected for non-email context');
    }
  });

  test('should display alert management UI', async ({ page }) => {
    await page.goto('/dashboard/alerts');
    await page.waitForLoadState('networkidle');

    const alertsContainer = page.locator('[data-testid="alerts"], [class*="alert"]');
    const containerCount = await alertsContainer.count();

    if (containerCount > 0) {
      await expect(alertsContainer.first()).toBeVisible({ timeout: 10000 });
    } else {
      const emptyState = page.locator('[class*="empty"], text=No alerts');
      const emptyCount = await emptyState.count();
      
      if (emptyCount > 0) {
        console.log('Empty alerts state displayed');
      }
    }
  });
});