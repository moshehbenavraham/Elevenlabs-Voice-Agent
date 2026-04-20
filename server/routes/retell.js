import { Router } from 'express';
import { sanitizeLogInput } from '../utils/sanitize.js';

const router = Router();

// Retell API configuration constants
const RETELL_API_URL = 'https://api.retellai.com/v2/create-web-call';
const REQUEST_TIMEOUT_MS = 30000;
const RETELL_AGENT_PLACEHOLDER = 'your-retell-agent-id';

/**
 * Validates that RETELL_API_KEY environment variable is configured.
 * Retell API keys start with 'key_' prefix.
 * @returns {{ valid: boolean, apiKey?: string, error?: { error: string, message: string } }}
 */
function validateApiKey() {
  const apiKey = process.env.RETELL_API_KEY;
  if (!apiKey) {
    console.error('[Server] RETELL_API_KEY is not configured');
    return {
      valid: false,
      error: {
        error: 'Server configuration error',
        message: 'Retell API key not configured'
      }
    };
  }
  return { valid: true, apiKey };
}

/**
 * Resolves the trusted Retell agent ID from server-side configuration.
 * Prefers RETELL_AGENT_ID and falls back to VITE_RETELL_AGENT_ID for compatibility.
 * @returns {{ valid: boolean, agentId?: string, error?: { error: string, message: string } }}
 */
export function getConfiguredRetellAgentId() {
  const agentId = process.env.RETELL_AGENT_ID || process.env.VITE_RETELL_AGENT_ID;

  if (!agentId || agentId === RETELL_AGENT_PLACEHOLDER) {
    return {
      valid: false,
      error: {
        error: 'Server configuration error',
        message: 'Retell agent ID not configured'
      }
    };
  }

  return { valid: true, agentId };
}

/**
 * Creates a Retell web call and returns the access_token for frontend SDK connection.
 * The frontend RetellWebClient uses this token to establish the call.
 * @param {string} apiKey - The Retell API key
 * @param {Object} options - Call configuration options
 * @param {string} options.agentId - Required Retell agent ID
 * @returns {Promise<{ success: boolean, accessToken?: string, callId?: string, error?: { error: string, message: string }, status?: number }>}
 */
async function createRetellWebCall(apiKey, options) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const { agentId } = options;
    console.log('[Server] Creating Retell web call for agent:', sanitizeLogInput(agentId));

    // Build request body - agent_id is required
    const requestBody = {
      agent_id: agentId
    };
    const response = await fetch(RETELL_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Server] Retell API error: ${response.status} - ${errorText}`);

      // Map Retell error codes to user-friendly messages
      let message = 'Failed to create Retell web call';
      if (response.status === 401 || response.status === 403) {
        message = 'Invalid Retell API key';
      } else if (response.status === 429) {
        message = 'Retell rate limit exceeded';
      } else if (response.status >= 500) {
        message = 'Retell service temporarily unavailable';
      }

      return {
        success: false,
        status: response.status,
        error: { error: 'Retell API error', message }
      };
    }

    const data = await response.json();

    // Extract access_token and call_id from response
    const accessToken = data?.access_token;
    const callId = data?.call_id;

    if (!accessToken) {
      console.error('[Server] Retell response missing access_token. Response keys:', Object.keys(data || {}));
      return {
        success: false,
        status: 500,
        error: {
          error: 'Invalid Retell response',
          message: 'access_token not found in response'
        }
      };
    }

    console.log('[Server] Retell web call created successfully');
    return { success: true, accessToken, callId };

  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      console.error('[Server] Retell API request timed out');
      return {
        success: false,
        status: 504,
        error: {
          error: 'Request timeout',
          message: 'Retell API request timed out'
        }
      };
    }

    console.error('[Server] Error calling Retell API:', error.message);
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
 * GET /api/retell/health
 * Health check endpoint to verify Retell configuration status.
 * Used by frontend to determine if Retell tab should be enabled.
 *
 * Response:
 *   - { configured: boolean, provider: string }
 */
router.get('/health', (req, res) => {
  const apiKey = process.env.RETELL_API_KEY;
  const configured = Boolean(apiKey && apiKey.length > 0);

  res.json({
    configured,
    provider: 'retell'
  });
});

/**
 * POST /api/retell/create-web-call
 * Creates a Retell web call and returns the access_token for SDK connection.
 * The frontend RetellWebClient uses this access_token to connect.
 *
 * Request body:
 *   - No client-supplied fields are accepted. Agent selection is pinned server-side.
 *
 * Response:
 *   - Success: { access_token: string, call_id?: string }
 *   - Error: { error: string, message: string }
 */
router.post('/create-web-call', async (req, res) => {
  // Validate API key configuration
  const apiValidation = validateApiKey();
  if (!apiValidation.valid) {
    return res.status(500).json(apiValidation.error);
  }

  if (req.body && Object.keys(req.body).length > 0) {
    return res.status(400).json({
      error: 'Validation error',
      message: 'This endpoint does not accept client-supplied call configuration'
    });
  }

  const agentValidation = getConfiguredRetellAgentId();
  if (!agentValidation.valid) {
    return res.status(500).json(agentValidation.error);
  }

  // Create Retell web call
  const result = await createRetellWebCall(apiValidation.apiKey, {
    agentId: agentValidation.agentId
  });

  if (!result.success) {
    return res.status(result.status || 500).json(result.error);
  }

  // Return access_token (and optionally call_id for reference)
  const response = { access_token: result.accessToken };
  if (result.callId) {
    response.call_id = result.callId;
  }

  res.json(response);
});

export default router;
