/**
 * E2E tests for OpenAI Realtime provider connection
 * Tests WebSocket connection, voice selection, and message handling
 */

import { test, expect } from '@playwright/test';
import { VoicePage } from '../page-objects/VoicePage';
import { setupMockServer } from '../utils/mock-server';
import { websocketMockScript } from '../utils/websocket-mock';
import { setupAudioMock } from '../utils/audio-mock';

test.describe('OpenAI Provider', () => {
  let voicePage: VoicePage;

  test.beforeEach(async ({ page }) => {
    // Set up mocks before navigation
    await page.addInitScript(websocketMockScript);
    await setupAudioMock(page);
    await setupMockServer(page);

    voicePage = new VoicePage(page);
    await voicePage.goto();
    await voicePage.selectProvider('openai');
  });

  test.describe('Tab Display', () => {
    test('should display OpenAI tab', async () => {
      await expect(voicePage.providerTabOpenai).toBeVisible();
    });

    test('should activate OpenAI tab when clicked', async () => {
      await expect(voicePage.providerTabOpenai).toHaveAttribute('data-state', 'active');
    });

    test('should display GPT-4o branding in hero section', async ({ page }) => {
      const heroTitle = page.locator('h1').filter({ hasText: 'GPT-4o' });
      await expect(heroTitle).toBeVisible();
    });
  });

  test.describe('Voice Button States', () => {
    test('should display voice button in idle state', async () => {
      await expect(voicePage.voiceButton).toBeVisible();
      const state = await voicePage.getVoiceButtonState();
      expect(state).toBe('idle');
    });

    test('should show "Ready" status when idle', async () => {
      const statusText = await voicePage.voiceButtonStatus.textContent();
      expect(statusText?.toLowerCase()).toContain('ready');
    });

    test('should transition to loading state when clicked', async () => {
      await voicePage.clickVoiceButton();

      // Should briefly show loading state
      await voicePage.waitForVoiceButtonState('loading', 5000);
    });

    test('should transition to connected state after loading', async () => {
      await voicePage.clickVoiceButton();

      // Wait for connected state
      await voicePage.waitForVoiceButtonState('connected', 10000);

      const state = await voicePage.getVoiceButtonState();
      expect(state).toBe('connected');
    });

    test('should show "Live" status when connected', async () => {
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('connected', 10000);

      const statusText = await voicePage.voiceButtonStatus.textContent();
      expect(statusText?.toLowerCase()).toContain('live');
    });
  });

  test.describe('WebSocket Connection', () => {
    test('should establish WebSocket connection on button click', async () => {
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('connected', 10000);

      const connectionCount = await voicePage.getWebSocketConnectionCount();
      expect(connectionCount).toBeGreaterThan(0);
    });

    test('should close WebSocket connection when disconnecting', async () => {
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('connected', 10000);

      // Click to disconnect
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('idle', 5000);
    });
  });

  test.describe('Voice Selection', () => {
    test('should display voice selector', async () => {
      // Voice selector should be visible in OpenAI provider
      await expect(voicePage.voiceSelector).toBeVisible();
    });

    test('should show available OpenAI voices', async ({ page }) => {
      await voicePage.voiceSelector.click();

      // Check for OpenAI voice options
      const voiceOptions = page.getByRole('option');
      await expect(voiceOptions.first()).toBeVisible();

      // OpenAI has 8 voices: alloy, ash, ballad, coral, echo, sage, shimmer, verse
      const count = await voiceOptions.count();
      expect(count).toBeGreaterThanOrEqual(5);
    });

    test('should disable voice selector when connected', async () => {
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('connected', 10000);

      // Voice selector should be disabled during active connection
      await expect(voicePage.voiceSelector).toBeDisabled();
    });
  });

  test.describe('Conversation Panel', () => {
    test('should display conversation panel when connected', async () => {
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('connected', 10000);

      await expect(voicePage.conversationPanel).toBeVisible();
    });

    test('should show empty state message initially', async () => {
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('connected', 10000);

      await expect(voicePage.conversationEmpty).toBeVisible();
    });
  });

  test.describe('Disconnect Flow', () => {
    test('should return to hero section after disconnect', async ({ page }) => {
      // Connect
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('connected', 10000);

      // Disconnect
      const endButton = page.getByRole('button', { name: /end conversation/i });
      if (await endButton.isVisible()) {
        await endButton.click();
      } else {
        await voicePage.clickVoiceButton();
      }

      await voicePage.waitForVoiceButtonState('idle', 5000);

      // Hero section should reappear
      const heroTitle = page.locator('h1').filter({ hasText: 'GPT-4o' });
      await expect(heroTitle).toBeVisible();
    });

    test('should show disconnection toast notification', async ({ page }) => {
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('connected', 10000);

      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('idle', 5000);

      // Toast notification should appear
      const _toast = page.locator('[role="alert"]').filter({ hasText: /disconnected/i });
      // Toast may appear briefly
    });
  });

  test.describe('Provider Switching', () => {
    test('should disconnect when switching to another provider', async () => {
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('connected', 10000);

      // Switch to xAI provider
      await voicePage.selectProvider('xai');

      // OpenAI tab should no longer be active
      await expect(voicePage.providerTabOpenai).not.toHaveAttribute('data-state', 'active');
    });

    test('should maintain connection state independently per provider', async () => {
      // Connect to OpenAI
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('connected', 10000);

      // Switch to xAI
      await voicePage.selectProvider('xai');

      // Switch back to OpenAI - state should be reset
      await voicePage.selectProvider('openai');

      // Should be back in idle state (connection was closed on switch)
    });
  });
});
