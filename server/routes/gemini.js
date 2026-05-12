import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import {
  getGeminiBrowserTokenPolicy,
  validateAllowedKeys,
  validateString,
} from '../utils/security.js';
import { sanitizeLogInput } from '../utils/sanitize.js';

const router = Router();

// Gemini Live API configuration constants
const DEFAULT_MODEL = 'gemini-2.5-flash-native-audio-preview-12-2025';
const REQUEST_TIMEOUT_MS = 30000;
const MODEL_PATTERN = /^[A-Za-z0-9._:-]+$/;
// Token expiry: 30 minutes (Gemini sessions can be long-lived)
const TOKEN_EXPIRY_SECONDS = 30 * 60;
// Gemini defaults to one minute for opening a new Live session from a token.
const NEW_SESSION_EXPIRY_SECONDS = 60;

/**
 * Validates that GEMINI_API_KEY environment variable is configured.
 * @returns {{ valid: boolean, apiKey?: string, error?: { error: string, message: string } }}
 */
function validateApiKey() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('[Server] GEMINI_API_KEY is not configured');
    return {
      valid: false,
      error: {
        error: 'Server configuration error',
        message: 'Gemini API key not configured',
      },
    };
  }
  return { valid: true, apiKey };
}

/**
 * Creates an ephemeral token for Gemini Live API WebSocket connection.
 * Uses the @google/genai SDK to generate a scoped access token.
 *
 * @param {string} apiKey - The Gemini API key
 * @param {string} model - The model to use for the session
 * @returns {Promise<{ success: boolean, token?: string, expiresAt?: string, error?: { error: string, message: string }, status?: number }>}
 */
async function createEphemeralToken(apiKey, model) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    console.log(
      `[Server] Creating Gemini Live session for model: ${sanitizeLogInput(model).slice(0, 128)}`
    );

    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_SECONDS * 1000).toISOString();
    const newSessionExpiresAt = new Date(
      Date.now() + NEW_SESSION_EXPIRY_SECONDS * 1000
    ).toISOString();

    const client = new GoogleGenAI({ apiKey });
    const token = await client.authTokens.create({
      config: {
        uses: 1,
        expireTime: expiresAt,
        newSessionExpireTime: newSessionExpiresAt,
        liveConnectConstraints: {
          model,
        },
        lockAdditionalFields: [],
        httpOptions: { apiVersion: 'v1alpha' },
        abortSignal: controller.signal,
      },
    });

    if (!token?.name || typeof token.name !== 'string') {
      throw new Error('Gemini token response did not include a token name');
    }

    clearTimeout(timeoutId);

    console.log('[Server] Gemini ephemeral token generated successfully');

    return {
      success: true,
      token: token.name,
      expiresAt,
      newSessionExpiresAt,
      model,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      console.error('[Server] Gemini API request timed out');
      return {
        success: false,
        status: 504,
        error: {
          error: 'Request timeout',
          message: 'Gemini API request timed out',
        },
      };
    }

    console.error('[Server] Error creating Gemini session:', error.message);

    return {
      success: false,
      status: 500,
      error: {
        error: 'Gemini API error',
        message: 'Failed to create Gemini session',
      },
    };
  }
}

function validateSessionRequest(body) {
  const requestBody = body || {};
  const keys = validateAllowedKeys(requestBody, ['model'], 'body');
  if (!keys.valid) {
    return keys;
  }

  const model = validateString(requestBody.model, {
    field: 'model',
    maxLength: 128,
    pattern: MODEL_PATTERN,
    defaultValue: DEFAULT_MODEL,
  });

  if (!model.valid) {
    return model;
  }

  return { valid: true, model: model.value || DEFAULT_MODEL };
}

/**
 * GET /api/gemini/health
 * Health check endpoint to verify Gemini configuration status.
 * Used by frontend to determine if Gemini tab should be enabled.
 *
 * Response:
 *   - { configured: boolean, provider: string }
 */
router.get('/health', (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const configured = Boolean(apiKey && apiKey.length > 0);

  res.json({
    configured,
    provider: 'gemini',
  });
});

/**
 * POST /api/gemini/session
 * Creates an ephemeral token for Gemini Live WebSocket connection.
 * The token is used as a query parameter in the WebSocket URL.
 *
 * Request body (optional):
 *   - model: string (defaults to gemini-2.5-flash-native-audio-preview-12-2025)
 *
 * Response:
 *   - Success: { token: string, expiresAt: string, model: string }
 *   - Error: { error: string, message: string }
 */
router.post('/session', async (req, res) => {
  // Validate API key configuration
  const validation = validateApiKey();
  if (!validation.valid) {
    return res.status(500).json(validation.error);
  }

  const requestValidation = validateSessionRequest(req.body);
  if (!requestValidation.valid) {
    return res.status(400).json(requestValidation.error);
  }

  const result = await createEphemeralToken(validation.apiKey, requestValidation.model);

  if (!result.success) {
    const tokenPolicy = getGeminiBrowserTokenPolicy({ nodeEnv: process.env.NODE_ENV });
    if (tokenPolicy.canReturnRawApiKey) {
      console.warn(
        '[Server] Falling back to raw Gemini API key for local development compatibility'
      );
      return res.json({
        token: validation.apiKey,
        expiresAt: new Date(Date.now() + TOKEN_EXPIRY_SECONDS * 1000).toISOString(),
        model: requestValidation.model,
      });
    }

    return res.status(result.status || 500).json(result.error);
  }

  res.json({
    token: result.token,
    expiresAt: result.expiresAt,
    model: result.model,
  });
});

/**
 * GET /api/gemini/voices
 * Returns the list of available Gemini HD voices.
 * This is a static list but exposed via API for consistency.
 *
 * Response:
 *   - { voices: Array<{ id: string, name: string, style: string }> }
 */
router.get('/voices', (req, res) => {
  // All 30 Gemini HD voices
  const voices = [
    { id: 'Achernar', name: 'Achernar', style: 'calm' },
    { id: 'Achird', name: 'Achird', style: 'warm' },
    { id: 'Algenib', name: 'Algenib', style: 'neutral' },
    { id: 'Algieba', name: 'Algieba', style: 'bright' },
    { id: 'Alnilam', name: 'Alnilam', style: 'energetic' },
    { id: 'Aoede', name: 'Aoede', style: 'warm' },
    { id: 'Autonoe', name: 'Autonoe', style: 'calm' },
    { id: 'Callirrhoe', name: 'Callirrhoe', style: 'bright' },
    { id: 'Charon', name: 'Charon', style: 'neutral' },
    { id: 'Despina', name: 'Despina', style: 'warm' },
    { id: 'Enceladus', name: 'Enceladus', style: 'energetic' },
    { id: 'Erinome', name: 'Erinome', style: 'calm' },
    { id: 'Fenrir', name: 'Fenrir', style: 'neutral' },
    { id: 'Gacrux', name: 'Gacrux', style: 'bright' },
    { id: 'Iapetus', name: 'Iapetus', style: 'warm' },
    { id: 'Kore', name: 'Kore', style: 'energetic' },
    { id: 'Laomedeia', name: 'Laomedeia', style: 'calm' },
    { id: 'Leda', name: 'Leda', style: 'bright' },
    { id: 'Orus', name: 'Orus', style: 'neutral' },
    { id: 'Puck', name: 'Puck', style: 'warm' },
    { id: 'Pulcherrima', name: 'Pulcherrima', style: 'bright' },
    { id: 'Rasalgethi', name: 'Rasalgethi', style: 'energetic' },
    { id: 'Sadachbia', name: 'Sadachbia', style: 'calm' },
    { id: 'Sadaltager', name: 'Sadaltager', style: 'neutral' },
    { id: 'Schedar', name: 'Schedar', style: 'warm' },
    { id: 'Sulafat', name: 'Sulafat', style: 'bright' },
    { id: 'Umbriel', name: 'Umbriel', style: 'calm' },
    { id: 'Vindemiatrix', name: 'Vindemiatrix', style: 'energetic' },
    { id: 'Zephyr', name: 'Zephyr', style: 'neutral' },
    { id: 'Zubenelgenubi', name: 'Zubenelgenubi', style: 'warm' },
  ];

  res.json({ voices });
});

export default router;
export { createEphemeralToken, validateSessionRequest };
