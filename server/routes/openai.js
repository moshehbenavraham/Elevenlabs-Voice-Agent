import { Router } from 'express';
import {
  validateAllowedKeys,
  validateString,
} from '../utils/security.js';
import { logTranslationLifecycleEvent } from '../utils/observability.js';
import {
  getTranslationSafetyIdentifierHeader,
  resolveTranslationDurationConfig,
  resolveTranslationSafetyIdentifier,
} from '../utils/translationSafety.js';

const router = Router();

// OpenAI Realtime API configuration constants
export const OPENAI_REALTIME_CLIENT_SECRET_URL =
  'https://api.openai.com/v1/realtime/client_secrets';
export const OPENAI_TRANSLATION_CLIENT_SECRET_URL =
  'https://api.openai.com/v1/realtime/translations/client_secrets';
export const OPENAI_TRANSLATION_MODEL = 'gpt-realtime-translate';
const REQUEST_TIMEOUT_MS = 30000;
const OPENAI_API_URL = OPENAI_REALTIME_CLIENT_SECRET_URL;
const TRANSLATION_CLIENT_SECRET_FALLBACK_TTL_SECONDS = 600;
const TARGET_LANGUAGE_PATTERN = /^[A-Za-z]{2}$/;
export const SUPPORTED_TRANSLATION_TARGET_LANGUAGES = Object.freeze([
  'es',
  'pt',
  'fr',
  'ja',
  'ru',
  'zh',
  'de',
  'ko',
  'hi',
  'id',
  'vi',
  'it',
  'en',
]);
const SUPPORTED_TRANSLATION_TARGET_LANGUAGE_SET = new Set(
  SUPPORTED_TRANSLATION_TARGET_LANGUAGES
);

function createTranslationRouteError(error, message, category, code) {
  return {
    error,
    message,
    category,
    code,
  };
}

function mapTranslationValidationError(error) {
  return createTranslationRouteError(
    error.error,
    error.message,
    'validation',
    resolveTranslationValidationCode(error.message)
  );
}

function resolveTranslationValidationCode(message) {
  if (message.includes('is required')) {
    return 'missing-target-language';
  }

  if (message.includes('must be one of')) {
    return 'unsupported-target-language';
  }

  if (message.includes('unsupported field')) {
    return 'unsupported-request-field';
  }

  if (message.includes('must be an object')) {
    return 'invalid-request-body';
  }

  return 'invalid-target-language';
}

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

export function normalizeTranslationTargetLanguage(value) {
  const language = validateString(value, {
    field: 'targetLanguage',
    required: true,
    maxLength: 8,
    pattern: TARGET_LANGUAGE_PATTERN,
  });

  if (!language.valid) {
    return language;
  }

  const targetLanguage = language.value.toLowerCase();
  if (!SUPPORTED_TRANSLATION_TARGET_LANGUAGE_SET.has(targetLanguage)) {
    return {
      valid: false,
      error: {
        error: 'Validation error',
        message: `targetLanguage: must be one of ${SUPPORTED_TRANSLATION_TARGET_LANGUAGES.join(', ')}`,
      },
    };
  }

  return { valid: true, value: targetLanguage };
}

export function validateTranslationSessionRequest(body) {
  const requestBody = body ?? {};
  const keys = validateAllowedKeys(requestBody, ['targetLanguage'], 'body');
  if (!keys.valid) {
    return keys;
  }

  const targetLanguage = normalizeTranslationTargetLanguage(requestBody.targetLanguage);
  if (!targetLanguage.valid) {
    return targetLanguage;
  }

  return { valid: true, targetLanguage: targetLanguage.value };
}

export function buildTranslationClientSecretRequestBody(targetLanguage) {
  return {
    session: {
      model: OPENAI_TRANSLATION_MODEL,
      audio: {
        output: {
          language: targetLanguage,
        },
      },
    },
  };
}

function buildTranslationClientSecretFetchOptions(
  apiKey,
  targetLanguage,
  signal,
  safetyIdentifier
) {
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
  const safetyIdentifierHeader = getTranslationSafetyIdentifierHeader(safetyIdentifier);
  if (safetyIdentifierHeader) {
    headers['OpenAI-Safety-Identifier'] = safetyIdentifierHeader;
  }

  return {
    method: 'POST',
    headers,
    body: JSON.stringify(buildTranslationClientSecretRequestBody(targetLanguage)),
    signal,
  };
}

function formatClientSecretExpiration(expiresAt) {
  if (Number.isFinite(expiresAt)) {
    return new Date(expiresAt * 1000).toISOString();
  }

  if (typeof expiresAt === 'string' && expiresAt.trim().length > 0) {
    const parsed = Number(expiresAt);
    if (Number.isFinite(parsed)) {
      return new Date(parsed * 1000).toISOString();
    }
  }

  return new Date(Date.now() + TRANSLATION_CLIENT_SECRET_FALLBACK_TTL_SECONDS * 1000).toISOString();
}

export function normalizeTranslationClientSecretResponse(data, targetLanguage) {
  let clientSecret;
  if (typeof data?.value === 'string') {
    clientSecret = data.value;
  } else if (typeof data?.client_secret?.value === 'string') {
    clientSecret = data.client_secret.value;
  }

  if (!clientSecret) {
    return {
      success: false,
      status: 502,
      error: createTranslationRouteError(
        'Invalid OpenAI response',
        'Translation client secret not found in response',
        'openai-response',
        'missing-client-secret'
      ),
    };
  }

  const expiresAt = formatClientSecretExpiration(
    data?.expires_at ?? data?.client_secret?.expires_at
  );
  const responseModel =
    typeof data?.session?.model === 'string' && data.session.model.trim().length > 0
      ? data.session.model
      : OPENAI_TRANSLATION_MODEL;

  return {
    success: true,
    clientSecret,
    expiresAt,
    targetLanguage,
    model: responseModel,
  };
}

function mapOpenAITranslationError(status) {
  let message = 'Failed to create OpenAI translation session';
  let category = 'openai-service';
  let code = 'openai-service-error';

  if (status === 401 || status === 403) {
    message = 'Invalid OpenAI API key';
    category = 'openai-auth';
    code = 'openai-auth-failed';
  } else if (status === 429) {
    message = 'OpenAI rate limit exceeded';
    category = 'openai-rate-limit';
    code = 'openai-rate-limited';
  } else if (status >= 500) {
    message = 'OpenAI service temporarily unavailable';
  }

  return createTranslationRouteError('OpenAI API error', message, category, code);
}

async function createTranslationClientSecret(apiKey, targetLanguage, safetyIdentifier) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    console.log('[Server] Requesting OpenAI translation client secret');

    const response = await fetch(
      OPENAI_TRANSLATION_CLIENT_SECRET_URL,
      buildTranslationClientSecretFetchOptions(
        apiKey,
        targetLanguage,
        controller.signal,
        safetyIdentifier
      )
    );

    if (!response.ok) {
      console.error(`[Server] OpenAI translation API error: ${response.status}`);
      return {
        success: false,
        status: response.status,
        error: mapOpenAITranslationError(response.status),
      };
    }

    let data;
    try {
      data = await response.json();
    } catch {
      console.error('[Server] OpenAI translation API returned non-JSON success response');
      return {
        success: false,
        status: 502,
        error: createTranslationRouteError(
          'Invalid OpenAI response',
          'OpenAI translation response was not valid JSON',
          'openai-response',
          'invalid-openai-response-json'
        ),
      };
    }

    const normalized = normalizeTranslationClientSecretResponse(data, targetLanguage);
    if (!normalized.success) {
      console.error('[Server] OpenAI translation response missing client secret');
      return normalized;
    }

    console.log('[Server] OpenAI translation client secret generated successfully');
    return normalized;
  } catch (error) {
    if (error?.name === 'AbortError') {
      console.error('[Server] OpenAI translation API request timed out');
      return {
        success: false,
        status: 504,
        error: createTranslationRouteError(
          'Request timeout',
          'OpenAI translation API request timed out',
          'openai-timeout',
          'openai-request-timeout'
        ),
      };
    }

    console.error('[Server] Error calling OpenAI translation API');
    return {
      success: false,
      status: 500,
      error: createTranslationRouteError(
        'Internal server error',
        'Failed to create OpenAI translation session',
        'network',
        'openai-network-error'
      ),
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

function getRouteElapsedMs(startedAt) {
  return Number(process.hrtime.bigint() - startedAt) / 1_000_000;
}

function readRouteRequestId(req) {
  return (
    req?.requestId ||
    req?.id ||
    req?.headers?.['x-request-id'] ||
    req?.headers?.['x-correlation-id']
  );
}

function recordTranslationLifecycle(req, startedAt, metadata) {
  return logTranslationLifecycleEvent({
    requestId: readRouteRequestId(req),
    elapsedMs: getRouteElapsedMs(startedAt),
    ...metadata,
  });
}

function resolveTranslationFailurePhase(error) {
  switch (error?.category) {
    case 'openai-timeout':
      return 'upstream-timeout';
    case 'openai-response':
      return 'upstream-response-invalid';
    case 'network':
      return 'network-failed';
    default:
      return 'upstream-failed';
  }
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

router.post('/translation-session', async (req, res) => {
  const startedAt = process.hrtime.bigint();
  const durationConfig = resolveTranslationDurationConfig(process.env);
  const safetyIdentifier = resolveTranslationSafetyIdentifier();
  const lifecycleBase = {
    durationConfig,
    safetyIdentifier,
  };
  const requestValidation = validateTranslationSessionRequest(req.body);
  if (!requestValidation.valid) {
    const error = mapTranslationValidationError(requestValidation.error);
    recordTranslationLifecycle(req, startedAt, {
      ...lifecycleBase,
      phase: 'validation-failed',
      result: 'failure',
      targetLanguage: req.body?.targetLanguage,
      statusCategory: error.category,
      statusCode: 400,
      errorCode: error.code,
    });
    return res.status(400).json(error);
  }

  const validation = validateApiKey();
  if (!validation.valid) {
    const error = createTranslationRouteError(
      validation.error.error,
      validation.error.message,
      'server-configuration',
      'missing-openai-api-key'
    );
    recordTranslationLifecycle(req, startedAt, {
      ...lifecycleBase,
      phase: 'configuration-failed',
      result: 'failure',
      targetLanguage: requestValidation.targetLanguage,
      statusCategory: error.category,
      statusCode: 500,
      errorCode: error.code,
    });
    return res.status(500).json(error);
  }

  recordTranslationLifecycle(req, startedAt, {
    ...lifecycleBase,
    phase: 'upstream-request',
    result: 'pending',
    targetLanguage: requestValidation.targetLanguage,
  });

  const result = await createTranslationClientSecret(
    validation.apiKey,
    requestValidation.targetLanguage,
    safetyIdentifier
  );

  if (!result.success) {
    recordTranslationLifecycle(req, startedAt, {
      ...lifecycleBase,
      phase: resolveTranslationFailurePhase(result.error),
      result: 'failure',
      targetLanguage: requestValidation.targetLanguage,
      statusCategory: result.error?.category,
      statusCode: result.status || 500,
      errorCode: result.error?.code,
    });
    return res.status(result.status || 500).json(result.error);
  }

  recordTranslationLifecycle(req, startedAt, {
    ...lifecycleBase,
    phase: 'success',
    result: 'success',
    targetLanguage: result.targetLanguage,
    statusCode: 200,
  });

  res.json({
    clientSecret: result.clientSecret,
    expiresAt: result.expiresAt,
    targetLanguage: result.targetLanguage,
    model: result.model,
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
