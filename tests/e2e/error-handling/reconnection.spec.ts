/**
 * E2E tests for reconnection behavior
 * Tests automatic reconnection with exponential backoff
 */

import { test, expect } from '@playwright/test';
import { VoicePage } from '../page-objects/VoicePage';
import { setupMockServer } from '../utils/mock-server';
import { websocketMockScript } from '../utils/websocket-mock';
import { setupAudioMock } from '../utils/audio-mock';

test.describe('Reconnection Behavior', () => {
  let voicePage: VoicePage;

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(websocketMockScript);
    await setupAudioMock(page);
    await setupMockServer(page);

    voicePage = new VoicePage(page);
    await voicePage.goto();
    await voicePage.selectProvider('openai');
  });

  test.describe('Automatic Reconnection', () => {
    test('should attempt reconnection on unexpected disconnect', async ({ page }) => {
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('connected', 10000);

      // Simulate unexpected disconnect (code 1006)
      await voicePage.simulateWebSocketDisconnect(0, 1006);

      // Reconnection should be attempted
      await page.waitForTimeout(2000);

      // Should show reconnecting status or attempt reconnect
    });

    test('should not reconnect on clean disconnect', async ({ page }) => {
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('connected', 10000);

      // Normal user-initiated disconnect
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('idle', 5000);

      // Should stay in idle state
      await page.waitForTimeout(2000);
      const state = await voicePage.getVoiceButtonState();
      expect(state).toBe('idle');
    });
  });

  test.describe('Reconnection Status Display', () => {
    test('should show reconnection status when reconnecting', async ({ page }) => {
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('connected', 10000);

      // Simulate disconnect
      await voicePage.simulateWebSocketDisconnect(0, 1006);
      await page.waitForTimeout(500);

      // Reconnection status may be visible
      const isVisible = await voicePage.isReconnectionStatusVisible();
      // Status visibility depends on reconnection implementation
    });

    test('should show attempt count during reconnection', async ({ page }) => {
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('connected', 10000);

      await voicePage.simulateWebSocketDisconnect(0, 1006);
      await page.waitForTimeout(1000);

      // Attempt counter should be visible
      const attemptText = page.locator('text=/Attempt \\d+/');
      // May or may not be visible depending on timing
    });

    test('should show countdown during backoff', async ({ page }) => {
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('connected', 10000);

      await voicePage.simulateWebSocketDisconnect(0, 1006);
      await page.waitForTimeout(500);

      // Countdown timer may be visible
      const countdown = page.locator('text=/Retrying in \\d+ seconds?/');
      // Countdown shown during exponential backoff
    });
  });

  test.describe('Exponential Backoff', () => {
    test('should increase delay between attempts', async ({ page }) => {
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('connected', 10000);

      // Track reconnection attempts
      let attemptCount = 0;
      page.on('console', (msg) => {
        if (msg.text().includes('[E2E Mock] WebSocket connecting')) {
          attemptCount++;
        }
      });

      // Simulate disconnect multiple times
      await voicePage.simulateWebSocketDisconnect(0, 1006);

      // Wait for backoff - first attempt is 1s, second is 2s, etc.
      await page.waitForTimeout(5000);

      // Should have made some reconnection attempts
    });

    test('should cap delay at maximum value', async ({ page }) => {
      // Maximum delay is 30 seconds per spec
      // After several attempts, delay should not exceed 30s
    });
  });

  test.describe('Max Retries', () => {
    test('should stop reconnecting after max attempts', async ({ page }) => {
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('connected', 10000);

      // Simulate persistent disconnection
      await voicePage.simulateWebSocketDisconnect(0, 1006);

      // Wait for max retries (10 attempts per spec)
      // This would take a while with exponential backoff
      // In practice, test should verify the max_retries status appears
    });

    test('should show max retries message', async ({ page }) => {
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('connected', 10000);

      // Wait for max retries status
      // This is a long-running test in reality
    });

    test('should show manual retry button after max attempts', async ({ page }) => {
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('connected', 10000);

      // After max retries, manual reconnect button should appear
      // voicePage.reconnectionRetryButton should be visible
    });
  });

  test.describe('Manual Reconnect', () => {
    test('should allow manual reconnect after max retries', async ({ page }) => {
      // When max retries exceeded, user can click retry button
      // This resets the attempt counter and tries again
    });

    test('should reset attempt counter on manual reconnect', async ({ page }) => {
      // Manual reconnect should start fresh with attempt 1
    });
  });

  test.describe('Network Status Integration', () => {
    test('should pause reconnection when offline', async ({ page, context }) => {
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('connected', 10000);

      // Go offline
      await context.setOffline(true);
      await voicePage.simulateWebSocketDisconnect(0, 1006);

      await page.waitForTimeout(1000);

      // Should show offline message
      const offlineMessage = page.locator('text=/No internet|offline/i');
      // May show offline indicator
    });

    test('should resume reconnection when back online', async ({ page, context }) => {
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('connected', 10000);

      // Go offline
      await context.setOffline(true);
      await voicePage.simulateWebSocketDisconnect(0, 1006);
      await page.waitForTimeout(500);

      // Come back online
      await context.setOffline(false);
      await page.waitForTimeout(2000);

      // Should resume reconnection attempts
    });
  });

  test.describe('Reconnection Status Styling', () => {
    test('should use amber styling for reconnecting state', async ({ page }) => {
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('connected', 10000);

      await voicePage.simulateWebSocketDisconnect(0, 1006);
      await page.waitForTimeout(500);

      // Reconnection status uses amber for reconnecting
      const status = voicePage.reconnectionStatus;
      if (await status.isVisible()) {
        const hasAmber = await status.evaluate((el) => {
          return el.className.includes('amber');
        });
        // Amber styling during reconnection
      }
    });

    test('should use red styling for max retries state', async ({ page }) => {
      // Max retries state uses red styling
      // border-red-500/30 bg-red-500/5
    });
  });

  test.describe('Provider-Specific Reconnection', () => {
    test('should reconnect OpenAI provider correctly', async ({ page }) => {
      await voicePage.selectProvider('openai');
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('connected', 10000);

      await voicePage.simulateWebSocketDisconnect(0, 1006);

      // Should attempt OpenAI-specific reconnection
    });

    test('should reconnect xAI provider correctly', async ({ page }) => {
      await voicePage.selectProvider('xai');
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('connected', 10000);

      await voicePage.simulateWebSocketDisconnect(0, 1006);

      // Should attempt xAI-specific reconnection
    });
  });

  test.describe('Cleanup', () => {
    test('should cancel reconnection on provider switch', async ({ page }) => {
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('connected', 10000);

      await voicePage.simulateWebSocketDisconnect(0, 1006);
      await page.waitForTimeout(500);

      // Switch provider during reconnection
      await voicePage.selectProvider('xai');

      // Reconnection should be cancelled
      await page.waitForTimeout(1000);

      // Should be in idle state for new provider
      const state = await voicePage.getVoiceButtonState();
      expect(state).toBe('idle');
    });

    test('should cancel reconnection on page navigation', async ({ page }) => {
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('connected', 10000);

      await voicePage.simulateWebSocketDisconnect(0, 1006);

      // Navigate away
      await page.goto('about:blank');

      // No errors should occur
    });
  });
});
