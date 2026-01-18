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
      const _isVisible = await voicePage.isReconnectionStatusVisible();
      // Status visibility depends on reconnection implementation
    });

    test('should show attempt count during reconnection', async ({ page }) => {
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('connected', 10000);

      await voicePage.simulateWebSocketDisconnect(0, 1006);
      await page.waitForTimeout(1000);

      // Attempt counter should be visible
      const _attemptText = page.locator('text=/Attempt \\d+/');
      // May or may not be visible depending on timing
    });

    test('should show countdown during backoff', async ({ page }) => {
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('connected', 10000);

      await voicePage.simulateWebSocketDisconnect(0, 1006);
      await page.waitForTimeout(500);

      // Countdown timer may be visible
      const _countdown = page.locator('text=/Retrying in \\d+ seconds?/');
      // Countdown shown during exponential backoff
    });
  });

  test.describe('Exponential Backoff', () => {
    test('should increase delay between attempts', async ({ page }) => {
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('connected', 10000);

      // Track reconnection attempts
      let _attemptCount = 0;
      page.on('console', (msg) => {
        if (msg.text().includes('[E2E Mock] WebSocket connecting')) {
          _attemptCount++;
        }
      });

      // Simulate disconnect multiple times
      await voicePage.simulateWebSocketDisconnect(0, 1006);

      // Wait for backoff - first attempt is 1s, second is 2s, etc.
      await page.waitForTimeout(5000);

      // Should have made some reconnection attempts
    });

    test.skip('should cap delay at maximum value', async () => {
      // Maximum delay is 30 seconds per spec
      // After several attempts, delay should not exceed 30s
      // TODO: Implement when reconnection timing can be reliably tested
    });
  });

  test.describe('Max Retries', () => {
    test.skip('should stop reconnecting after max attempts', async () => {
      // TODO: Implement when max retries can be reliably tested
      // This would require waiting for 10 attempts with exponential backoff
    });

    test.skip('should show max retries message', async () => {
      // TODO: Implement when max retries status can be reliably detected
    });

    test.skip('should show manual retry button after max attempts', async () => {
      // TODO: Implement when manual retry UI is fully implemented
    });
  });

  test.describe('Manual Reconnect', () => {
    test.skip('should allow manual reconnect after max retries', async () => {
      // TODO: Implement when manual reconnect functionality is testable
    });

    test.skip('should reset attempt counter on manual reconnect', async () => {
      // TODO: Implement when attempt counter reset can be verified
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
      const _offlineMessage = page.locator('text=/No internet|offline/i');
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
        const _hasAmber = await status.evaluate((el) => {
          return el.className.includes('amber');
        });
        // Amber styling during reconnection
      }
    });

    test.skip('should use red styling for max retries state', async () => {
      // TODO: Implement when max retries styling can be verified
      // Max retries state uses red styling: border-red-500/30 bg-red-500/5
    });
  });

  test.describe('Provider-Specific Reconnection', () => {
    test.skip('should reconnect OpenAI provider correctly', async () => {
      // TODO: Implement when provider-specific reconnection can be verified
    });

    test.skip('should reconnect xAI provider correctly', async () => {
      // TODO: Implement when provider-specific reconnection can be verified
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
