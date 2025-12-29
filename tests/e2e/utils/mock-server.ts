/**
 * Mock server utilities for E2E tests
 * Intercepts API requests to return mock ephemeral tokens
 */

import type { Page, Route } from '@playwright/test';

/**
 * Mock response data for ephemeral token endpoints
 */
export const mockResponses = {
  openai: {
    client_secret: {
      value: 'mock-openai-ephemeral-token-' + Date.now(),
      expires_at: Date.now() + 60000,
    },
  },
  xai: {
    client_secret: {
      value: 'mock-xai-ephemeral-token-' + Date.now(),
      expires_at: Date.now() + 60000,
    },
  },
  elevenlabs: {
    signed_url:
      'wss://api.elevenlabs.io/v1/convai/conversation?agent_id=mock-agent&signature=mock-sig',
  },
};

/**
 * Route patterns for API interception
 */
export const apiRoutes = {
  openai: '**/api/openai/session',
  xai: '**/api/xai/session',
  elevenlabs: '**/api/elevenlabs/signed-url',
};

/**
 * Set up mock API routes for a Playwright page
 * Intercepts requests to the backend and returns mock responses
 *
 * @param page - Playwright page instance
 * @param options - Configuration options
 */
export async function setupMockServer(
  page: Page,
  options: {
    latency?: number;
    failOpenAI?: boolean;
    failXAI?: boolean;
    failElevenLabs?: boolean;
  } = {}
): Promise<void> {
  const { latency = 100, failOpenAI, failXAI, failElevenLabs } = options;

  // Mock OpenAI session endpoint
  await page.route(apiRoutes.openai, async (route: Route) => {
    await simulateLatency(latency);

    if (failOpenAI) {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Mock server error' }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockResponses.openai),
    });
  });

  // Mock xAI session endpoint
  await page.route(apiRoutes.xai, async (route: Route) => {
    await simulateLatency(latency);

    if (failXAI) {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Mock server error' }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockResponses.xai),
    });
  });

  // Mock ElevenLabs signed URL endpoint
  await page.route(apiRoutes.elevenlabs, async (route: Route) => {
    await simulateLatency(latency);

    if (failElevenLabs) {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Mock server error' }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockResponses.elevenlabs),
    });
  });
}

/**
 * Helper to simulate network latency
 */
function simulateLatency(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Clear all mock routes from a page
 */
export async function clearMockServer(page: Page): Promise<void> {
  await page.unroute(apiRoutes.openai);
  await page.unroute(apiRoutes.xai);
  await page.unroute(apiRoutes.elevenlabs);
}
