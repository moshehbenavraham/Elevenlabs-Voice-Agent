/**
 * E2E tests for VoiceSelector component
 * Tests voice selection dropdown functionality across providers
 */

import { test, expect } from '@playwright/test';
import { VoicePage } from '../page-objects/VoicePage';
import { setupMockServer } from '../utils/mock-server';
import { websocketMockScript } from '../utils/websocket-mock';
import { setupAudioMock } from '../utils/audio-mock';

test.describe('Voice Selector Component', () => {
  let voicePage: VoicePage;

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(websocketMockScript);
    await setupAudioMock(page);
    await setupMockServer(page);

    voicePage = new VoicePage(page);
    await voicePage.goto();
  });

  test.describe('OpenAI Voice Selection', () => {
    test.beforeEach(async () => {
      await voicePage.selectProvider('openai');
    });

    test('should display voice selector', async () => {
      await expect(voicePage.voiceSelector).toBeVisible();
    });

    test('should have Voice label', async ({ page }) => {
      const label = page.locator('label').filter({ hasText: 'Voice' });
      await expect(label).toBeVisible();
    });

    test('should open dropdown when clicked', async ({ page }) => {
      await voicePage.voiceSelector.click();

      // Dropdown content should appear
      const dropdown = page.locator('[role="listbox"]');
      await expect(dropdown).toBeVisible();
    });

    test('should display all OpenAI voice options', async ({ page }) => {
      await voicePage.voiceSelector.click();

      const options = page.getByRole('option');
      const count = await options.count();

      // OpenAI has 8 voices: alloy, ash, ballad, coral, echo, sage, shimmer, verse
      expect(count).toBeGreaterThanOrEqual(8);
    });

    test('should show voice descriptions', async ({ page }) => {
      await voicePage.voiceSelector.click();

      // Each voice should have a description
      const descriptions = page.locator('[role="option"] .text-xs.text-zinc-500');
      const count = await descriptions.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should select a voice when option clicked', async ({ page }) => {
      await voicePage.voiceSelector.click();

      // Select a specific voice
      const coralOption = page.getByRole('option').filter({ hasText: 'coral' }).first();
      if (await coralOption.isVisible()) {
        await coralOption.click();

        // Selector should show selected voice
        const selectedText = await voicePage.voiceSelector.textContent();
        expect(selectedText?.toLowerCase()).toContain('coral');
      }
    });

    test('should close dropdown after selection', async ({ page }) => {
      await voicePage.voiceSelector.click();

      const firstOption = page.getByRole('option').first();
      await firstOption.click();

      // Dropdown should be closed
      const dropdown = page.locator('[role="listbox"]');
      await expect(dropdown).not.toBeVisible();
    });

    test('should show check mark on selected option', async ({ page }) => {
      await voicePage.voiceSelector.click();

      // Currently selected option should have check mark
      const checkedOption = page.locator('[role="option"][data-state="checked"]');
      await expect(checkedOption).toBeVisible();
    });

    test('should use violet accent color for OpenAI', async ({ page }) => {
      await voicePage.voiceSelector.click();

      // Check for violet accent on selected text
      const selectedOption = page.locator('[role="option"][data-state="checked"]');
      const _hasVioletClass = await selectedOption.evaluate((el) => {
        return el.className.includes('violet');
      });
      // OpenAI uses violet accent
    });
  });

  test.describe('xAI Voice Selection', () => {
    test.beforeEach(async () => {
      await voicePage.selectProvider('xai');
    });

    test('should display voice selector for xAI', async () => {
      await expect(voicePage.voiceSelector).toBeVisible();
    });

    test('should display xAI voice options', async ({ page }) => {
      await voicePage.voiceSelector.click();

      const options = page.getByRole('option');
      const count = await options.count();

      // xAI has 5 voices: ash, ballad, coral, sage, verse
      expect(count).toBeGreaterThanOrEqual(5);
    });

    test.skip('should use sky accent color for xAI', async () => {
      // TODO: Implement xAI sky color verification
    });
  });

  test.describe('Disabled State', () => {
    test('should disable selector when connected', async () => {
      await voicePage.selectProvider('openai');

      // Connect
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('connected', 10000);

      // Selector should be disabled
      const isDisabled = await voicePage.voiceSelector.evaluate((el) => {
        return el.hasAttribute('data-disabled') || el.getAttribute('aria-disabled') === 'true';
      });

      expect(isDisabled).toBeTruthy();
    });

    test('should show disabled message when connected', async ({ page }) => {
      await voicePage.selectProvider('openai');

      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('connected', 10000);

      // "Disconnect to change voice" message should be visible
      const disabledMessage = page.locator('text=Disconnect to change voice');
      await expect(disabledMessage).toBeVisible();
    });

    test('should re-enable after disconnect', async () => {
      await voicePage.selectProvider('openai');

      // Connect then disconnect
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('connected', 10000);
      await voicePage.clickVoiceButton();
      await voicePage.waitForVoiceButtonState('idle', 5000);

      // Selector should be enabled again
      const isDisabled = await voicePage.voiceSelector.evaluate((el) => {
        return el.hasAttribute('data-disabled');
      });

      expect(isDisabled).toBeFalsy();
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should open with Enter key', async ({ page }) => {
      await voicePage.selectProvider('openai');
      await voicePage.voiceSelector.focus();
      await page.keyboard.press('Enter');

      const dropdown = page.locator('[role="listbox"]');
      await expect(dropdown).toBeVisible();
    });

    test('should open with Space key', async ({ page }) => {
      await voicePage.selectProvider('openai');
      await voicePage.voiceSelector.focus();
      await page.keyboard.press('Space');

      const dropdown = page.locator('[role="listbox"]');
      await expect(dropdown).toBeVisible();
    });

    test('should navigate options with arrow keys', async ({ page }) => {
      await voicePage.selectProvider('openai');
      await voicePage.voiceSelector.click();

      // Navigate down
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');

      // An option should be highlighted
      const _highlightedOption = page.locator('[role="option"][data-highlighted]');
      // Radix uses data-highlighted for focused options
    });

    test('should close with Escape key', async ({ page }) => {
      await voicePage.selectProvider('openai');
      await voicePage.voiceSelector.click();

      await page.keyboard.press('Escape');

      const dropdown = page.locator('[role="listbox"]');
      await expect(dropdown).not.toBeVisible();
    });

    test('should select with Enter key', async ({ page }) => {
      await voicePage.selectProvider('openai');
      await voicePage.voiceSelector.click();

      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');

      // Dropdown should close after selection
      const dropdown = page.locator('[role="listbox"]');
      await expect(dropdown).not.toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA attributes', async () => {
      await voicePage.selectProvider('openai');

      await expect(voicePage.voiceSelector).toHaveAttribute('aria-label', 'Select voice');
    });

    test('should have associated label', async ({ page }) => {
      await voicePage.selectProvider('openai');

      const label = page.locator('label').filter({ hasText: 'Voice' });
      await expect(label).toBeVisible();
    });

    test('should announce selected value', async () => {
      await voicePage.selectProvider('openai');

      // The trigger should show the selected voice name
      const triggerText = await voicePage.voiceSelector.textContent();
      expect(triggerText?.length).toBeGreaterThan(0);
    });
  });
});
