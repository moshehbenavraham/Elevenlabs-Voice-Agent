import { Router } from 'express';
import { sanitizeLogInput } from '../utils/sanitize.js';
import {
  mapProviderError,
  validateAllowedKeys,
  validateInteger,
} from '../utils/security.js';

const router = Router();

// Default configuration constants
const XAI_API_URL = 'https://api.x.ai/v1/realtime/client_secrets';
const DEFAULT_EXPIRY_SECONDS = 300;
const MIN_EXPIRY_SECONDS = 60;
const MAX_EXPIRY_SECONDS = 3600;
const REQUEST_TIMEOUT_MS = 30000;

/**
 * Validates that XAI_API_KEY environment variable is configured.
 * @returns {{ valid: boolean, error?: { error: string, message: string } }}
 */
function validateApiKey() {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    console.error('[Server] XAI_API_KEY is not configured');
    return {
      valid: false,
      error: {
        error: 'Server configuration error',
        message: 'xAI API key not configured'
      }
    };
  }
  return { valid: true, apiKey };
}

/**
 * Creates an ephemeral client secret token from xAI Realtime API.
 * The token provides scoped access for WebSocket connections.
 * Voice and instructions are configured during WebSocket session.update.
 * @param {string} apiKey - The xAI API key
 * @param {number} expirySeconds - Token expiry time in seconds
 * @returns {Promise<{ success: boolean, token?: string, error?: { error: string, message: string }, status?: number }>}
 */
async function createEphemeralToken(apiKey, expirySeconds = DEFAULT_EXPIRY_SECONDS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    console.log(`[Server] Requesting xAI ephemeral token (expires in %ss)`, sanitizeLogInput(expirySeconds));

    const response = await fetch(XAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        expires_after: { seconds: expirySeconds }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`[Server] xAI API error: ${response.status}`);

      return {
        success: false,
        status: response.status,
        error: mapProviderError('xAI', response.status)
      };
    }

    const data = await response.json();

    // Extract token from response structure
    // xAI returns token at top level: { value: "...", expires_at: ... }
    // (differs from OpenAI beta format which uses client_secret.value)
    const token = data?.value || data?.client_secret?.value;
    if (!token) {
      console.error('[Server] xAI response missing token. Response keys:', Object.keys(data || {}));
      return {
        success: false,
        status: 500,
        error: {
          error: 'Invalid xAI response',
          message: 'Session token not found in response'
        }
      };
    }

    console.log('[Server] xAI ephemeral token generated successfully');
    return { success: true, token };

  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      console.error('[Server] xAI API request timed out');
      return {
        success: false,
        status: 504,
        error: {
          error: 'Request timeout',
          message: 'xAI API request timed out'
        }
      };
    }

    console.error('[Server] Error calling xAI API:', error.message);
    return {
      success: false,
      status: 500,
      error: {
        error: 'Internal server error',
        message: 'Failed to create xAI session'
      }
    };
  }
}

function validateSessionRequest(body) {
  const requestBody = body || {};
  const keys = validateAllowedKeys(requestBody, ['expirySeconds'], 'body');
  if (!keys.valid) {
    return keys;
  }

  const expiry = validateInteger(requestBody.expirySeconds, {
    field: 'expirySeconds',
    min: MIN_EXPIRY_SECONDS,
    max: MAX_EXPIRY_SECONDS,
    defaultValue: DEFAULT_EXPIRY_SECONDS,
  });

  if (!expiry.valid) {
    return expiry;
  }

  return { valid: true, expirySeconds: expiry.value };
}

/**
 * POST /api/xai/session
 * Creates an ephemeral client secret token for xAI WebSocket connection.
 * Voice and instructions are configured during WebSocket session.update, not here.
 *
 * Request body (optional):
 *   - expirySeconds (optional): Token lifetime in seconds. Default: 300
 *
 * Response:
 *   - Success: { token: string, expiresAt: string }
 *   - Error: { error: string, message: string }
 */
/**
 * GET /api/xai/health
 * Health check endpoint to verify xAI configuration status.
 * Used by frontend to determine if xAI tab should be enabled.
 *
 * Response:
 *   - { configured: boolean, provider: string }
 */
router.get('/health', (req, res) => {
  const apiKey = process.env.XAI_API_KEY;
  const configured = Boolean(apiKey && apiKey.length > 0);

  res.json({
    configured,
    provider: 'xai'
  });
});

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

  // Create ephemeral token
  const result = await createEphemeralToken(validation.apiKey, requestValidation.expirySeconds);

  if (!result.success) {
    return res.status(result.status || 500).json(result.error);
  }

  // Calculate expiration time for client reference
  const expiresAt = new Date(Date.now() + requestValidation.expirySeconds * 1000).toISOString();

  res.json({ token: result.token, expiresAt });
});

export default router;
