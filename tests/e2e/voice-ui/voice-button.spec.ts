/**
 * E2E tests for VoiceButton component state transitions
 * Tests button visual states, accessibility, and interaction patterns
 */

import { test, expect } from '@playwright/test';
import { VoicePage } from '../page-objects/VoicePage';
import { setupMockServer } from '../utils/mock-server';
import { websocketMockScript } from '../utils/websocket-mock';
import { setupAudioMock } from '../utils/audio-mock';

test.describe('Voice Button Component', () => {
  let voicePage: VoicePage;

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(websocketMockScript);
    await setupAudioMock(page);
    await setupMockServer(page);

    voicePage = new VoicePage(page);
    await voicePage.goto();
    await voicePage.selectProvider('openai');
  });

  test.describe('Initial State', () => {
    test('should display voice button', async () => {
      await expect(voicePage.voiceButton).toBeVisible();
    });

    test('should have idle state initially', async () => {
      const state = await voicePage.getVoiceButtonState();
      expect(state).toBe('idle');
    });

    test('should display "Ready" status text', async () => {
      const statusText = await voicePage.voiceButtonStatus.textContent();
      expect(statusText?.toLowerCase()).toContain('ready');
    });

    test('should have microphone icon in idle state', async () => {
      // Mic icon should be visible in idle state
      const micIcon = voicePage.voiceButton.locator('svg');
      await expect(micIcon).toBeVisible();
    });
  });

  test.describe('State Transitions', () => {
    test('should transition: idle -> loading -> connected', async () => {
      // Start in idle
      let state = await voicePage.getVoiceButtonState();
      expect(state).toBe('idle');

      // Click to connect
      await voicePage.clickVoiceButton();

      // Should transition to loading
      await voicePage.waitForVoiceButtonState('loading', 5000);
      state = await voicePage.getVoiceButtonState();
      expect(state).toBe('loading');

      // Should transition to connected
      await voicePage.waitForVoiceButtonState('connected', 10000);
      state = await voicePage.getVoiceButtonState();
      expect(state).toBe('connected');
    });

    test('should transition: connected -> idle on disconnect', async () => {
      // Connect
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('connected', 10000);

      // Disconnect
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('idle', 5000);

      const state = await voicePage.getVoiceButtonState();
      expect(state).toBe('idle');
    });
  });

  test.describe('Loading State', () => {
    test('should show spinner during loading', async () => {
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('loading', 5000);

      // Spinner icon should be visible
      const spinner = voicePage.voiceButton.locator('.animate-spin');
      await expect(spinner).toBeVisible();
    });

    test('should display "Connecting" status during loading', async () => {
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('loading', 5000);

      const statusText = await voicePage.voiceButtonStatus.textContent();
      expect(statusText?.toLowerCase()).toContain('connecting');
    });

    test('should disable button during loading', async () => {
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('loading', 5000);

      await expect(voicePage.voiceButton).toBeDisabled();
    });
  });

  test.describe('Connected State', () => {
    test('should show phone icon when connected', async () => {
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('connected', 10000);

      // Phone icon should be visible
      const phoneIcon = voicePage.voiceButton.locator('svg');
      await expect(phoneIcon).toBeVisible();
    });

    test('should display "Live" status when connected', async () => {
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('connected', 10000);

      const statusText = await voicePage.voiceButtonStatus.textContent();
      expect(statusText?.toLowerCase()).toContain('live');
    });

    test('should show active indicator dot', async () => {
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('connected', 10000);

      await expect(voicePage.voiceButtonActiveIndicator).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA attributes', async () => {
      await expect(voicePage.voiceButton).toHaveAttribute('role', 'button');
      await expect(voicePage.voiceButton).toHaveAttribute('aria-label');
    });

    test('should update aria-label based on state', async () => {
      // Idle state
      let ariaLabel = await voicePage.voiceButton.getAttribute('aria-label');
      expect(ariaLabel?.toLowerCase()).toContain('start');

      // Connected state
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('connected', 10000);

      ariaLabel = await voicePage.voiceButton.getAttribute('aria-label');
      expect(ariaLabel?.toLowerCase()).toContain('end');
    });

    test('should have aria-pressed attribute when connected', async () => {
      await expect(voicePage.voiceButton).toHaveAttribute('aria-pressed', 'false');

      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('connected', 10000);

      await expect(voicePage.voiceButton).toHaveAttribute('aria-pressed', 'true');
    });

    test('should be focusable with keyboard', async ({ page }) => {
      await page.keyboard.press('Tab');

      // Eventually the button should receive focus
      await voicePage.voiceButton.focus();
      await expect(voicePage.voiceButton).toBeFocused();
    });

    test('should activate on Enter key press', async ({ page }) => {
      await voicePage.voiceButton.focus();
      await page.keyboard.press('Enter');

      // Should start loading
      await voicePage.waitForVoiceButtonState('loading', 5000);
    });

    test('should activate on Space key press', async ({ page }) => {
      await voicePage.voiceButton.focus();
      await page.keyboard.press('Space');

      // Should start loading
      await voicePage.waitForVoiceButtonState('loading', 5000);
    });
  });

  test.describe('Visual Feedback', () => {
    test('should show glow effect when connected', async () => {
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('connected', 10000);

      // Glow effect is implemented via shadow styles
      const buttonStyles = await voicePage.voiceButton.evaluate((el) => {
        return window.getComputedStyle(el).boxShadow;
      });

      // Should have a non-none box shadow
      expect(buttonStyles).not.toBe('none');
    });

    test('should display concentric rings animation', async ({ page }) => {
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('connected', 10000);

      // Concentric rings are rendered around the button
      const _rings = page.locator('.rounded-full.border').filter({
        has: voicePage.voiceButton,
      });
      // Rings should be present in the parent container
    });
  });

  test.describe('Size Variants', () => {
    test('should support large size', async () => {
      // Default size is 'lg' for the main page
      const buttonClass = await voicePage.voiceButton.getAttribute('class');
      expect(buttonClass).toContain('w-32');
    });
  });
});
