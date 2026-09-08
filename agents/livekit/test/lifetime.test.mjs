import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSessionLifetime } from '../dist/lifetime.js';
import { getLiveKitConfig } from '../../../shared/livekit-config.mjs';

test('one close operation wins across participant departure, error and timeout', async () => {
  const reasons = [];
  const lifetime = createSessionLifetime(60, async (reason) => {
    reasons.push(reason);
  });
  await Promise.all([lifetime.finish('participant-left'), lifetime.finish('pipeline-error')]);
  assert.deepEqual(reasons, ['participant-left']);
  assert.equal(lifetime.finished, true);
});

test('duration closes independently of a browser request', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const reasons = [];
  const lifetime = createSessionLifetime(30, async (reason) => {
    reasons.push(reason);
  });
  t.mock.timers.tick(30000);
  await Promise.resolve();
  assert.deepEqual(reasons, ['duration-limit']);
  lifetime.dispose();
});

test('shutdown disposes the duration timer', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let closes = 0;
  const lifetime = createSessionLifetime(30, async () => {
    closes++;
  });
  lifetime.dispose();
  t.mock.timers.tick(60000);
  await Promise.resolve();
  assert.equal(closes, 0);
});

test('worker uses the same bounded session configuration as the server', () => {
  const env = {
    LIVEKIT_URL: 'wss://demo.livekit.cloud',
    LIVEKIT_API_KEY: 'key',
    LIVEKIT_API_SECRET: 'secret',
  };
  assert.equal(getLiveKitConfig(env).maxSessionSeconds, 600);
  assert.equal(
    getLiveKitConfig({ ...env, LIVEKIT_SESSION_MAX_SECONDS: '99999' }).configured,
    false
  );
});

test('rejected shutdown is contained for shared event and timer callers', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let closes = 0;
  const lifetime = createSessionLifetime(1, async () => {
    closes++;
    throw new Error('close failed');
  });
  const first = lifetime.finish('participant-left');
  assert.equal(first, lifetime.finish('pipeline-error'));
  await assert.doesNotReject(first);
  t.mock.timers.tick(1000);
  assert.equal(closes, 1);
  const deadline = createSessionLifetime(1, async () => {
    throw new Error('deadline close failed');
  });
  t.mock.timers.tick(1000);
  await assert.doesNotReject(deadline.finish('shutdown'));
});
