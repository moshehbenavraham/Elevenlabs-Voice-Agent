import { test, expect } from '@playwright/test';
import { mockLiveKit } from '../utils/livekit-mock';

test.beforeEach(async ({ page }) => {
  await mockLiveKit(page);
});

test('dedicated demo starts, mutes, ends, preserves transcript, and retries', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  let tokens = 0;
  page.on('request', (request) => {
    if (request.url().endsWith('/api/livekit/session')) tokens++;
  });
  await page.goto('/livekit');
  await expect(page.getByRole('heading', { name: 'A conversation, in real time.' })).toBeVisible();
  expect(tokens).toBe(0);
  await page.getByRole('button', { name: 'Start conversation', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Listening to you');
  await expect(page.locator('.lk-messages')).toContainText(
    'Hello. What would you like to explore?'
  );
  await page.getByRole('button', { name: 'Mute', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Unmute', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  await page.getByRole('button', { name: 'End conversation', exact: true }).click();
  await expect(page.getByText('Your microphone is off')).toBeVisible();
  await expect(page.locator('.lk-messages')).toContainText('Hello.');
  await page.getByRole('button', { name: 'Clear transcript' }).click();
  await expect(page.getByText('Your conversation starts here')).toBeVisible();
  await page.getByRole('button', { name: 'Start again', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Listening to you');
  expect(tokens).toBe(2);
  expect(errors).toEqual([]);
});

test('token failures are actionable and retryable', async ({ page }) => {
  await page.route('**/api/livekit/session', (route) => route.fulfill({ status: 429, json: {} }));
  await page.goto('/livekit');
  await page.getByRole('button', { name: 'Start conversation', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Wait a minute');
  await expect(page.getByRole('button', { name: 'Start again', exact: true })).toBeEnabled();
  await expect(page.getByText('Your microphone is off')).toBeVisible();
});

test('help is keyboard accessible and the page has no horizontal overflow', async ({ page }) => {
  await page.goto('/livekit');
  await page.getByRole('button', { name: 'Help', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Help', exact: true })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true
  );
});

test('missing setup never asks for microphone access', async ({ page }) => {
  await page.route('**/api/livekit/config', (route) =>
    route.fulfill({
      json: { enabled: false, configured: false, agentOnline: null, maxSessionSeconds: 600 },
    })
  );
  await page.goto('/livekit');
  await expect(
    page.getByRole('button', { name: 'Start conversation', exact: true })
  ).toBeDisabled();
  await expect(page.getByRole('alert')).toContainText('not available');
});
