// @vitest-environment node
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { TokenVerifier } from 'livekit-server-sdk';

const routePath = '../../server/routes/livekit.js';
const securityPath = '../../server/utils/security.js';
const configPath = '../../shared/livekit-config.mjs';
const { default: route } = await import(routePath);
const { getLiveKitConfig } = await import(configPath);
const { TOKEN_ENDPOINT_PATHS } = await import(securityPath);
const express = (await import('express')).default;
const app = express();
app.use(express.json());
app.use('/api/livekit', route);
let server: ReturnType<typeof app.listen>;
let base: string;
const env = {
  LIVEKIT_ENABLED: 'true',
  LIVEKIT_URL: 'wss://demo.livekit.cloud',
  LIVEKIT_API_KEY: 'test-api-key',
  LIVEKIT_API_SECRET: 'test-secret-with-enough-characters',
};

beforeAll(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => resolve());
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Test server failed');
  base = `http://127.0.0.1:${address.port}/api/livekit`;
});
afterAll(
  () =>
    new Promise<void>((resolve, reject) =>
      server.close((err?: Error) => (err ? reject(err) : resolve()))
    )
);
afterEach(() => vi.unstubAllEnvs());
const configure = () => {
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
};
const create = (body: unknown = {}) =>
  fetch(`${base}/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('LiveKit token boundary', () => {
  it('signs isolated, short-lived tokens with only microphone publishing and the configured dispatch', async () => {
    configure();
    const a = await create();
    const b = await create();
    expect(a.status).toBe(200);
    expect(a.headers.get('cache-control')).toBe('no-store');
    const first = await a.json();
    const second = await b.json();
    expect(first.roomName).not.toBe(second.roomName);
    expect(first.participantIdentity).not.toBe(second.participantIdentity);
    const claims = await new TokenVerifier(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET).verify(
      first.participantToken
    );
    expect(claims.video).toEqual({
      roomJoin: true,
      room: first.roomName,
      canSubscribe: true,
      canPublish: true,
      canPublishSources: ['microphone'],
      canPublishData: true,
      canUpdateOwnMetadata: false,
    });
    expect(claims.sub).toBe(first.participantIdentity);
    expect(Number(claims.exp) - Number(claims.nbf)).toBeLessThanOrEqual(300);
    expect(claims.roomConfig?.agents).toHaveLength(1);
    expect(claims.roomConfig?.agents?.[0]?.agentName).toBe('pupuplatter-livekit-demo');
    expect(JSON.stringify(first)).not.toContain(env.LIVEKIT_API_SECRET);
  });
  it.each([{ agentName: 'other' }, { roomName: 'shared' }, { grants: {} }, [], null])(
    'rejects caller-controlled session configuration: %j',
    async (body) => {
      configure();
      expect((await create(body)).status).toBe(400);
    }
  );
  it('does not issue tokens when disabled or missing configuration', async () => {
    configure();
    vi.stubEnv('LIVEKIT_ENABLED', 'false');
    expect((await create()).status).toBe(503);
    vi.stubEnv('LIVEKIT_ENABLED', 'true');
    vi.stubEnv('LIVEKIT_API_SECRET', '<your-secret>');
    expect((await create()).status).toBe(503);
  });
  it('reports configuration separately from agent availability without exposing credentials', async () => {
    configure();
    const response = await fetch(`${base}/config`);
    expect(await response.json()).toEqual({
      enabled: true,
      configured: true,
      agentOnline: null,
      maxSessionSeconds: 600,
      agentWaitSeconds: 30,
    });
  });
  it('registers the route with the existing token limiter and in-flight guard', () => {
    expect(TOKEN_ENDPOINT_PATHS).toContain('/api/livekit/session');
  });
  it.each(['0', '-1', 'Infinity', '1.5', '1801', 'bad'])(
    'rejects an unsafe session limit %s',
    (value) => {
      expect(getLiveKitConfig({ ...env, LIVEKIT_SESSION_MAX_SECONDS: value }).configured).toBe(
        false
      );
    }
  );
  it.each([
    'https://demo.livekit.cloud',
    'wss://user:pass@demo.livekit.cloud',
    'wss://your-server.example.com',
  ])('rejects invalid URL %s', (url) => {
    expect(getLiveKitConfig({ ...env, LIVEKIT_URL: url }).configured).toBe(false);
  });
  it('bounds the configurable wait-for-agent deadline', () => {
    for (const value of ['0', '4', '121', 'NaN', '30.5']) {
      expect(getLiveKitConfig({ ...env, LIVEKIT_AGENT_WAIT_SECONDS: value }).configured).toBe(
        false
      );
    }
    expect(getLiveKitConfig({ ...env, LIVEKIT_AGENT_WAIT_SECONDS: '15' }).agentWaitSeconds).toBe(
      15
    );
  });
});
