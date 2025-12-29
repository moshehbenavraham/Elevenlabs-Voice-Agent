import { Router } from 'express';

const router = Router();

// OpenAI Realtime API configuration constants
const OPENAI_API_URL = 'https://api.openai.com/v1/realtime/client_secrets';
const REQUEST_TIMEOUT_MS = 30000;

/**
 * Validates that OPENAI_API_KEY environment variable is configured.
 * @returns {{ valid: boolean, error?: { error: string, message: string } }}
 */
function validateApiKey() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('[Server] OPENAI_API_KEY is not configured');
    return {
      valid: false,
      error: {
        error: 'Server configuration error',
        message: 'OpenAI API key not configured'
      }
    };
  }
  return { valid: true, apiKey };
}

/**
 * Creates an ephemeral client secret token from OpenAI Realtime API.
 * The token provides scoped access for WebSocket connections.
 * Voice and instructions are configured during WebSocket session.update.
 * Note: Model is specified in the WebSocket URL, not in the token request.
 * @param {string} apiKey - The OpenAI API key
 * @returns {Promise<{ success: boolean, token?: string, expiresAt?: number, error?: { error: string, message: string }, status?: number }>}
 */
async function createEphemeralToken(apiKey) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    console.log('[Server] Requesting OpenAI ephemeral token');

    // OpenAI GA client_secrets endpoint doesn't accept model parameter
    // Model is specified in WebSocket URL: wss://api.openai.com/v1/realtime?model=...
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({}),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Server] OpenAI API error: ${response.status} - ${errorText}`);

      // Map OpenAI error codes to user-friendly messages
      let message = 'Failed to create OpenAI session';
      if (response.status === 401 || response.status === 403) {
        message = 'Invalid OpenAI API key';
      } else if (response.status === 429) {
        message = 'OpenAI rate limit exceeded';
      } else if (response.status >= 500) {
        message = 'OpenAI service temporarily unavailable';
      }

      return {
        success: false,
        status: response.status,
        error: { error: 'OpenAI API error', message }
      };
    }

    const data = await response.json();

    // Extract token and expiration from OpenAI response structure
    // OpenAI GA format: { value: "...", expires_at: ... }
    // OpenAI beta format: { client_secret: { value: "...", expires_at: ... } }
    const token = data?.value || data?.client_secret?.value;
    const expiresAt = data?.expires_at || data?.client_secret?.expires_at;

    if (!token) {
      console.error('[Server] OpenAI response missing token. Response keys:', Object.keys(data || {}));
      return {
        success: false,
        status: 500,
        error: {
          error: 'Invalid OpenAI response',
          message: 'Session token not found in response'
        }
      };
    }

    console.log('[Server] OpenAI ephemeral token generated successfully');
    return { success: true, token, expiresAt };

  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      console.error('[Server] OpenAI API request timed out');
      return {
        success: false,
        status: 504,
        error: {
          error: 'Request timeout',
          message: 'OpenAI API request timed out'
        }
      };
    }

    console.error('[Server] Error calling OpenAI API:', error.message);
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
 * POST /api/openai/session
 * Creates an ephemeral client secret token for OpenAI WebSocket connection.
 * Voice and instructions are configured during WebSocket session.update.
 * Model is specified in the WebSocket URL by the frontend.
 *
 * Response:
 *   - Success: { token: string, expiresAt: string }
 *   - Error: { error: string, message: string }
 */
/**
 * GET /api/openai/health
 * Health check endpoint to verify OpenAI configuration status.
 * Used by frontend to determine if OpenAI tab should be enabled.
 *
 * Response:
 *   - { configured: boolean, provider: string }
 */
router.get('/health', (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  const configured = Boolean(apiKey && apiKey.length > 0);

  res.json({
    configured,
    provider: 'openai'
  });
});

router.post('/session', async (req, res) => {
  // Validate API key configuration
  const validation = validateApiKey();
  if (!validation.valid) {
    return res.status(500).json(validation.error);
  }

  // Create ephemeral token (model is specified in WebSocket URL by frontend)
  const result = await createEphemeralToken(validation.apiKey);

  if (!result.success) {
    return res.status(result.status || 500).json(result.error);
  }

  // Use expiration from OpenAI response, or calculate fallback
  const expiresAt = result.expiresAt
    ? new Date(result.expiresAt * 1000).toISOString()
    : new Date(Date.now() + 60 * 1000).toISOString();

  res.json({ token: result.token, expiresAt });
});

export default router;
