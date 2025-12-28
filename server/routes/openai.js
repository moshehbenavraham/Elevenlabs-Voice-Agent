import { Router } from 'express';

const router = Router();

// OpenAI Realtime API configuration constants
const OPENAI_API_URL = 'https://api.openai.com/v1/realtime/client_secrets';
const DEFAULT_MODEL = 'gpt-4o-realtime-preview-2024-12-17';
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
 * @param {string} apiKey - The OpenAI API key
 * @param {string} model - The model to use for the session
 * @returns {Promise<{ success: boolean, token?: string, expiresAt?: number, error?: { error: string, message: string }, status?: number }>}
 */
async function createEphemeralToken(apiKey, model = DEFAULT_MODEL) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    console.log(`[Server] Requesting OpenAI ephemeral token (model: ${model})`);

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model
      }),
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
    const token = data?.client_secret?.value;
    const expiresAt = data?.client_secret?.expires_at;

    if (!token) {
      console.error('[Server] OpenAI response missing client_secret.value');
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
 * Voice and instructions are configured during WebSocket session.update, not here.
 *
 * Request body (optional):
 *   - model (optional): Model to use. Default: gpt-4o-realtime-preview-2024-12-17
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
  const { model = DEFAULT_MODEL } = req.body || {};

  // Create ephemeral token
  const result = await createEphemeralToken(validation.apiKey, model);

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
