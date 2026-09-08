import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { AccessToken, RoomConfiguration, RoomAgentDispatch, TrackSource } from 'livekit-server-sdk';
import { getLiveKitConfig } from '../../shared/livekit-config.mjs';
import { validateAllowedKeys } from '../utils/security.js';

import { serverLogger } from '../utils/observability.js';
import { sanitizeLogInput } from '../utils/sanitize.js';

const router = Router();
const TOKEN_TTL_SECONDS = 300;

/** Create an isolated, microphone-only join token with the configured agent dispatch. */
export async function createLiveKitSession(config) {
  const roomName = `pupu-${randomUUID()}`;
  const participantIdentity = `guest-${randomUUID()}`;
  const token = new AccessToken(config.apiKey, config.apiSecret, {
    identity: participantIdentity,
    name: 'You',
    ttl: TOKEN_TTL_SECONDS,
  });
  token.addGrant({
    roomJoin: true,
    room: roomName,
    canSubscribe: true,
    canPublish: true,
    canPublishSources: [TrackSource.MICROPHONE],
    canPublishData: true,
    canUpdateOwnMetadata: false,
  });
  token.roomConfig = new RoomConfiguration({
    maxParticipants: 2,
    emptyTimeout: 30,
    departureTimeout: 20,
    agents: [
      new RoomAgentDispatch({
        agentName: config.agentName,
        metadata: JSON.stringify({ participantIdentity }),
      }),
    ],
  });
  return {
    serverUrl: config.serverUrl,
    participantToken: await token.toJwt(),
    roomName,
    participantIdentity,
    expiresAt: Date.now() + TOKEN_TTL_SECONDS * 1000,
  };
}

router.get('/config', (_req, res) => {
  const config = getLiveKitConfig();
  res
    .set('Cache-Control', 'no-store')
    .json({
      enabled: config.enabled,
      configured: config.configured,
      agentOnline: null,
      agentWaitSeconds: config.configured ? config.agentWaitSeconds : 30,
      maxSessionSeconds: config.configured ? config.maxSessionSeconds : 600,
    });
});

router.post('/session', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const validation = validateAllowedKeys(req.body, [], 'body');
  if (!validation.valid) return res.status(400).json(validation.error);
  const config = getLiveKitConfig();
  if (!config.enabled || !config.configured) {
    return res
      .status(503)
      .json({
        error: 'LiveKit unavailable',
        message: 'The LiveKit demo is not configured. Ask the demo host to check setup.',
      });
  }
  try {
    return res.json(await createLiveKitSession(config));
  } catch (error) {
    // Preserve signing diagnostics without serializing SDK objects, keys, or tokens.
    let detail = error instanceof Error ? error.message : 'Unknown signing failure';
    for (const secret of [config.apiKey, config.apiSecret, config.serverUrl]) {
      if (secret) detail = detail.split(secret).join('[redacted]');
    }
    detail = detail.replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[redacted token]');
    serverLogger.error(
      { requestId: req.requestId, detail: sanitizeLogInput(detail).slice(0, 500) },
      'LiveKit session creation failed'
    );
    return res
      .status(500)
      .json({
        error: 'LiveKit session error',
        message: 'Could not start a LiveKit session. Please try again.',
      });
  }
});

export default router;
