export const DEFAULT_DEV_ORIGIN = 'http://localhost:8082';
export const DEFAULT_JSON_BODY_LIMIT = '128kb';
export const MAX_PROVIDER_STRING_LENGTH = 4096;
export const MAX_SMALL_STRING_LENGTH = 256;
export const MAX_OBJECT_KEYS = 32;
export const MAX_OBJECT_DEPTH = 4;
export const OPENAI_TRANSLATION_TOKEN_ENDPOINT_PATH = '/api/openai/translation-session';
export const TOKEN_ENDPOINT_PATHS = [
  '/api/openai/session',
  OPENAI_TRANSLATION_TOKEN_ENDPOINT_PATH,
  '/api/xai/session',
  '/api/elevenlabs/signed-url',
  '/api/ultravox/call',
  '/api/retell/create-web-call',
  '/api/gemini/session',
];

const LOCALHOST_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1']);

export function isProductionEnv(nodeEnv = process.env.NODE_ENV) {
  return nodeEnv === 'production';
}

export function getJsonBodyLimit(env = process.env) {
  const configured = env.JSON_BODY_LIMIT;
  if (typeof configured === 'string' && configured.trim().length > 0) {
    return configured.trim();
  }

  return DEFAULT_JSON_BODY_LIMIT;
}

export function normalizeOrigin(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed === '*') {
    return trimmed || null;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.origin;
  } catch {
    return null;
  }
}

function isLocalhostOrigin(origin) {
  try {
    const parsed = new URL(origin);
    return LOCALHOST_HOSTNAMES.has(parsed.hostname);
  } catch {
    return false;
  }
}

export function parseAllowedOrigins(value, options = {}) {
  const isProduction = Boolean(options.isProduction);
  const rawValue = typeof value === 'string' ? value : '';
  const configured = rawValue.trim().length > 0;
  const input = configured ? rawValue : isProduction ? '' : DEFAULT_DEV_ORIGIN;
  const entries = input
    .split(',')
    .map(entry => entry.trim())
    .filter(Boolean);
  const origins = [];
  const invalid = [];
  let hasWildcard = false;

  for (const entry of entries) {
    const normalized = normalizeOrigin(entry);
    if (normalized === '*') {
      hasWildcard = true;
      continue;
    }

    if (!normalized) {
      invalid.push(entry);
      continue;
    }

    if (!origins.includes(normalized)) {
      origins.push(normalized);
    }
  }

  return {
    configured,
    usingFallback: !configured && !isProduction,
    raw: rawValue,
    origins,
    invalid,
    hasWildcard,
  };
}

export function validateProductionSecurityConfig(options = {}) {
  const isProduction = Boolean(options.isProduction ?? isProductionEnv(options.nodeEnv));
  const allowLocalhostProductionOrigins = Boolean(options.allowLocalhostProductionOrigins);
  const parsedOrigins = parseAllowedOrigins(options.corsOrigin, { isProduction });
  const issues = [];
  const warnings = [];

  if (parsedOrigins.invalid.length > 0) {
    issues.push(`Invalid CORS origin value: ${parsedOrigins.invalid[0]}`);
  }

  if (isProduction && !parsedOrigins.configured) {
    issues.push('CORS_ORIGIN is required when NODE_ENV=production.');
  }

  if (isProduction && parsedOrigins.hasWildcard) {
    issues.push('CORS_ORIGIN=* is not allowed when NODE_ENV=production.');
  }

  if (isProduction && parsedOrigins.origins.length === 0) {
    issues.push('At least one exact production CORS origin is required.');
  }

  if (
    isProduction &&
    parsedOrigins.origins.length > 0 &&
    parsedOrigins.origins.every(origin => isLocalhostOrigin(origin))
  ) {
    if (allowLocalhostProductionOrigins) {
      warnings.push(
        'Localhost-only production CORS origins are allowed only for local Docker smoke tests.'
      );
    } else {
      issues.push('Production CORS origins cannot be localhost-only.');
    }
  }

  if (!isProduction && parsedOrigins.hasWildcard) {
    warnings.push('Wildcard CORS is allowed only outside production.');
  }

  if (!isProduction && parsedOrigins.usingFallback) {
    warnings.push(`CORS_ORIGIN is unset; using development fallback ${DEFAULT_DEV_ORIGIN}.`);
  }

  return {
    ok: issues.length === 0,
    isProduction,
    isDemoMode: Boolean(options.isDemoMode),
    origins: parsedOrigins.origins,
    hasWildcard: parsedOrigins.hasWildcard,
    usingFallback: parsedOrigins.usingFallback,
    allowLocalhostProductionOrigins,
    issues,
    warnings,
  };
}

export function isOriginAllowed(origin, securityConfig) {
  if (!origin) {
    return true;
  }

  const normalized = normalizeOrigin(origin);
  if (!normalized || normalized === '*') {
    return false;
  }

  if (!securityConfig?.isProduction && securityConfig?.hasWildcard) {
    return true;
  }

  return Array.isArray(securityConfig?.origins) && securityConfig.origins.includes(normalized);
}

export function createCorsOriginDelegate(securityConfig) {
  return function corsOriginDelegate(origin, callback) {
    if (!securityConfig?.ok && securityConfig?.isProduction) {
      callback(null, false);
      return;
    }

    callback(null, isOriginAllowed(origin, securityConfig));
  };
}

export function buildContentSecurityPolicy() {
  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data: https://unpkg.com https://c.daily.co",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com https://frontend-cdn.perplexity.ai",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob: data:",
    "worker-src 'self' blob: data:",
    [
      "connect-src 'self'",
      'http://localhost:3001',
      'http://localhost:8082',
      'https://*.ngrok.io',
      'https://*.ngrok-free.app',
      'https://api.elevenlabs.io',
      'wss://api.elevenlabs.io',
      'https://*.elevenlabs.io',
      'wss://*.elevenlabs.io',
      'https://api.x.ai',
      'wss://api.x.ai',
      'https://api.openai.com',
      'wss://api.openai.com',
      'https://api.ultravox.ai',
      'wss://voice.ultravox.ai',
      'https://*.livekit.cloud',
      'wss://*.livekit.cloud',
      'https://*.livekit.io',
      'wss://*.livekit.io',
      'https://api.vapi.ai',
      'wss://api.vapi.ai',
      'https://*.vapi.ai',
      'wss://*.vapi.ai',
      'https://*.daily.co',
      'wss://*.daily.co',
      'https://*.pipecdn.app',
      'wss://*.pipecdn.app',
      'https://*.wss.daily.co',
      'wss://*.wss.daily.co',
      'https://generativelanguage.googleapis.com',
      'wss://generativelanguage.googleapis.com',
    ].join(' '),
  ];

  return directives.join('; ');
}

export function getSecurityHeaderValues(options = {}) {
  const headers = {
    'Content-Security-Policy': buildContentSecurityPolicy(),
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'microphone=(self), camera=(), geolocation=(), payment=(), usb=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
  };

  if (Boolean(options.isProduction)) {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
  }

  return headers;
}

export function createSecurityHeadersMiddleware(options = {}) {
  const headers = getSecurityHeaderValues(options);

  return function securityHeadersMiddleware(_req, res, next) {
    for (const [name, value] of Object.entries(headers)) {
      res.setHeader(name, value);
    }
    next();
  };
}

export function createJsonErrorHandler() {
  return function jsonErrorHandler(error, req, res, next) {
    if (!error) {
      next();
      return;
    }

    if (error.type === 'entity.too.large') {
      res.status(413).json({
        requestId: req.requestId,
        error: 'Payload too large',
        message: 'Request body exceeds the configured size limit.',
      });
      return;
    }

    if (error instanceof SyntaxError || error.type === 'entity.parse.failed') {
      res.status(400).json({
        requestId: req.requestId,
        error: 'Malformed JSON',
        message: 'Request body must be valid JSON.',
      });
      return;
    }

    next(error);
  };
}

export function createInFlightRequestGuard(options = {}) {
  const inFlight = new Map();
  const timeoutMs = Number.isInteger(options.timeoutMs) ? options.timeoutMs : 45000;

  return function inFlightRequestGuard(req, res, next) {
    const key = [
      req.method,
      req.originalUrl || req.baseUrl || req.path,
      req.ip || req.socket?.remoteAddress || 'unknown',
    ].join(' ');

    if (inFlight.has(key)) {
      res.status(409).json({
        requestId: req.requestId,
        error: 'Duplicate request',
        message: 'A matching token request is already in flight. Please wait for it to complete.',
      });
      return;
    }

    const cleanup = () => {
      const timeout = inFlight.get(key);
      if (timeout) {
        clearTimeout(timeout);
        inFlight.delete(key);
      }
    };
    const timeout = setTimeout(cleanup, timeoutMs);

    inFlight.set(key, timeout);
    res.once('finish', cleanup);
    res.once('close', cleanup);
    next();
  };
}

export function createValidationError(message, field) {
  return {
    valid: false,
    error: {
      error: 'Validation error',
      message: field ? `${field}: ${message}` : message,
    },
  };
}

export function createValidationSuccess(value) {
  return { valid: true, value };
}

export function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function validateAllowedKeys(value, allowedKeys, field = 'body') {
  if (!isPlainObject(value)) {
    return createValidationError('must be an object', field);
  }

  const allowed = new Set(allowedKeys);
  const unknownKey = Object.keys(value).find(key => !allowed.has(key));
  if (unknownKey) {
    return createValidationError(`unsupported field "${unknownKey}"`, field);
  }

  return createValidationSuccess(value);
}

export function validateString(value, options = {}) {
  const field = options.field || 'value';
  const required = Boolean(options.required);
  const maxLength = Number.isInteger(options.maxLength)
    ? options.maxLength
    : MAX_SMALL_STRING_LENGTH;
  const minLength = Number.isInteger(options.minLength) ? options.minLength : 0;

  if (value === undefined || value === null) {
    if (required) {
      return createValidationError('is required', field);
    }
    return createValidationSuccess(options.defaultValue);
  }

  if (typeof value !== 'string') {
    return createValidationError('must be a string', field);
  }

  const trimmed = options.trim === false ? value : value.trim();
  if (required && trimmed.length === 0) {
    return createValidationError('is required', field);
  }

  if (trimmed.length < minLength) {
    return createValidationError(`must be at least ${minLength} characters`, field);
  }

  if (trimmed.length > maxLength) {
    return createValidationError(`must be no more than ${maxLength} characters`, field);
  }

  if (options.pattern && !options.pattern.test(trimmed)) {
    return createValidationError('contains unsupported characters', field);
  }

  return createValidationSuccess(trimmed);
}

export function validateInteger(value, options = {}) {
  const field = options.field || 'value';
  const required = Boolean(options.required);

  if (value === undefined || value === null) {
    if (required) {
      return createValidationError('is required', field);
    }
    return createValidationSuccess(options.defaultValue);
  }

  if (!Number.isInteger(value)) {
    return createValidationError('must be an integer', field);
  }

  if (Number.isInteger(options.min) && value < options.min) {
    return createValidationError(`must be at least ${options.min}`, field);
  }

  if (Number.isInteger(options.max) && value > options.max) {
    return createValidationError(`must be no more than ${options.max}`, field);
  }

  return createValidationSuccess(value);
}

export function validateJsonValueBounds(value, options = {}, depth = 0, path = options.field || 'value') {
  const maxDepth = Number.isInteger(options.maxDepth) ? options.maxDepth : MAX_OBJECT_DEPTH;
  const maxKeys = Number.isInteger(options.maxKeys) ? options.maxKeys : MAX_OBJECT_KEYS;
  const maxStringLength = Number.isInteger(options.maxStringLength)
    ? options.maxStringLength
    : MAX_SMALL_STRING_LENGTH;

  if (depth > maxDepth) {
    return createValidationError(`exceeds maximum depth ${maxDepth}`, path);
  }

  if (
    value === null ||
    typeof value === 'boolean' ||
    typeof value === 'number'
  ) {
    if (typeof value === 'number' && !Number.isFinite(value)) {
      return createValidationError('must be a finite number', path);
    }
    return createValidationSuccess(value);
  }

  if (typeof value === 'string') {
    if (value.length > maxStringLength) {
      return createValidationError(`must be no more than ${maxStringLength} characters`, path);
    }
    return createValidationSuccess(value);
  }

  if (Array.isArray(value)) {
    if (value.length > maxKeys) {
      return createValidationError(`must contain no more than ${maxKeys} items`, path);
    }

    for (let index = 0; index < value.length; index += 1) {
      const child = validateJsonValueBounds(
        value[index],
        options,
        depth + 1,
        `${path}[${index}]`
      );
      if (!child.valid) {
        return child;
      }
    }
    return createValidationSuccess(value);
  }

  if (!isPlainObject(value)) {
    return createValidationError('must be a JSON-compatible value', path);
  }

  const keys = Object.keys(value);
  if (keys.length > maxKeys) {
    return createValidationError(`must contain no more than ${maxKeys} keys`, path);
  }

  if (Array.isArray(options.allowedKeys)) {
    const allowed = new Set(options.allowedKeys);
    const unknownKey = keys.find(key => !allowed.has(key));
    if (unknownKey) {
      return createValidationError(`unsupported field "${unknownKey}"`, path);
    }
  }

  for (const key of keys) {
    const child = validateJsonValueBounds(value[key], options, depth + 1, `${path}.${key}`);
    if (!child.valid) {
      return child;
    }
  }

  return createValidationSuccess(value);
}

export function validateOptionalObject(value, options = {}) {
  const field = options.field || 'value';
  if (value === undefined || value === null) {
    return createValidationSuccess(undefined);
  }

  if (!isPlainObject(value)) {
    return createValidationError('must be an object', field);
  }

  return validateJsonValueBounds(value, options, 0, field);
}

export function mapProviderError(provider, status) {
  let message = `Failed to create ${provider} session`;
  if (status === 401 || status === 403) {
    message = `Invalid ${provider} API key`;
  } else if (status === 429) {
    message = `${provider} rate limit exceeded`;
  } else if (status >= 500) {
    message = `${provider} service temporarily unavailable`;
  }

  return {
    error: `${provider} API error`,
    message,
  };
}

export function getGeminiBrowserTokenPolicy(options = {}) {
  const isProduction = Boolean(options.isProduction ?? isProductionEnv(options.nodeEnv));
  if (isProduction) {
    return {
      canReturnRawApiKey: false,
      status: 'blocked-in-production',
      message: 'Gemini Live browser sessions require a browser-safe token exchange in production.',
    };
  }

  return {
    canReturnRawApiKey: true,
    status: 'development-compatibility',
    message: 'Raw Gemini API key return is allowed only outside production for local compatibility.',
  };
}

export function getSecurityPosture(options = {}) {
  const securityConfig = options.securityConfig || validateProductionSecurityConfig(options);
  const isProduction = Boolean(options.isProduction ?? securityConfig.isProduction);
  const headers = getSecurityHeaderValues({ isProduction });

  return {
    cors: {
      mode: isProduction ? 'production-exact-origin' : 'development',
      configuredOrigins: securityConfig.origins,
      allowNoOriginRequests: true,
      wildcardConfigured: securityConfig.hasWildcard,
      usingDevelopmentFallback: securityConfig.usingFallback,
      localhostProductionOriginsAllowed: Boolean(securityConfig.allowLocalhostProductionOrigins),
      unsafeProductionConfig: isProduction && !securityConfig.ok,
      issues: securityConfig.issues,
      warnings: securityConfig.warnings,
    },
    headers: {
      enabled: true,
      names: Object.keys(headers),
      hsts: isProduction,
      csp: true,
      frameProtection: true,
      noSniff: true,
      referrerPolicy: true,
      permissionsPolicy: true,
    },
    bodyParsing: {
      jsonLimit: options.jsonBodyLimit || getJsonBodyLimit(),
      malformedJsonHandled: true,
    },
    rateLimiting: {
      enabled: true,
      api: { windowMs: 900000, max: 100 },
      tokens: { windowMs: 60000, max: 10, routes: TOKEN_ENDPOINT_PATHS },
      duplicateInFlightGuard: true,
    },
    demoMode: {
      enabled: Boolean(options.isDemoMode),
      separatedFromProductionFallback: true,
    },
    secrets: {
      providerKeysReturnedToBrowser: false,
      geminiBrowserTokenPolicy: getGeminiBrowserTokenPolicy({ isProduction }).status,
    },
  };
}
