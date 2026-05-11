import { Router } from 'express';
import {
  MAX_PROVIDER_STRING_LENGTH,
  mapProviderError,
  validateAllowedKeys,
  validateString,
} from '../utils/security.js';

const router = Router();

// Ultravox API configuration constants
const ULTRAVOX_API_URL = 'https://api.ultravox.ai/api/calls';
const REQUEST_TIMEOUT_MS = 30000;
const VOICE_PATTERN = /^[A-Za-z0-9 ._:-]+$/;
const MODEL_PATTERN = /^[A-Za-z0-9._:-]+$/;

// Default system prompt for Ultravox voice agent
const DEFAULT_SYSTEM_PROMPT = 'You are a helpful voice assistant. Keep responses conversational and concise.';

/**
 * Validates that ULTRAVOX_API_KEY environment variable is configured.
 * @returns {{ valid: boolean, apiKey?: string, error?: { error: string, message: string } }}
 */
function validateApiKey() {
  const apiKey = process.env.ULTRAVOX_API_KEY;
  if (!apiKey) {
    console.error('[Server] ULTRAVOX_API_KEY is not configured');
    return {
      valid: false,
      error: {
        error: 'Server configuration error',
        message: 'Ultravox API key not configured'
      }
    };
  }
  return { valid: true, apiKey };
}

/**
 * Creates an Ultravox call and returns the joinUrl for frontend SDK connection.
 * Ultravox uses a different pattern than OpenAI/xAI - instead of ephemeral tokens,
 * we create a "call" via REST API and get a joinUrl for the WebSocket connection.
 * @param {string} apiKey - The Ultravox API key
 * @param {Object} options - Call configuration options
 * @param {string} options.systemPrompt - System prompt for the voice agent
 * @param {string} [options.voice] - Voice selection (optional)
 * @param {string} [options.model] - Model selection (optional)
 * @returns {Promise<{ success: boolean, callId?: string, joinUrl?: string, error?: { error: string, message: string }, status?: number }>}
 */
async function createUltravoxCall(apiKey, options) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const { systemPrompt, voice, model } = options;
    console.log('[Server] Creating Ultravox call');

    // Build request body - only include optional fields if provided
    const requestBody = {
      systemPrompt: systemPrompt || DEFAULT_SYSTEM_PROMPT
    };
    if (voice) {
      requestBody.voice = voice;
    }
    if (model) {
      requestBody.model = model;
    }

    const response = await fetch(ULTRAVOX_API_URL, {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`[Server] Ultravox API error: ${response.status}`);

      return {
        success: false,
        status: response.status,
        error: mapProviderError('Ultravox', response.status)
      };
    }

    const data = await response.json();

    // Extract callId and joinUrl from response
    const callId = data?.callId;
    const joinUrl = data?.joinUrl;

    if (!joinUrl) {
      console.error('[Server] Ultravox response missing joinUrl. Response keys:', Object.keys(data || {}));
      return {
        success: false,
        status: 500,
        error: {
          error: 'Invalid Ultravox response',
          message: 'joinUrl not found in response'
        }
      };
    }

    console.log('[Server] Ultravox call created successfully');
    return { success: true, callId, joinUrl };

  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      console.error('[Server] Ultravox API request timed out');
      return {
        success: false,
        status: 504,
        error: {
          error: 'Request timeout',
          message: 'Ultravox API request timed out'
        }
      };
    }

    console.error('[Server] Error calling Ultravox API:', error.message);
    return {
      success: false,
      status: 500,
      error: {
        error: 'Internal server error',
        message: 'Failed to create Ultravox call'
      }
    };
  }
}

function validateCallRequest(body) {
  const requestBody = body || {};
  const keys = validateAllowedKeys(requestBody, ['systemPrompt', 'voice', 'model'], 'body');
  if (!keys.valid) {
    return keys;
  }

  const systemPrompt = validateString(requestBody.systemPrompt, {
    field: 'systemPrompt',
    maxLength: MAX_PROVIDER_STRING_LENGTH,
  });
  if (!systemPrompt.valid) {
    return systemPrompt;
  }

  const voice = validateString(requestBody.voice, {
    field: 'voice',
    maxLength: 128,
    pattern: VOICE_PATTERN,
  });
  if (!voice.valid) {
    return voice;
  }

  const model = validateString(requestBody.model, {
    field: 'model',
    maxLength: 128,
    pattern: MODEL_PATTERN,
  });
  if (!model.valid) {
    return model;
  }

  return {
    valid: true,
    options: {
      systemPrompt: systemPrompt.value,
      voice: voice.value,
      model: model.value,
    },
  };
}

/**
 * GET /api/ultravox/health
 * Health check endpoint to verify Ultravox configuration status.
 * Used by frontend to determine if Ultravox tab should be enabled.
 *
 * Response:
 *   - { configured: boolean, provider: string }
 */
router.get('/health', (req, res) => {
  const apiKey = process.env.ULTRAVOX_API_KEY;
  const configured = Boolean(apiKey && apiKey.length > 0);

  res.json({
    configured,
    provider: 'ultravox'
  });
});

/**
 * POST /api/ultravox/call
 * Creates an Ultravox call and returns the joinUrl for WebSocket connection.
 * The frontend ultravox-client SDK uses this joinUrl to connect.
 *
 * Request body (optional):
 *   - systemPrompt: string - System prompt for the voice agent
 *   - voice: string - Voice selection (optional)
 *   - model: string - Model selection (optional)
 *
 * Response:
 *   - Success: { joinUrl: string, callId?: string }
 *   - Error: { error: string, message: string }
 */
router.post('/call', async (req, res) => {
  // Validate API key configuration
  const validation = validateApiKey();
  if (!validation.valid) {
    return res.status(500).json(validation.error);
  }

  const requestValidation = validateCallRequest(req.body);
  if (!requestValidation.valid) {
    return res.status(400).json(requestValidation.error);
  }

  // Create Ultravox call
  const result = await createUltravoxCall(validation.apiKey, requestValidation.options);

  if (!result.success) {
    return res.status(result.status || 500).json(result.error);
  }

  // Return joinUrl (and optionally callId for reference)
  const response = { joinUrl: result.joinUrl };
  if (result.callId) {
    response.callId = result.callId;
  }

  res.json(response);
});

export default router;
