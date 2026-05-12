import { EventEmitter } from 'node:events';
import { describe, expect, it } from 'vitest';

interface MockRequest {
  headers: Record<string, string | readonly string[] | undefined>;
  method?: string;
  path?: string;
  url?: string;
  route?: { path?: string };
  ip?: string;
  protocol?: string;
  socket?: { remoteAddress?: string };
  requestId?: string;
  id?: string;
  body?: unknown;
}

interface MockResponse extends EventEmitter {
  statusCode: number;
  writableEnded: boolean;
  headers: Record<string, string>;
  setHeader: (name: string, value: string) => void;
}

interface MetricsSnapshot {
  readonly requests: {
    readonly total: number;
    readonly inFlight: number;
    readonly errors: {
      readonly total: number;
      readonly client: number;
      readonly server: number;
    };
    readonly byStatusCode: Record<string, number>;
    readonly byStatusClass: Record<string, number>;
    readonly byMethod: Record<string, number>;
    readonly byRoute?: Record<string, number>;
  };
  readonly latencyMs: {
    readonly count: number;
    readonly sampleCount: number;
    readonly min: number;
    readonly max: number;
    readonly average: number;
    readonly p50: number;
    readonly p95: number;
    readonly sampleLimit: number;
  };
}

interface RequestMetrics {
  recordRequest: (result: {
    statusCode: number;
    durationMs: number;
    method: string;
    path: string;
    route?: string;
  }) => void;
  incrementInFlight: () => void;
  decrementInFlight: () => void;
  getSnapshot: (options?: { includeRoutes?: boolean }) => MetricsSnapshot;
}

interface TestLogger {
  info: (record: unknown, message: string) => void;
  warn: (record: unknown, message: string) => void;
  error: (record: unknown, message: string) => void;
}

interface ObservabilityModule {
  REQUEST_ID_HEADER: string;
  normalizeRequestId: (value: unknown) => string | null;
  resolveRequestId: (req: Pick<MockRequest, 'headers'>) => string;
  getSafeRequestMetadata: (req: MockRequest) => unknown;
  createRequestMetrics: (options?: { maxLatencySamples?: number }) => RequestMetrics;
  createRequestLoggingMiddleware: (options: {
    logger: TestLogger;
    metrics: RequestMetrics;
    logEnabled: boolean;
    metricsEnabled: boolean;
  }) => (req: MockRequest, res: MockResponse, next: () => void) => void;
}

const modulePath = '../../server/utils/observability.js';
const observability = (await import(modulePath)) as ObservabilityModule;

function createMockResponse(): MockResponse {
  const response = new EventEmitter() as MockResponse;
  response.statusCode = 200;
  response.writableEnded = true;
  response.headers = {};
  response.setHeader = (name: string, value: string): void => {
    response.headers[name.toLowerCase()] = value;
  };

  return response;
}

describe('server observability utilities', () => {
  it('accepts bounded safe request IDs and rejects unsafe IDs', () => {
    expect(observability.normalizeRequestId('trace-1234_ABC')).toBe('trace-1234_ABC');
    expect(observability.normalizeRequestId('short')).toBeNull();
    expect(observability.normalizeRequestId('bad id with spaces')).toBeNull();
    expect(observability.normalizeRequestId('bad\ntrace-1234')).toBeNull();

    const generated = observability.resolveRequestId({
      headers: { [observability.REQUEST_ID_HEADER]: 'bad id with spaces' },
    });

    expect(generated).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('extracts safe request metadata without secrets, bodies, or query strings', () => {
    const metadata = observability.getSafeRequestMetadata({
      headers: {
        authorization: 'Bearer should-not-log',
        cookie: 'session=should-not-log',
        'x-api-key': 'should-not-log',
        'user-agent': 'Vitest\nInjected',
        referer: 'https://voice.example.com/page?token=should-not-log',
        'content-type': 'application/json',
        'content-length': '42',
      },
      requestId: 'trace-12345678',
      method: 'POST',
      path: '/api/openai/token?token=should-not-log',
      route: { path: '/api/openai/token' },
      ip: '127.0.0.1',
      protocol: 'https',
      body: { apiKey: 'should-not-log' },
    });

    const serialized = JSON.stringify(metadata);
    expect(serialized).toContain('trace-12345678');
    expect(serialized).toContain('/api/openai/token');
    expect(serialized).not.toContain('Bearer');
    expect(serialized).not.toContain('session=');
    expect(serialized).not.toContain('x-api-key');
    expect(serialized).not.toContain('token=should-not-log');
    expect(serialized).not.toContain('apiKey');
    expect(serialized).not.toContain('\n');
  });

  it('tracks bounded request metrics with deterministic count ordering', () => {
    const metrics = observability.createRequestMetrics({ maxLatencySamples: 2 });

    metrics.recordRequest({
      statusCode: 503,
      durationMs: 80,
      method: 'POST',
      path: '/api/openai/token',
      route: '/api/openai/token',
    });
    metrics.recordRequest({
      statusCode: 200,
      durationMs: 10,
      method: 'GET',
      path: '/api/health',
      route: '/api/health',
    });
    metrics.recordRequest({
      statusCode: 404,
      durationMs: 40,
      method: 'GET',
      path: '/api/missing',
      route: '/api/missing',
    });
    metrics.recordRequest({
      statusCode: 200,
      durationMs: 20,
      method: '__proto__',
      path: '/api/prototype',
      route: '__proto__',
    });

    const snapshot = metrics.getSnapshot({ includeRoutes: true });

    expect(snapshot.requests.total).toBe(4);
    expect(snapshot.requests.errors).toEqual({ total: 2, client: 1, server: 1 });
    expect(Object.keys(snapshot.requests.byStatusCode)).toEqual(['200', '404', '503']);
    expect(snapshot.requests.byStatusClass).toMatchObject({ '2xx': 2, '4xx': 1, '5xx': 1 });
    expect(snapshot.requests.byMethod).toEqual({ GET: 2, POST: 1, UNKNOWN: 1 });
    expect(Object.keys(snapshot.requests.byRoute ?? {})).toEqual([
      '/api/health',
      '/api/missing',
      '/api/openai/token',
      'unknown',
    ]);
    expect(Object.hasOwn(Object.prototype, 'polluted')).toBe(false);
    expect(snapshot.latencyMs).toMatchObject({
      count: 4,
      sampleCount: 2,
      min: 10,
      max: 80,
      average: 37.5,
      p50: 20,
      p95: 40,
      sampleLimit: 2,
    });
  });

  it('sets request IDs and prevents duplicate completion accounting', () => {
    const metrics = observability.createRequestMetrics();
    const logs: readonly unknown[] = [];
    const mutableLogs: unknown[] = [...logs];
    const logger: TestLogger = {
      info: (record: unknown) => mutableLogs.push(record),
      warn: (record: unknown) => mutableLogs.push(record),
      error: (record: unknown) => mutableLogs.push(record),
    };
    const middleware = observability.createRequestLoggingMiddleware({
      logger,
      metrics,
      logEnabled: true,
      metricsEnabled: true,
    });
    const request: MockRequest = {
      headers: { [observability.REQUEST_ID_HEADER]: 'trace-12345678' },
      method: 'GET',
      path: '/api/health',
      route: { path: '/api/health' },
      ip: '127.0.0.1',
    };
    const response = createMockResponse();
    let nextCalled = false;

    middleware(request, response, () => {
      nextCalled = true;
    });

    response.emit('finish');
    response.emit('close');

    expect(nextCalled).toBe(true);
    expect(request.requestId).toBe('trace-12345678');
    expect(response.headers[observability.REQUEST_ID_HEADER]).toBe('trace-12345678');
    expect(metrics.getSnapshot().requests).toMatchObject({ total: 1, inFlight: 0 });
    expect(mutableLogs).toHaveLength(1);
  });
});
