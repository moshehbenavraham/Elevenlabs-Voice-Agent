/**
 * Provider render smoke tests
 * Verifies each provider tab renders correctly
 */

import { test, expect } from '../fixtures';

test.describe('Provider Render', () => {
  test.describe.configure({ mode: 'parallel' });

  test('should render ElevenLabs provider interface', async ({ mockedPage }) => {
    await mockedPage.goto('/');
    await mockedPage.waitForLoadState('networkidle');

    // Find and click the primary ElevenLabs widget tab if it exists
    const elevenLabsTab = mockedPage.getByTestId('provider-tab-elevenlabs');

    if ((await elevenLabsTab.count()) > 0) {
      await elevenLabsTab.click();
      await mockedPage.waitForTimeout(500);

      // Verify some content is displayed after clicking the tab
      // Look for buttons, text content, or any interactive elements
      const content = mockedPage.locator("button, h1, h2, p, [class*='voice']");
      const contentCount = await content.count();
      expect(contentCount).toBeGreaterThan(0);
    } else {
      // Single provider mode or ElevenLabs not enabled - just verify app renders
      const appRoot = mockedPage.locator('#root');
      await expect(appRoot).toBeVisible();
    }
  });

  test('should render OpenAI provider interface', async ({ mockedPage }) => {
    await mockedPage.goto('/');
    await mockedPage.waitForLoadState('networkidle');

    // Find and click OpenAI tab if it exists
    const openAITab = mockedPage.getByTestId('provider-tab-openai');

    if ((await openAITab.count()) > 0) {
      await openAITab.click();
      await mockedPage.waitForTimeout(500);

      // Verify some content is displayed
      const content = mockedPage.locator("button, h1, h2, p, [class*='voice']");
      const contentCount = await content.count();
      expect(contentCount).toBeGreaterThan(0);
    } else {
      // OpenAI not enabled - just verify app renders
      const appRoot = mockedPage.locator('#root');
      await expect(appRoot).toBeVisible();
    }
  });

  test('should render xAI provider interface', async ({ mockedPage }) => {
    await mockedPage.goto('/');
    await mockedPage.waitForLoadState('networkidle');

    // Find and click xAI tab if it exists
    const xAITab = mockedPage.getByTestId('provider-tab-xai');

    if ((await xAITab.count()) > 0) {
      await xAITab.click();
      await mockedPage.waitForTimeout(500);

      // Verify some content is displayed
      const content = mockedPage.locator("button, h1, h2, p, [class*='voice']");
      const contentCount = await content.count();
      expect(contentCount).toBeGreaterThan(0);
    } else {
      // xAI not enabled - just verify app renders
      const appRoot = mockedPage.locator('#root');
      await expect(appRoot).toBeVisible();
    }
  });

  test('should display content after page load', async ({ mockedPage }) => {
    await mockedPage.goto('/');
    await mockedPage.waitForLoadState('networkidle');

    // Verify the app root has content
    const appRoot = mockedPage.locator('#root');
    await expect(appRoot).toBeVisible();

    // Verify there's meaningful content (not just empty div)
    const hasContent = await mockedPage.evaluate(() => {
      const root = document.getElementById('root');
      return root ? root.innerHTML.length > 100 : false;
    });

    expect(hasContent).toBe(true);
  });

  test('should not show error state on initial load', async ({ mockedPage }) => {
    await mockedPage.goto('/');
    await mockedPage.waitForLoadState('networkidle');

    // Check for visible error messages or alerts
    const errorAlert = mockedPage.locator('[role="alert"]:has-text("error")');
    const errorAlertCount = await errorAlert.count();

    // Filter to only visible errors
    let visibleErrors = 0;
    for (let i = 0; i < errorAlertCount; i++) {
      if (
        await errorAlert
          .nth(i)
          .isVisible()
          .catch(() => false)
      ) {
        const text = await errorAlert.nth(i).textContent();
        // Ignore if it's just a class name match, not actual error text
        if (text && text.toLowerCase().includes('error')) {
          visibleErrors++;
        }
      }
    }

    expect(visibleErrors).toBe(0);
  });

  test('should have interactive elements', async ({ mockedPage }) => {
    await mockedPage.goto('/');
    await mockedPage.waitForLoadState('networkidle');

    // Look for any interactive elements
    const buttons = mockedPage.locator('button');
    const buttonCount = await buttons.count();

    // App should have buttons for interaction
    expect(buttonCount).toBeGreaterThan(0);
  });

  test('should maintain provider selection after page interaction', async ({ mockedPage }) => {
    await mockedPage.goto('/');
    await mockedPage.waitForLoadState('networkidle');

    const tabs = mockedPage.locator('[role="tab"]');
    const tabCount = await tabs.count();

    if (tabCount < 2) {
      test.skip();
      return;
    }

    // Select second tab
    await tabs.nth(1).click();
    const selectedText = await mockedPage
      .locator('[role="tab"][aria-selected="true"]')
      .textContent();

    // Interact with the page (click elsewhere, move mouse)
    // Note: mouse.wheel() is not supported in mobile WebKit, use click instead
    await mockedPage.mouse.move(100, 100);
    await mockedPage.mouse.click(200, 200);
    await mockedPage.waitForTimeout(500);

    // Verify selection is maintained
    const currentSelectedText = await mockedPage
      .locator('[role="tab"][aria-selected="true"]')
      .textContent();

    expect(currentSelectedText).toBe(selectedText);
  });
});
