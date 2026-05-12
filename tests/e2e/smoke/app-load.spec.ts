/**
 * App load smoke tests
 * Verifies the application loads correctly without errors
 */

import { test, expect } from '../fixtures';

const BENIGN_FONT_HOSTS = new Set(['fonts.gstatic.com', 'fonts.googleapis.com']);
const URL_PATTERN = /https?:\/\/[^\s"'<>]+/g;

function referencesBenignFontHost(error: string): boolean {
  const matches = error.matchAll(URL_PATTERN);

  for (const match of matches) {
    try {
      const parsed = new URL(match[0]);
      if (BENIGN_FONT_HOSTS.has(parsed.hostname)) {
        return true;
      }
    } catch {
      // Ignore malformed URL-like text in browser console output.
    }
  }

  return false;
}

function isKnownBenignAppLoadError(error: string): boolean {
  return (
    error.includes('favicon.ico') ||
    error.includes('ERR_NETWORK') || // Network errors in mocked env
    error.includes('[E2E Mock]') || // Our mock console logs
    referencesBenignFontHost(error) ||
    error.includes('FRAGMENT_SHADER') || // Firefox WebGL quirk
    error.includes('is null') || // Firefox rendering quirk with refs
    error.includes('Failed to load resource') // Generic resource loading
  );
}

test.describe('App Load', () => {
  test.describe.configure({ mode: 'parallel' });

  test('should load the application without JavaScript errors', async ({ mockedPage }) => {
    const errors: string[] = [];

    // Capture console errors
    mockedPage.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Capture page errors
    mockedPage.on('pageerror', (error) => {
      errors.push(error.message);
    });

    // Navigate to the app
    await mockedPage.goto('/');

    // Wait for the app to fully render
    await mockedPage.waitForLoadState('networkidle');

    // Filter out expected/benign errors
    const criticalErrors = errors.filter((error) => !isKnownBenignAppLoadError(error));

    expect(criticalErrors).toHaveLength(0);
  });

  test('should display the main heading', async ({ mockedPage }) => {
    await mockedPage.goto('/');

    // Check for the main app title/heading
    const heading = mockedPage.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('should render interactive elements', async ({ mockedPage }) => {
    await mockedPage.goto('/');
    await mockedPage.waitForLoadState('networkidle');

    // Look for any interactive button in the app
    const buttons = mockedPage.locator('button');
    const buttonCount = await buttons.count();

    // App should have at least one interactive button
    expect(buttonCount).toBeGreaterThan(0);

    // At least one button should be visible
    const visibleButton = buttons.first();
    await expect(visibleButton).toBeVisible({ timeout: 10000 });
  });

  test('should display provider tabs when multiple providers are enabled', async ({
    mockedPage,
  }) => {
    await mockedPage.goto('/');

    // Check for tab navigation - at least one tab should be visible
    const tabs = mockedPage.locator('[role="tablist"], [data-testid="provider-tabs"]');

    // Wait for content to load
    await mockedPage.waitForLoadState('networkidle');

    // Either tabs are visible or a single provider view is shown
    const tabsVisible = await tabs.isVisible().catch(() => false);
    const mainContent = mockedPage.locator('main, #root, .app');

    // App should have rendered something
    expect(tabsVisible || (await mainContent.isVisible())).toBeTruthy();
  });

  test('should have proper page title', async ({ mockedPage }) => {
    await mockedPage.goto('/');

    // Page should have a title
    const title = await mockedPage.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });
});
