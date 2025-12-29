/**
 * Playwright fixture for audio mocking
 * Automatically injects audio mocks before each test
 */

/* eslint-disable react-hooks/rules-of-hooks */
import { test as base, type Page } from '@playwright/test';
import { audioMockScript } from '../utils/audio-mock';
import { websocketMockScript } from '../utils/websocket-mock';
import { setupMockServer } from '../utils/mock-server';

/**
 * Extended test fixture with audio mocking enabled
 */
export const test = base.extend<{
  mockedPage: Page;
}>({
  mockedPage: async ({ page }, use) => {
    // Inject audio mocks before any navigation
    await page.addInitScript(audioMockScript);
    await page.addInitScript(websocketMockScript);

    // Set up mock API routes
    await setupMockServer(page);

    // Use the page with mocks
    await use(page);
  },
});

export { expect } from '@playwright/test';
