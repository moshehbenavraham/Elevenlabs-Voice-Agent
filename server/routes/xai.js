import { Router } from 'express';

const router = Router();

// Default configuration constants
const XAI_API_URL = 'https://api.x.ai/v1/realtime/client_secrets';
const DEFAULT_EXPIRY_SECONDS = 300;
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
    console.log(`[Server] Requesting xAI ephemeral token (expires in ${expirySeconds}s)`);

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
      const errorText = await response.text();
      console.error(`[Server] xAI API error: ${response.status} - ${errorText}`);

      // Map xAI error codes to user-friendly messages
      let message = 'Failed to create xAI session';
      if (response.status === 401 || response.status === 403) {
        message = 'Invalid xAI API key';
      } else if (response.status === 429) {
        message = 'xAI rate limit exceeded';
      } else if (response.status >= 500) {
        message = 'xAI service temporarily unavailable';
      }

      return {
        success: false,
        status: response.status,
        error: { error: 'xAI API error', message }
      };
    }

    const data = await response.json();

    // Extract token from response structure
    const token = data?.client_secret?.value;
    if (!token) {
      console.error('[Server] xAI response missing client_secret.value');
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
        message: error.message
      }
    };
  }
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
router.post('/session', async (req, res) => {
  // Validate API key configuration
  const validation = validateApiKey();
  if (!validation.valid) {
    return res.status(500).json(validation.error);
  }

  // Parse request body with defaults
  const { expirySeconds = DEFAULT_EXPIRY_SECONDS } = req.body || {};

  // Create ephemeral token
  const result = await createEphemeralToken(validation.apiKey, expirySeconds);

  if (!result.success) {
    return res.status(result.status || 500).json(result.error);
  }

  // Calculate expiration time for client reference
  const expiresAt = new Date(Date.now() + expirySeconds * 1000).toISOString();

  res.json({ token: result.token, expiresAt });
});

export default router;
