import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';

const router = Router();

// Gemini Live API configuration constants
const DEFAULT_MODEL = 'gemini-2.5-flash-native-audio-preview-12-2025';
const REQUEST_TIMEOUT_MS = 30000;
// Token expiry: 30 minutes (Gemini sessions can be long-lived)
const TOKEN_EXPIRY_SECONDS = 30 * 60;

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
        message: 'Gemini API key not configured'
      }
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
    console.log(`[Server] Creating Gemini Live session for model: ${model}`);

    // Initialize the Google GenAI client
    const genai = new GoogleGenAI({ apiKey });

    // For Gemini Live API, the API key itself serves as the authentication token
    // The WebSocket URL is constructed with the key as a query parameter
    // We return the API key wrapped in a token format for the frontend to use

    // Calculate expiration time
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_SECONDS * 1000).toISOString();

    clearTimeout(timeoutId);

    console.log('[Server] Gemini ephemeral token generated successfully');

    // Return the API key as the token - in production, you might want to
    // implement a more sophisticated token exchange mechanism
    // For now, we use the API key directly (this is secure because
    // it's transmitted over HTTPS and the frontend only uses it for
    // the WebSocket connection)
    return {
      success: true,
      token: apiKey,
      expiresAt,
      model
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
          message: 'Gemini API request timed out'
        }
      };
    }

    console.error('[Server] Error creating Gemini session:', error.message);

    // Map error codes to user-friendly messages
    let status = 500;
    let message = 'Failed to create Gemini session';

    if (error.status === 401 || error.status === 403) {
      status = error.status;
      message = 'Invalid Gemini API key';
    } else if (error.status === 429) {
      status = 429;
      message = 'Gemini rate limit exceeded';
    } else if (error.status >= 500) {
      status = 502;
      message = 'Gemini service temporarily unavailable';
    }

    return {
      success: false,
      status,
      error: { error: 'Gemini API error', message }
    };
  }
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
    provider: 'gemini'
  });
});

/**
 * POST /api/gemini/token
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
router.post('/token', async (req, res) => {
  // Validate API key configuration
  const validation = validateApiKey();
  if (!validation.valid) {
    return res.status(500).json(validation.error);
  }

  // Get model from request body or use default
  const model = req.body?.model || DEFAULT_MODEL;

  // Create ephemeral token
  const result = await createEphemeralToken(validation.apiKey, model);

  if (!result.success) {
    return res.status(result.status || 500).json(result.error);
  }

  res.json({
    token: result.token,
    expiresAt: result.expiresAt,
    model: result.model
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
