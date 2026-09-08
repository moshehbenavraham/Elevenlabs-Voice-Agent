// @vitest-environment node
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

interface RetellRouteModule {
  mapRetellApiError: (status: number) => { readonly error: string; readonly message: string };
}

const modulePath = '../../server/routes/retell.js';
const { default: route, mapRetellApiError } = (await import(modulePath)) as RetellRouteModule & {
  default: import('express').Router;
};
const express = (await import('express')).default;
const app = express();
app.use(express.json());
app.use('/api/retell', route);
const realFetch = globalThis.fetch.bind(globalThis);
let server: ReturnType<typeof app.listen>;
let base: string;

beforeAll(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => resolve());
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Test server failed');
  base = `http://127.0.0.1:${address.port}/api/retell`;
});

afterAll(
  () =>
    new Promise<void>((resolve, reject) =>
      server.close((error?: Error) => (error ? reject(error) : resolve()))
    )
);

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

const createWebCall = (body: unknown = {}) =>
  realFetch(`${base}/create-web-call`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('Retell route helpers', () => {
  it('maps Retell agent lookup failures to an actionable configuration message', () => {
    expect(mapRetellApiError(404)).toEqual({
      error: 'Retell API error',
      message:
        'Retell agent not found. Verify VITE_RETELL_AGENT_ID belongs to the account used by RETELL_API_KEY.',
    });
  });

  it('keeps Retell auth failures generic', () => {
    expect(mapRetellApiError(401)).toEqual({
      error: 'Retell API error',
      message: 'Invalid Retell API key',
    });
  });

  it('requires both server-side Retell settings for health and call creation', async () => {
    vi.stubEnv('RETELL_API_KEY', 'key_test');
    vi.stubEnv('VITE_RETELL_AGENT_ID', 'your-agent-id');
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const upstream = vi.spyOn(globalThis, 'fetch');

    const health = await realFetch(`${base}/health`);
    expect(await health.json()).toEqual({ configured: false, provider: 'retell' });

    const response = await createWebCall({ agent_id: 'client-agent' });
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: 'Server configuration error',
      message: 'Retell agent ID not configured',
    });
    expect(upstream).not.toHaveBeenCalled();
  });

  it('uses the configured server agent ID instead of the client value', async () => {
    vi.stubEnv('RETELL_API_KEY', 'key_test');
    vi.stubEnv('VITE_RETELL_AGENT_ID', 'server-agent');
    const upstream = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ access_token: 'access-token', call_id: 'call-id' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const response = await createWebCall({
      agent_id: 'client-agent',
      metadata: { source: 'test' },
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ access_token: 'access-token', call_id: 'call-id' });
    expect(upstream).toHaveBeenCalledOnce();
    const [, options] = upstream.mock.calls[0];
    expect(JSON.parse(String(options?.body))).toMatchObject({
      agent_id: 'server-agent',
      metadata: { source: 'test' },
    });
  });
});
