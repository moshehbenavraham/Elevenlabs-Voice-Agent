// @vitest-environment node

import { createRequire } from 'node:module';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import process from 'node:process';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

interface ExpressApp {
  (req: IncomingMessage, res: ServerResponse): void;
  use: (...args: readonly unknown[]) => ExpressApp;
}

type ExpressFactory = (() => ExpressApp) & {
  json: () => unknown;
};

interface OpenAIRouteModule {
  readonly default: unknown;
  readonly OPENAI_TRANSLATION_CLIENT_SECRET_URL: string;
  readonly OPENAI_TRANSLATION_MODEL: string;
  readonly buildTranslationClientSecretRequestBody: (
    targetLanguage: string
  ) => Record<string, unknown>;
}

interface RouteTestServer {
  readonly translationSessionUrl: string;
  readonly close: () => Promise<void>;
}

interface RouteResponse {
  readonly status: number;
  readonly body: Record<string, unknown>;
}

type OpenAIFetch = typeof fetch;

const require = createRequire(import.meta.url);
const express = require('express') as ExpressFactory;
const modulePath = '../../server/routes/openai.js';
const openaiModule = (await import(modulePath)) as OpenAIRouteModule;
const openaiRouter = openaiModule.default;
const { OPENAI_TRANSLATION_CLIENT_SECRET_URL, OPENAI_TRANSLATION_MODEL } = openaiModule;
const buildTranslationClientSecretRequestBody =
  openaiModule.buildTranslationClientSecretRequestBody;
const nativeFetch = globalThis.fetch.bind(globalThis);
const TEST_OPENAI_API_KEY = 'sk-test-translation-route-key';
const TEST_CLIENT_SECRET = 'translation-client-secret';
const EXPECTED_LANGUAGE_ERROR =
  'targetLanguage: must be one of es, pt, fr, ja, ru, zh, de, ko, hi, id, vi, it, en';

let originalOpenAIApiKey: string | undefined;
let routeServer: RouteTestServer | undefined;

beforeEach(async () => {
  originalOpenAIApiKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = TEST_OPENAI_API_KEY;
  routeServer = await startRouteTestServer();
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(async () => {
  if (routeServer) {
    await routeServer.close();
    routeServer = undefined;
  }

  if (originalOpenAIApiKey === undefined) {
    delete process.env.OPENAI_API_KEY;
  } else {
    process.env.OPENAI_API_KEY = originalOpenAIApiKey;
  }

  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('POST /api/openai/translation-session', () => {
  it.each([
    ['missing targetLanguage', {}, 'targetLanguage: is required'],
    ['non-string targetLanguage', { targetLanguage: 42 }, 'targetLanguage: must be a string'],
    ['empty targetLanguage', { targetLanguage: '   ' }, 'targetLanguage: is required'],
    [
      'malformed targetLanguage',
      { targetLanguage: 'english' },
      'targetLanguage: contains unsupported characters',
    ],
    ['unsupported targetLanguage', { targetLanguage: 'ar' }, EXPECTED_LANGUAGE_ERROR],
    [
      'extra request field',
      { targetLanguage: 'es', sourceLanguage: 'en' },
      'body: unsupported field "sourceLanguage"',
    ],
    ['non-object body', [], 'body: must be an object'],
  ])('rejects %s before making an upstream request', async (_name, body, message) => {
    const fetchMock = stubOpenAIFetch();

    const result = await postTranslationSession(body);

    expect(result.status).toBe(400);
    expect(result.body).toEqual({
      error: 'Validation error',
      message,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns a stable missing-key error without making an upstream request', async () => {
    delete process.env.OPENAI_API_KEY;
    const fetchMock = stubOpenAIFetch();

    const result = await postTranslationSession({ targetLanguage: 'es' });

    expect(result.status).toBe(500);
    expect(result.body).toEqual({
      error: 'Server configuration error',
      message: 'OpenAI API key not configured',
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(JSON.stringify(result.body)).not.toContain('sk-');
  });

  it('returns a sanitized client secret from the top-level OpenAI value shape', async () => {
    stubOpenAIFetch(async () =>
      jsonResponse({
        value: TEST_CLIENT_SECRET,
        expires_at: 1893456000,
        session: {
          model: OPENAI_TRANSLATION_MODEL,
        },
        authorization: `Bearer ${TEST_OPENAI_API_KEY}`,
        raw_debug: 'raw-upstream-field',
      })
    );

    const result = await postTranslationSession({ targetLanguage: ' ES ' });

    expect(result.status).toBe(200);
    expect(result.body).toEqual({
      clientSecret: TEST_CLIENT_SECRET,
      expiresAt: '2030-01-01T00:00:00.000Z',
      targetLanguage: 'es',
      model: OPENAI_TRANSLATION_MODEL,
    });
    expect(Object.keys(result.body).sort()).toEqual([
      'clientSecret',
      'expiresAt',
      'model',
      'targetLanguage',
    ]);
    expect(JSON.stringify(result.body)).not.toContain(TEST_OPENAI_API_KEY);
    expect(JSON.stringify(result.body)).not.toContain('raw-upstream-field');
  });

  it('returns a sanitized client secret from the nested OpenAI client_secret shape', async () => {
    stubOpenAIFetch(async () =>
      jsonResponse({
        client_secret: {
          value: 'nested-translation-client-secret',
          expires_at: '1893456060',
        },
        session: {
          model: OPENAI_TRANSLATION_MODEL,
        },
        upstream_only: {
          api_key: TEST_OPENAI_API_KEY,
        },
      })
    );

    const result = await postTranslationSession({ targetLanguage: 'pt' });

    expect(result.status).toBe(200);
    expect(result.body).toEqual({
      clientSecret: 'nested-translation-client-secret',
      expiresAt: '2030-01-01T00:01:00.000Z',
      targetLanguage: 'pt',
      model: OPENAI_TRANSLATION_MODEL,
    });
    expect(JSON.stringify(result.body)).not.toContain(TEST_OPENAI_API_KEY);
    expect(JSON.stringify(result.body)).not.toContain('upstream_only');
  });

  it('sends the OpenAI API key only in the upstream authorization header', async () => {
    const fetchMock = stubOpenAIFetch(async () =>
      jsonResponse({
        value: TEST_CLIENT_SECRET,
        expires_at: 1893456000,
      })
    );

    const result = await postTranslationSession({ targetLanguage: 'ja' });

    expect(result.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as Parameters<OpenAIFetch>;
    const payload = parseJsonObject(init?.body);

    expect(url).toBe(OPENAI_TRANSLATION_CLIENT_SECRET_URL);
    expect(init?.headers).toEqual({
      Authorization: `Bearer ${TEST_OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    });
    expect(payload).toEqual(buildTranslationClientSecretRequestBody('ja'));
    expect(JSON.stringify(payload)).not.toContain('instructions');
    expect(JSON.stringify(payload)).not.toContain('tools');
    expect(JSON.stringify(payload)).not.toContain('voice');
    expect(JSON.stringify(payload)).not.toContain('response.create');
    expect(JSON.stringify(payload)).not.toContain(TEST_OPENAI_API_KEY);
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it.each([
    [
      'missing client secret',
      jsonResponse({ expires_at: 1893456000 }),
      'Translation client secret not found in response',
    ],
    [
      'non-JSON success body',
      new Response('not-json', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      }),
      'OpenAI translation response was not valid JSON',
    ],
  ])('maps %s to a stable invalid OpenAI response error', async (_name, upstream, message) => {
    stubOpenAIFetch(async () => upstream);

    const result = await postTranslationSession({ targetLanguage: 'de' });

    expect(result.status).toBe(502);
    expect(result.body).toEqual({
      error: 'Invalid OpenAI response',
      message,
    });
  });

  it.each([
    [401, 'Invalid OpenAI API key'],
    [403, 'Invalid OpenAI API key'],
    [429, 'OpenAI rate limit exceeded'],
    [503, 'OpenAI service temporarily unavailable'],
  ])('maps OpenAI status %s without leaking the upstream body', async (status, message) => {
    stubOpenAIFetch(
      async () =>
        new Response(`raw upstream error ${TEST_OPENAI_API_KEY}`, {
          status,
          headers: { 'Content-Type': 'text/plain' },
        })
    );

    const result = await postTranslationSession({ targetLanguage: 'fr' });

    expect(result.status).toBe(status);
    expect(result.body).toEqual({
      error: 'OpenAI API error',
      message,
    });
    expect(JSON.stringify(result.body)).not.toContain(TEST_OPENAI_API_KEY);
    expect(JSON.stringify(result.body)).not.toContain('raw upstream error');
  });

  it('maps upstream aborts to a deterministic timeout error', async () => {
    stubOpenAIFetch(async () => {
      throw createAbortError();
    });

    const result = await postTranslationSession({ targetLanguage: 'ko' });

    expect(result.status).toBe(504);
    expect(result.body).toEqual({
      error: 'Request timeout',
      message: 'OpenAI translation API request timed out',
    });
  });

  it('maps thrown fetch failures to a stable structured error', async () => {
    stubOpenAIFetch(async () => {
      throw new Error(`socket failure ${TEST_OPENAI_API_KEY}`);
    });

    const result = await postTranslationSession({ targetLanguage: 'hi' });

    expect(result.status).toBe(500);
    expect(result.body).toEqual({
      error: 'Internal server error',
      message: 'Failed to create OpenAI translation session',
    });
    expect(JSON.stringify(result.body)).not.toContain(TEST_OPENAI_API_KEY);
    expect(JSON.stringify(result.body)).not.toContain('socket failure');
  });
});

async function startRouteTestServer(): Promise<RouteTestServer> {
  const app = express();
  app.use(express.json());
  app.use('/api/openai', openaiRouter);

  const server = createServer(app);
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject);
      resolve();
    });
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    await closeServer(server);
    throw new Error('Failed to allocate route test server port');
  }

  return {
    translationSessionUrl: `http://127.0.0.1:${address.port}/api/openai/translation-session`,
    close: () => closeServer(server),
  };
}

async function closeServer(server: Server): Promise<void> {
  if (!server.listening) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

function stubOpenAIFetch(implementation?: OpenAIFetch): ReturnType<typeof vi.fn<OpenAIFetch>> {
  const fetchMock = vi.fn<OpenAIFetch>(implementation);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

async function postTranslationSession(body: unknown): Promise<RouteResponse> {
  if (!routeServer) {
    throw new Error('Route test server was not started');
  }

  const response = await nativeFetch(routeServer.translationSessionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return {
    status: response.status,
    body: (await response.json()) as Record<string, unknown>,
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function parseJsonObject(value: BodyInit | null | undefined): Record<string, unknown> {
  if (typeof value !== 'string') {
    throw new Error('Expected JSON request body string');
  }

  return JSON.parse(value) as Record<string, unknown>;
}

function createAbortError(): Error {
  const error = new Error('The operation was aborted');
  error.name = 'AbortError';
  return error;
}
