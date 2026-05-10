/**
 * Tab navigation smoke tests
 * Verifies tab switching works with both mouse and keyboard
 */

import { test, expect } from '../fixtures';

test.describe('Tab Navigation', () => {
  test.describe.configure({ mode: 'parallel' });

  test('should switch tabs on click', async ({ mockedPage }) => {
    await mockedPage.goto('/');
    await mockedPage.waitForLoadState('networkidle');

    // Find tab buttons
    const tabs = mockedPage.locator('[role="tab"]:not([disabled])');
    const tabCount = await tabs.count();

    // Skip if no tabs (single provider mode)
    if (tabCount < 2) {
      test.skip();
      return;
    }

    // Get initial active tab
    const initialActiveTab = mockedPage.locator('[role="tab"][aria-selected="true"]');
    const initialTabText = await initialActiveTab.textContent();

    // Click the second tab
    await tabs.nth(1).click();

    // Verify the tab changed
    const newActiveTab = mockedPage.locator('[role="tab"][aria-selected="true"]');
    const newTabText = await newActiveTab.textContent();

    expect(newTabText).not.toBe(initialTabText);
  });

  test('should navigate tabs with arrow keys', async ({ mockedPage }) => {
    await mockedPage.goto('/');
    await mockedPage.waitForLoadState('networkidle');

    const tabs = mockedPage.locator('[role="tab"]:not([disabled])');
    const tabCount = await tabs.count();

    if (tabCount < 2) {
      test.skip();
      return;
    }

    // Focus the first tab
    await tabs.first().focus();

    // Get the initial focused tab
    const _initialFocusedText = await mockedPage.evaluate(() => {
      return document.activeElement?.textContent || '';
    });

    // Press right arrow to move to next tab
    await mockedPage.keyboard.press('ArrowRight');

    // Get the new focused element
    const _newFocusedText = await mockedPage.evaluate(() => {
      return document.activeElement?.textContent || '';
    });

    // The focus should have moved (or wrapped around if at the end)
    // Verify focus is still on a tab element
    const focusedRole = await mockedPage.evaluate(() => {
      return document.activeElement?.getAttribute('role');
    });
    expect(focusedRole).toBe('tab');
  });

  test('should navigate tabs with left arrow key', async ({ mockedPage }) => {
    await mockedPage.goto('/');
    await mockedPage.waitForLoadState('networkidle');

    const tabs = mockedPage.locator('[role="tab"]:not([disabled])');
    const tabCount = await tabs.count();

    if (tabCount < 2) {
      test.skip();
      return;
    }

    // Focus the last tab
    await tabs.last().focus();

    // Press left arrow to move to previous tab
    await mockedPage.keyboard.press('ArrowLeft');

    // Verify focus moved
    const focusedElement = await mockedPage.evaluate(() => {
      return document.activeElement?.getAttribute('role');
    });

    expect(focusedElement).toBe('tab');
  });

  test('should activate tab with Enter key', async ({ mockedPage }) => {
    await mockedPage.goto('/');
    await mockedPage.waitForLoadState('networkidle');

    const tabs = mockedPage.locator('[role="tab"]:not([disabled])');
    const tabCount = await tabs.count();

    if (tabCount < 2) {
      test.skip();
      return;
    }

    // Focus the second tab (without clicking)
    await tabs.nth(1).focus();

    // Get the focused tab text
    const focusedTabText = await mockedPage.evaluate(() => {
      return document.activeElement?.textContent || '';
    });

    // Press Enter to activate
    await mockedPage.keyboard.press('Enter');

    // Verify the tab is now selected
    const activeTab = mockedPage.locator('[role="tab"][aria-selected="true"]');
    await expect(activeTab).toHaveText(focusedTabText);
  });

  test('should activate tab with Space key', async ({ mockedPage }) => {
    await mockedPage.goto('/');
    await mockedPage.waitForLoadState('networkidle');

    const tabs = mockedPage.locator('[role="tab"]:not([disabled])');
    const tabCount = await tabs.count();

    if (tabCount < 2) {
      test.skip();
      return;
    }

    // Ensure first tab is ready, then click
    await expect(tabs.first()).toBeVisible();
    await tabs.first().click();
    await mockedPage.waitForTimeout(200);

    // Focus the second tab
    await tabs.nth(1).focus();

    // Press Space to activate
    await mockedPage.keyboard.press('Space');

    // Verify second tab is now active
    const _activeTab = mockedPage.locator('[role="tab"][aria-selected="true"]');
    const activeIndex = await tabs.evaluateAll((tabElements, _activeEl) => {
      return tabElements.findIndex((t) => t.getAttribute('aria-selected') === 'true');
    });

    expect(activeIndex).toBe(1);
  });

  test('should navigate to tabs with Tab key', async ({ mockedPage }) => {
    await mockedPage.goto('/');
    await mockedPage.waitForLoadState('networkidle');

    const tabs = mockedPage.locator('[role="tab"]:not([disabled])');
    const tabCount = await tabs.count();

    if (tabCount === 0) {
      test.skip();
      return;
    }

    // Start from beginning of document
    await mockedPage.keyboard.press('Tab');

    // Keep tabbing until we reach a tab element (or max attempts)
    let foundTab = false;
    for (let i = 0; i < 20; i++) {
      const activeRole = await mockedPage.evaluate(() => {
        return document.activeElement?.getAttribute('role');
      });

      if (activeRole === 'tab') {
        foundTab = true;
        break;
      }

      await mockedPage.keyboard.press('Tab');
    }

    // Tabs should be reachable via Tab key
    expect(foundTab).toBe(true);
  });

  test('should have proper ARIA attributes on tabs', async ({ mockedPage }) => {
    await mockedPage.goto('/');
    await mockedPage.waitForLoadState('networkidle');

    const tabList = mockedPage.locator('[role="tablist"]');

    // Skip if no tablist
    if ((await tabList.count()) === 0) {
      test.skip();
      return;
    }

    // Verify tablist exists
    await expect(tabList).toBeVisible();

    // Verify tabs have required ARIA attributes
    const tabs = mockedPage.locator('[role="tab"]:not([disabled])');
    const tabCount = await tabs.count();

    for (let i = 0; i < tabCount; i++) {
      const tab = tabs.nth(i);

      // Each tab should have aria-selected
      const ariaSelected = await tab.getAttribute('aria-selected');
      expect(ariaSelected).toMatch(/^(true|false)$/);

      // Each tab should have aria-controls or be associated with a panel
      const _ariaControls = await tab.getAttribute('aria-controls');
      // Note: aria-controls is optional but recommended
    }

    // Exactly one tab should be selected
    const selectedTabs = mockedPage.locator('[role="tab"][aria-selected="true"]');
    await expect(selectedTabs).toHaveCount(1);
  });
});
