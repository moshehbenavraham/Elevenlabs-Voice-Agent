// @vitest-environment node

import { createRequire } from 'node:module';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import process from 'node:process';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectNoOpenAITranslationSecretLeak } from './openaiTranslationTestUtils';

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

interface ServerLogger {
  info: (...args: readonly unknown[]) => void;
  warn: (...args: readonly unknown[]) => void;
  error: (...args: readonly unknown[]) => void;
}

interface ObservabilityModule {
  readonly serverLogger: ServerLogger;
}

interface RouteTestServer {
  readonly translationSessionUrl: string;
  readonly close: () => Promise<void>;
}

interface RouteResponse {
  readonly status: number;
  readonly body: Record<string, unknown>;
}

interface TranslationLifecycleLogCall {
  readonly level: 'info' | 'warn' | 'error';
  readonly record: Record<string, unknown>;
  readonly message: string;
}

type OpenAIFetch = typeof fetch;

const require = createRequire(import.meta.url);
const express = require('express') as ExpressFactory;
const modulePath = '../../server/routes/openai.js';
const observabilityModulePath = '../../server/utils/observability.js';
const openaiModule = (await import(modulePath)) as OpenAIRouteModule;
const observabilityModule = (await import(observabilityModulePath)) as ObservabilityModule;
const openaiRouter = openaiModule.default;
const { OPENAI_TRANSLATION_CLIENT_SECRET_URL, OPENAI_TRANSLATION_MODEL } = openaiModule;
const { serverLogger } = observabilityModule;
const buildTranslationClientSecretRequestBody =
  openaiModule.buildTranslationClientSecretRequestBody;
const nativeFetch = globalThis.fetch.bind(globalThis);
const TEST_OPENAI_API_KEY = 'sk-test-translation-route-key';
const TEST_CLIENT_SECRET = 'translation-client-secret';
const TEST_REQUEST_ID = 'route-test-request-1234';
const TRANSLATION_LIFECYCLE_EVENT = 'openai.translation.lifecycle';
const EXPECTED_LANGUAGE_ERROR =
  'targetLanguage: must be one of es, pt, fr, ja, ru, zh, de, ko, hi, id, vi, it, en';
const ROUTE_SANITIZED_SUCCESS_FIXTURES = [
  {
    name: 'top-level value',
    upstream: {
      value: TEST_CLIENT_SECRET,
      expires_at: 1893456000,
      session: { model: OPENAI_TRANSLATION_MODEL },
      authorization: `Bearer ${TEST_OPENAI_API_KEY}`,
      raw_debug: 'raw-upstream-field',
    },
    expected: {
      clientSecret: TEST_CLIENT_SECRET,
      expiresAt: '2030-01-01T00:00:00.000Z',
      targetLanguage: 'es',
      model: OPENAI_TRANSLATION_MODEL,
    },
  },
  {
    name: 'nested client_secret value',
    upstream: {
      client_secret: {
        value: 'nested-translation-client-secret',
        expires_at: '1893456060',
      },
      session: { model: OPENAI_TRANSLATION_MODEL },
      upstream_only: {
        api_key: TEST_OPENAI_API_KEY,
      },
    },
    expected: {
      clientSecret: 'nested-translation-client-secret',
      expiresAt: '2030-01-01T00:01:00.000Z',
      targetLanguage: 'pt',
      model: OPENAI_TRANSLATION_MODEL,
    },
  },
] as const;
const ROUTE_UPSTREAM_FAILURE_FIXTURES = [
  {
    status: 401,
    message: 'Invalid OpenAI API key',
    category: 'openai-auth',
    code: 'openai-auth-failed',
  },
  {
    status: 403,
    message: 'Invalid OpenAI API key',
    category: 'openai-auth',
    code: 'openai-auth-failed',
  },
  {
    status: 429,
    message: 'OpenAI rate limit exceeded',
    category: 'openai-rate-limit',
    code: 'openai-rate-limited',
  },
  {
    status: 503,
    message: 'OpenAI service temporarily unavailable',
    category: 'openai-service',
    code: 'openai-service-error',
  },
] as const;
const ROUTE_MALFORMED_SUCCESS_FIXTURES = [
  {
    name: 'missing client secret',
    buildResponse: () => jsonResponse({ expires_at: 1893456000 }),
    message: 'Translation client secret not found in response',
    code: 'missing-client-secret',
  },
  {
    name: 'non-JSON success body',
    buildResponse: () =>
      new Response('not-json', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      }),
    message: 'OpenAI translation response was not valid JSON',
    code: 'invalid-openai-response-json',
  },
] as const;

let originalOpenAIApiKey: string | undefined;
let routeServer: RouteTestServer | undefined;
let lifecycleLogCalls: TranslationLifecycleLogCall[] = [];

beforeEach(async () => {
  originalOpenAIApiKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = TEST_OPENAI_API_KEY;
  routeServer = await startRouteTestServer();
  lifecycleLogCalls = [];
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  vi.spyOn(serverLogger, 'info').mockImplementation((...args: readonly unknown[]) => {
    captureLifecycleLog('info', args);
  });
  vi.spyOn(serverLogger, 'warn').mockImplementation((...args: readonly unknown[]) => {
    captureLifecycleLog('warn', args);
  });
  vi.spyOn(serverLogger, 'error').mockImplementation((...args: readonly unknown[]) => {
    captureLifecycleLog('error', args);
  });
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
  it('keeps route fixture matrices explicit and response-safe', () => {
    expect(ROUTE_SANITIZED_SUCCESS_FIXTURES).toHaveLength(2);
    expect(ROUTE_UPSTREAM_FAILURE_FIXTURES.map((fixture) => fixture.status)).toEqual([
      401, 403, 429, 503,
    ]);
    expect(ROUTE_MALFORMED_SUCCESS_FIXTURES.map((fixture) => fixture.code)).toEqual([
      'missing-client-secret',
      'invalid-openai-response-json',
    ]);

    for (const fixture of ROUTE_SANITIZED_SUCCESS_FIXTURES) {
      expect(Object.keys(fixture.expected).sort()).toEqual([
        'clientSecret',
        'expiresAt',
        'model',
        'targetLanguage',
      ]);
      expectNoOpenAITranslationSecretLeak(fixture.expected);
    }

    for (const fixture of ROUTE_UPSTREAM_FAILURE_FIXTURES) {
      expectNoOpenAITranslationSecretLeak(fixture);
    }
  });

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
    expect(result.body).toMatchObject({
      error: 'Validation error',
      message,
      category: 'validation',
    });
    expect(result.body.code).toEqual(expect.any(String));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('logs sanitized validation failure lifecycle events', async () => {
    const fetchMock = stubOpenAIFetch();

    const result = await postTranslationSession({
      targetLanguage: 'es',
      sourceLanguage: `Bearer ${TEST_OPENAI_API_KEY}`,
    });

    expect(result.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(getTranslationLifecycleLogRecords()).toEqual([
      {
        level: 'warn',
        record: expect.objectContaining({
          event: TRANSLATION_LIFECYCLE_EVENT,
          phase: 'validation-failed',
          result: 'failure',
          route: '/api/openai/translation-session',
          requestId: TEST_REQUEST_ID,
          targetLanguage: 'es',
          statusCategory: 'validation',
          statusCode: 400,
          errorCode: 'unsupported-request-field',
          durationConfig: {
            maxMinutes: 30,
            maxSeconds: 1800,
            defaultMinutes: 30,
            hardMaxMinutes: 120,
            source: 'default',
          },
          safetyIdentifier: {
            status: 'deferred',
            reason: 'no-stable-non-pii-app-identifier',
          },
        }),
        message: TRANSLATION_LIFECYCLE_EVENT,
      },
    ]);
    expectLifecycleLogsToBeSafe();
  });

  it('returns a stable missing-key error without making an upstream request', async () => {
    delete process.env.OPENAI_API_KEY;
    const fetchMock = stubOpenAIFetch();

    const result = await postTranslationSession({ targetLanguage: 'es' });

    expect(result.status).toBe(500);
    expect(result.body).toEqual({
      error: 'Server configuration error',
      message: 'OpenAI API key not configured',
      category: 'server-configuration',
      code: 'missing-openai-api-key',
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

  it('logs sanitized upstream request and success lifecycle events', async () => {
    stubOpenAIFetch(async () =>
      jsonResponse({
        value: TEST_CLIENT_SECRET,
        expires_at: 1893456000,
        session: { model: OPENAI_TRANSLATION_MODEL },
        raw_debug: `Authorization: Bearer ${TEST_OPENAI_API_KEY}`,
        sdp: 'v=0',
      })
    );

    const result = await postTranslationSession({ targetLanguage: 'es' });
    const lifecycleRecords = getTranslationLifecycleLogRecords();

    expect(result.status).toBe(200);
    expect(lifecycleRecords).toHaveLength(2);
    expect(lifecycleRecords.map((call) => call.level)).toEqual(['info', 'info']);
    expect(lifecycleRecords.map((call) => call.record.phase)).toEqual([
      'upstream-request',
      'success',
    ]);
    expect(lifecycleRecords[0].record).toMatchObject({
      event: TRANSLATION_LIFECYCLE_EVENT,
      result: 'pending',
      targetLanguage: 'es',
      statusCategory: 'unknown',
      durationConfig: {
        maxMinutes: 30,
        maxSeconds: 1800,
        source: 'default',
      },
      safetyIdentifier: {
        status: 'deferred',
      },
    });
    expect(lifecycleRecords[1].record).toMatchObject({
      event: TRANSLATION_LIFECYCLE_EVENT,
      phase: 'success',
      result: 'success',
      requestId: TEST_REQUEST_ID,
      targetLanguage: 'es',
      statusCode: 200,
    });
    expectLifecycleLogsToBeSafe();
    expect(JSON.stringify(lifecycleRecords)).not.toContain(TEST_CLIENT_SECRET);
    expect(JSON.stringify(lifecycleRecords)).not.toContain('raw_debug');
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

  it.each(ROUTE_SANITIZED_SUCCESS_FIXTURES)(
    'returns a sanitized client secret from fixture: $name',
    async ({ upstream, expected }) => {
      stubOpenAIFetch(async () => jsonResponse(upstream));

      const result = await postTranslationSession({
        targetLanguage: expected.targetLanguage,
      });

      expect(result.status).toBe(200);
      expect(result.body).toEqual(expected);
      expectNoOpenAITranslationSecretLeak(result.body);
      expect(JSON.stringify(result.body)).not.toContain(TEST_OPENAI_API_KEY);
      expect(JSON.stringify(result.body)).not.toContain('raw-upstream-field');
      expect(JSON.stringify(result.body)).not.toContain('upstream_only');
    }
  );

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
      category: 'openai-response',
      code:
        message === 'Translation client secret not found in response'
          ? 'missing-client-secret'
          : 'invalid-openai-response-json',
    });
  });

  it.each(ROUTE_MALFORMED_SUCCESS_FIXTURES)(
    'maps malformed fixture success response: $name',
    async ({ buildResponse, message, code }) => {
      stubOpenAIFetch(async () => buildResponse());

      const result = await postTranslationSession({ targetLanguage: 'de' });

      expect(result.status).toBe(502);
      expect(result.body).toEqual({
        error: 'Invalid OpenAI response',
        message,
        category: 'openai-response',
        code,
      });
      expectNoOpenAITranslationSecretLeak(result.body);
    }
  );

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
      category:
        status === 401 || status === 403
          ? 'openai-auth'
          : status === 429
            ? 'openai-rate-limit'
            : 'openai-service',
      code:
        status === 401 || status === 403
          ? 'openai-auth-failed'
          : status === 429
            ? 'openai-rate-limited'
            : 'openai-service-error',
    });
    expect(JSON.stringify(result.body)).not.toContain(TEST_OPENAI_API_KEY);
    expect(JSON.stringify(result.body)).not.toContain('raw upstream error');
  });

  it.each(ROUTE_UPSTREAM_FAILURE_FIXTURES)(
    'maps upstream fixture status $status without leaking upstream payloads',
    async ({ status, message, category, code }) => {
      stubOpenAIFetch(
        async () =>
          new Response(
            `raw upstream error Authorization: Bearer ${TEST_OPENAI_API_KEY} offer-sdp v=0`,
            {
              status,
              headers: { 'Content-Type': 'text/plain' },
            }
          )
      );

      const result = await postTranslationSession({ targetLanguage: 'fr' });

      expect(result.status).toBe(status);
      expect(result.body).toEqual({
        error: 'OpenAI API error',
        message,
        category,
        code,
      });
      expectNoOpenAITranslationSecretLeak(result.body);
    }
  );

  it('logs sanitized upstream failure lifecycle events', async () => {
    stubOpenAIFetch(
      async () =>
        new Response(`raw upstream error Authorization: Bearer ${TEST_OPENAI_API_KEY} v=0`, {
          status: 429,
          headers: { 'Content-Type': 'text/plain' },
        })
    );

    const result = await postTranslationSession({ targetLanguage: 'fr' });
    const lifecycleRecords = getTranslationLifecycleLogRecords();

    expect(result.status).toBe(429);
    expect(lifecycleRecords).toHaveLength(2);
    expect(lifecycleRecords.map((call) => call.record.phase)).toEqual([
      'upstream-request',
      'upstream-failed',
    ]);
    expect(lifecycleRecords[1]).toEqual({
      level: 'warn',
      message: TRANSLATION_LIFECYCLE_EVENT,
      record: expect.objectContaining({
        event: TRANSLATION_LIFECYCLE_EVENT,
        phase: 'upstream-failed',
        result: 'failure',
        route: '/api/openai/translation-session',
        requestId: TEST_REQUEST_ID,
        targetLanguage: 'fr',
        statusCategory: 'openai-rate-limit',
        statusCode: 429,
        errorCode: 'openai-rate-limited',
      }),
    });
    expectLifecycleLogsToBeSafe();
    expect(JSON.stringify(lifecycleRecords)).not.toContain('raw upstream error');
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
      category: 'openai-timeout',
      code: 'openai-request-timeout',
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
      category: 'network',
      code: 'openai-network-error',
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
      'X-Request-Id': TEST_REQUEST_ID,
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

function captureLifecycleLog(
  level: TranslationLifecycleLogCall['level'],
  args: readonly unknown[]
): void {
  const [record, message] = args;
  if (!isRecord(record) || message !== TRANSLATION_LIFECYCLE_EVENT) {
    return;
  }

  lifecycleLogCalls.push({
    level,
    record,
    message,
  });
}

function getTranslationLifecycleLogRecords(): readonly TranslationLifecycleLogCall[] {
  return lifecycleLogCalls;
}

function expectLifecycleLogsToBeSafe(): void {
  expectNoOpenAITranslationSecretLeak(lifecycleLogCalls);
  const serialized = JSON.stringify(lifecycleLogCalls);

  expect(serialized).not.toContain(TEST_OPENAI_API_KEY);
  expect(serialized).not.toContain('cookie');
  expect(serialized).not.toContain('transcript');
  expect(serialized).not.toContain('clientSecret');
  expect(serialized).not.toContain('raw upstream');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
