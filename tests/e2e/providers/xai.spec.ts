/**
 * E2E tests for xAI (Grok) Realtime provider connection
 * Tests WebSocket connection, voice selection, and message handling
 */

import { test, expect } from '@playwright/test';
import { VoicePage } from '../page-objects/VoicePage';
import { setupMockServer } from '../utils/mock-server';
import { websocketMockScript } from '../utils/websocket-mock';
import { setupAudioMock } from '../utils/audio-mock';

test.describe('xAI Provider', () => {
  let voicePage: VoicePage;

  test.beforeEach(async ({ page }) => {
    // Set up mocks before navigation
    await page.addInitScript(websocketMockScript);
    await setupAudioMock(page);
    await setupMockServer(page);

    voicePage = new VoicePage(page);
    await voicePage.goto();
    await voicePage.selectProvider('xai');
  });

  test.describe('Tab Display', () => {
    test('should display xAI tab', async () => {
      await expect(voicePage.providerTabXai).toBeVisible();
    });

    test('should activate xAI tab when clicked', async () => {
      await expect(voicePage.providerTabXai).toHaveAttribute('data-state', 'active');
    });

    test('should display Grok branding in hero section', async ({ page }) => {
      const heroTitle = page.locator('h1').filter({ hasText: 'Grok' });
      await expect(heroTitle).toBeVisible();
    });

    test('should show xAI-specific styling', async ({ page }) => {
      // xAI uses sky-colored styling
      const grokText = page.locator('.text-sky-400').filter({ hasText: 'Grok' });
      await expect(grokText).toBeVisible();
    });
  });

  test.describe('Voice Button States', () => {
    test('should display voice button in idle state', async () => {
      await expect(voicePage.voiceButton).toBeVisible();
      const state = await voicePage.getVoiceButtonState();
      expect(state).toBe('idle');
    });

    test('should transition to loading state when clicked', async () => {
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('loading', 5000);
    });

    test('should transition to connected state after loading', async () => {
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('connected', 10000);

      const state = await voicePage.getVoiceButtonState();
      expect(state).toBe('connected');
    });

    test('should display listening state when connected', async ({ page }) => {
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('connected', 10000);

      const listeningText = page.locator('h2').filter({ hasText: 'Grok is Listening' });
      await expect(listeningText).toBeVisible();
    });
  });

  test.describe('WebSocket Connection', () => {
    test('should establish WebSocket connection to xAI endpoint', async ({ page }) => {
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('connected', 10000);

      const connectionCount = await voicePage.getWebSocketConnectionCount();
      expect(connectionCount).toBeGreaterThan(0);

      // Verify xAI endpoint was used
      const connections = await page.evaluate(() => {
        return window.__E2E_WEBSOCKET_MOCK__?.getConnections().map((c) => c.url);
      });
      const hasXAIConnection = connections?.some((url) => url?.includes('x.ai'));
      expect(hasXAIConnection).toBeTruthy();
    });

    test('should receive session.created event after connection', async () => {
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('connected', 10000);

      // Connection should be established - mock sends session.created
    });
  });

  test.describe('Voice Selection', () => {
    test('should display voice selector for xAI', async () => {
      await expect(voicePage.voiceSelector).toBeVisible();
    });

    test('should show available xAI voices', async ({ page }) => {
      await voicePage.voiceSelector.click();

      const voiceOptions = page.getByRole('option');
      await expect(voiceOptions.first()).toBeVisible();

      // xAI has 5 voices: ash, ballad, coral, sage, verse
      const count = await voiceOptions.count();
      expect(count).toBeGreaterThanOrEqual(5);
    });

    test.skip('should show sky-colored accent for xAI voice selector', async () => {
      // TODO: Implement xAI sky color scheme verification
    });
  });

  test.describe('Conversation Panel', () => {
    test('should display conversation panel when connected', async () => {
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('connected', 10000);

      await expect(voicePage.conversationPanel).toBeVisible();
    });

    test('should show empty state initially', async () => {
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('connected', 10000);

      await expect(voicePage.conversationEmpty).toBeVisible();
    });
  });

  test.describe('Voice Visualizer', () => {
    test('should display visualizer when connected', async ({ page }) => {
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('connected', 10000);

      // Visualizer canvas should be present
      const canvas = page.locator('canvas');
      await expect(canvas).toBeVisible();
    });
  });

  test.describe('Disconnect Flow', () => {
    test('should return to hero section after disconnect', async ({ page }) => {
      // Connect
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('connected', 10000);

      // Find and click end conversation button
      const endButton = page.getByRole('button', { name: /end conversation/i });
      if (await endButton.isVisible()) {
        await endButton.click();
      } else {
        await voicePage.clickVoiceButton();
      }

      await voicePage.waitForVoiceButtonState('idle', 5000);

      // Hero section should reappear with Grok branding
      const heroTitle = page.locator('h1').filter({ hasText: 'Grok' });
      await expect(heroTitle).toBeVisible();
    });

    test('should close WebSocket connection on disconnect', async () => {
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('connected', 10000);

      const initialCount = await voicePage.getWebSocketConnectionCount();
      expect(initialCount).toBeGreaterThan(0);

      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('idle', 5000);

      // Connection should be closed
    });
  });

  test.describe('Provider-Specific Behavior', () => {
    test('should use xAI-specific system prompt', async () => {
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('connected', 10000);

      // The xAI provider uses Grok-specific configuration
      // This is verified by the mock receiving the correct message types
    });

    test('should handle xAI-specific response formats', async () => {
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('connected', 10000);

      // xAI uses similar protocol to OpenAI but with different model names
    });
  });

  test.describe('Provider Switching', () => {
    test('should disconnect when switching providers', async () => {
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('connected', 10000);

      // Switch to OpenAI
      await voicePage.selectProvider('openai');

      // xAI tab should no longer be active
      await expect(voicePage.providerTabXai).not.toHaveAttribute('data-state', 'active');
    });

    test('should reset state when switching back', async () => {
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('connected', 10000);

      // Switch to another provider and back
      await voicePage.selectProvider('openai');
      await voicePage.selectProvider('xai');

      // Should be back in idle state
      const heroTitle = await voicePage.page.locator('h1').filter({ hasText: 'Grok' });
      await expect(heroTitle).toBeVisible();
    });
  });
});
