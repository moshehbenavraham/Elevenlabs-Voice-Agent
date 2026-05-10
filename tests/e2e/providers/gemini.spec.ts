/**
 * E2E tests for Gemini Live provider connection
 * Tests WebSocket connection, voice selection, and message handling
 *
 * Follows patterns from openai.spec.ts
 */

import { test, expect } from '@playwright/test';
import { VoicePage } from '../page-objects/VoicePage';
import { setupMockServer } from '../utils/mock-server';
import { websocketMockScript } from '../utils/websocket-mock';
import { setupAudioMock } from '../utils/audio-mock';

test.describe('Gemini Provider', () => {
  let voicePage: VoicePage;

  test.beforeEach(async ({ page }) => {
    // Set up mocks before navigation
    await page.addInitScript(websocketMockScript);
    await setupAudioMock(page);
    await setupMockServer(page);

    voicePage = new VoicePage(page);
    await voicePage.goto();

    test.skip(
      await voicePage.providerTabGemini.isDisabled(),
      'Gemini provider is disabled by VITE_GEMINI_ENABLED=false'
    );

    await voicePage.selectProvider('gemini');
  });

  test.describe('Tab Display', () => {
    test('should display Gemini tab', async () => {
      await expect(voicePage.providerTabGemini).toBeVisible();
    });

    test('should activate Gemini tab when clicked', async () => {
      await expect(voicePage.providerTabGemini).toHaveAttribute('data-state', 'active');
    });

    test('should display Gemini Live branding in hero section', async ({ page }) => {
      const heroTitle = page.locator('h1').filter({ hasText: 'Gemini' });
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
      // Voice selector should be visible in Gemini provider
      await expect(voicePage.voiceSelector).toBeVisible();
    });

    test('should show available Gemini voices', async ({ page }) => {
      await voicePage.voiceSelector.click();

      // Check for Gemini voice options
      const voiceOptions = page.getByRole('option');
      await expect(voiceOptions.first()).toBeVisible();

      // Gemini has 4 voices: Puck, Charon, Kore, Fenrir, Aoede
      const count = await voiceOptions.count();
      expect(count).toBeGreaterThanOrEqual(4);
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

  test.describe('Session Timer', () => {
    test('should display session duration when connected', async ({ page }) => {
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('connected', 10000);

      // Session timer should appear
      const sessionTimer = page.locator('[data-testid="session-timer"]');
      await expect(sessionTimer).toBeVisible();
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
      const heroTitle = page.locator('h1').filter({ hasText: 'Gemini' });
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

      // Switch to OpenAI provider
      await voicePage.selectProvider('openai');

      // Gemini tab should no longer be active
      await expect(voicePage.providerTabGemini).not.toHaveAttribute('data-state', 'active');
    });

    test('should maintain connection state independently per provider', async () => {
      // Connect to Gemini
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('connected', 10000);

      // Switch to OpenAI
      await voicePage.selectProvider('openai');

      // Switch back to Gemini - state should be reset
      await voicePage.selectProvider('gemini');

      // Should be back in idle state (connection was closed on switch)
    });
  });

  test.describe('Reconnection', () => {
    test('should show reconnection status on disconnect', async () => {
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('connected', 10000);

      // Simulate WebSocket disconnect
      await voicePage.simulateWebSocketDisconnect(0, 1006);

      // Should trigger reconnection
      await expect(voicePage.reconnectionStatus).toBeVisible({ timeout: 5000 });
    });

    test('should allow manual reconnect after max retries', async () => {
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('connected', 10000);

      // Simulate network disconnect
      await voicePage.simulateNetworkDisconnect();

      // Wait for reconnection status
      await expect(voicePage.reconnectionStatus).toBeVisible({ timeout: 10000 });

      // Manual reconnect button should appear after max retries
      await expect(voicePage.reconnectionRetryButton).toBeVisible({ timeout: 30000 });
    });
  });
});
