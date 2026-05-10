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
    signedUrl:
      'wss://api.elevenlabs.io/v1/convai/conversation?agent_id=mock-agent&signature=mock-sig',
  },
  gemini: {
    token: 'mock-gemini-ephemeral-token-' + Date.now(),
  },
};

/**
 * Route patterns for API interception
 */
export const apiRoutes = {
  openai: '**/api/openai/session',
  xai: '**/api/xai/session',
  elevenlabs: '**/api/elevenlabs/signed-url',
  gemini: '**/api/gemini/session',
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
    failGemini?: boolean;
  } = {}
): Promise<void> {
  const { latency = 100, failOpenAI, failXAI, failElevenLabs, failGemini } = options;

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

  // Mock Gemini session endpoint
  await page.route(apiRoutes.gemini, async (route: Route) => {
    await simulateLatency(latency);

    if (failGemini) {
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
      body: JSON.stringify(mockResponses.gemini),
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
  await page.unroute(apiRoutes.gemini);
}

/**
 * Mock function call responses for testing tool execution
 */
export const mockFunctionCallResponses = {
  get_weather: {
    name: 'get_weather',
    arguments: { location: 'San Francisco', unit: 'fahrenheit' },
    result: {
      temperature: 68,
      unit: 'fahrenheit',
      conditions: 'Partly cloudy',
      humidity: 65,
      location: 'San Francisco, CA',
    },
  },
  get_time: {
    name: 'get_time',
    arguments: { timezone: 'America/Los_Angeles' },
    result: {
      time: '2:30 PM',
      timezone: 'America/Los_Angeles',
      date: 'December 30, 2025',
    },
  },
  calculate: {
    name: 'calculate',
    arguments: { expression: '25 * 4 + 10' },
    result: {
      expression: '25 * 4 + 10',
      result: 110,
    },
  },
};

/**
 * Set up mock server with function calling support
 */
export async function setupMockServerWithFunctionCalling(
  page: Page,
  options: {
    latency?: number;
    enableFunctionCalling?: boolean;
    functionCallDelay?: number;
  } = {}
): Promise<void> {
  const { latency = 100, enableFunctionCalling = true, functionCallDelay = 500 } = options;

  // Set up base mock routes
  await setupMockServer(page, { latency });

  if (enableFunctionCalling) {
    // Expose function call mock data to the page
    await page.evaluate(
      ({ responses, delay }) => {
        window.__E2E_FUNCTION_MOCKS__ = {
          responses,
          delay,
          triggerFunctionCall: (functionName: string) => {
            const mock = window.__E2E_WEBSOCKET_MOCK__;
            const fnData = responses[functionName as keyof typeof responses];
            if (mock && fnData) {
              const connections = mock.getConnections();
              if (connections.length > 0) {
                mock.simulateFunctionCall(0, fnData.name, fnData.arguments, fnData.result);
              }
            }
          },
        };
      },
      { responses: mockFunctionCallResponses, delay: functionCallDelay }
    );
  }
}

/**
 * Type definitions for function mock utilities
 */
export interface E2EFunctionMocks {
  responses: typeof mockFunctionCallResponses;
  delay: number;
  triggerFunctionCall: (functionName: string) => void;
}

declare global {
  interface Window {
    __E2E_FUNCTION_MOCKS__?: E2EFunctionMocks;
  }
}
