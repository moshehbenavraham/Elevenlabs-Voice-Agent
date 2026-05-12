import { Router } from 'express';
import { sanitizeLogInput } from '../utils/sanitize.js';
import {
  mapProviderError,
  validateAllowedKeys,
  validateOptionalObject,
  validateString,
} from '../utils/security.js';

const router = Router();

// Retell API configuration constants
const RETELL_API_URL = 'https://api.retellai.com/v2/create-web-call';
const REQUEST_TIMEOUT_MS = 30000;
const AGENT_ID_PATTERN = /^[A-Za-z0-9_-]+$/;

async function readRetellErrorResponse(response) {
  const text = await response.text().catch(() => '');
  if (!text) {
    return {};
  }

  try {
    const data = JSON.parse(text);
    return {
      message: typeof data?.message === 'string' ? data.message : data?.error,
    };
  } catch {
    return { message: text };
  }
}

export function mapRetellApiError(status) {
  if (status === 400 || status === 422) {
    return {
      error: 'Retell API error',
      message: 'Retell rejected the web call request. Verify the Retell agent configuration.',
    };
  }

  if (status === 402) {
    return {
      error: 'Retell API error',
      message: 'Retell billing or quota is blocking web call creation.',
    };
  }

  if (status === 404) {
    return {
      error: 'Retell API error',
      message:
        'Retell agent not found. Verify VITE_RETELL_AGENT_ID belongs to the account used by RETELL_API_KEY.',
    };
  }

  return mapProviderError('Retell', status);
}

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
 * Validates the request body for agent_id.
 * @param {Object} body - Request body
 * @returns {{ valid: boolean, agentId?: string, error?: { error: string, message: string } }}
 */
function validateRequestBody(body) {
  const requestBody = body || {};
  const keys = validateAllowedKeys(
    requestBody,
    ['agent_id', 'metadata', 'retell_llm_dynamic_variables'],
    'body'
  );
  if (!keys.valid) {
    return keys;
  }

  const agentId = validateString(requestBody.agent_id, {
    field: 'agent_id',
    required: true,
    maxLength: 128,
    pattern: AGENT_ID_PATTERN,
  });
  if (!agentId.valid) {
    return agentId;
  }

  const metadata = validateOptionalObject(requestBody.metadata, {
    field: 'metadata',
    maxDepth: 3,
    maxKeys: 24,
    maxStringLength: 512,
  });
  if (!metadata.valid) {
    return metadata;
  }

  const dynamicVariables = validateOptionalObject(requestBody.retell_llm_dynamic_variables, {
    field: 'retell_llm_dynamic_variables',
    maxDepth: 3,
    maxKeys: 24,
    maxStringLength: 512,
  });
  if (!dynamicVariables.valid) {
    return dynamicVariables;
  }

  return {
    valid: true,
    agentId: agentId.value,
    metadata: metadata.value,
    retellLlmDynamicVariables: dynamicVariables.value,
  };
}

/**
 * Creates a Retell web call and returns the access_token for frontend SDK connection.
 * The frontend RetellWebClient uses this token to establish the call.
 * @param {string} apiKey - The Retell API key
 * @param {Object} options - Call configuration options
 * @param {string} options.agentId - Required Retell agent ID
 * @param {Object} [options.metadata] - Optional metadata for the call
 * @param {Object} [options.retellLlmDynamicVariables] - Optional dynamic variables
 * @returns {Promise<{ success: boolean, accessToken?: string, callId?: string, error?: { error: string, message: string }, status?: number }>}
 */
async function createRetellWebCall(apiKey, options) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const { agentId, metadata, retellLlmDynamicVariables } = options;
    console.log('[Server] Creating Retell web call for agent:', sanitizeLogInput(agentId));

    // Build request body - agent_id is required
    const requestBody = {
      agent_id: agentId
    };
    if (metadata) {
      requestBody.metadata = metadata;
    }
    if (retellLlmDynamicVariables) {
      requestBody.retell_llm_dynamic_variables = retellLlmDynamicVariables;
    }

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
      const providerError = await readRetellErrorResponse(response);
      const providerMessage = providerError.message
        ? ` - ${sanitizeLogInput(providerError.message)}`
        : '';
      console.error(`[Server] Retell API error: ${response.status}${providerMessage}`);

      return {
        success: false,
        status: response.status,
        error: mapRetellApiError(response.status),
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
        message: 'Failed to create Retell web call'
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
 *   - agent_id: string (required) - Retell agent ID from dashboard
 *   - metadata: object (optional) - Custom metadata for the call
 *   - retell_llm_dynamic_variables: object (optional) - Dynamic variables
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

  // Validate request body
  const bodyValidation = validateRequestBody(req.body);
  if (!bodyValidation.valid) {
    return res.status(400).json(bodyValidation.error);
  }

  // Create Retell web call
  const result = await createRetellWebCall(apiValidation.apiKey, {
    agentId: bodyValidation.agentId,
    metadata: bodyValidation.metadata,
    retellLlmDynamicVariables: bodyValidation.retellLlmDynamicVariables
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
