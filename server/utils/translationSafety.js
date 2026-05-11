import { sanitizeLogInput } from './sanitize.js';

export const TRANSLATION_DURATION_CONFIG_ENV_VAR =
  'VITE_OPENAI_TRANSLATION_MAX_SESSION_MINUTES';
export const TRANSLATION_DEFAULT_MAX_SESSION_MINUTES = 30;
export const TRANSLATION_HARD_MAX_SESSION_MINUTES = 120;
export const TRANSLATION_SESSION_ROUTE = '/api/openai/translation-session';
export const TRANSLATION_LIFECYCLE_EVENT = 'openai.translation.lifecycle';

const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{8,128}$/;
const TARGET_LANGUAGE_PATTERN = /^[a-z]{2}$/;
const SAFE_CODE_PATTERN = /^[a-z0-9._:-]{1,80}$/;
const SAFE_IDENTIFIER_PATTERN = /^[A-Za-z0-9._:-]{8,128}$/;
const DURATION_CONFIG_SOURCES = new Set(['default', 'configured', 'capped']);
const LIFECYCLE_PHASES = new Set([
  'validation-failed',
  'configuration-failed',
  'upstream-request',
  'upstream-failed',
  'upstream-timeout',
  'upstream-response-invalid',
  'network-failed',
  'success',
]);
const LIFECYCLE_RESULTS = new Set(['pending', 'success', 'failure']);
const LIFECYCLE_STATUS_CATEGORIES = new Set([
  'validation',
  'server-configuration',
  'openai-auth',
  'openai-rate-limit',
  'openai-service',
  'openai-timeout',
  'openai-response',
  'network',
  'unknown',
]);
const SAFETY_IDENTIFIER_STATUSES = new Set(['provided', 'deferred', 'rejected']);

export function normalizeTranslationMaxSessionConfig(value) {
  const parsedMinutes = coerceFiniteNumber(value);

  if (parsedMinutes === null || parsedMinutes <= 0) {
    return buildTranslationMaxSessionConfig(
      TRANSLATION_DEFAULT_MAX_SESSION_MINUTES,
      'default'
    );
  }

  if (parsedMinutes > TRANSLATION_HARD_MAX_SESSION_MINUTES) {
    return buildTranslationMaxSessionConfig(
      TRANSLATION_HARD_MAX_SESSION_MINUTES,
      'capped'
    );
  }

  return buildTranslationMaxSessionConfig(parsedMinutes, 'configured');
}

export function resolveTranslationDurationConfig(env = {}) {
  return normalizeTranslationMaxSessionConfig(env[TRANSLATION_DURATION_CONFIG_ENV_VAR]);
}

export function resolveTranslationSafetyIdentifier(value) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return {
      status: 'deferred',
      reason: 'no-stable-non-pii-app-identifier',
    };
  }

  const normalized = sanitizeLogInput(value.trim()).slice(0, 128);
  if (!SAFE_IDENTIFIER_PATTERN.test(normalized)) {
    return {
      status: 'rejected',
      reason: 'invalid-safety-identifier',
    };
  }

  return {
    status: 'provided',
    value: normalized,
  };
}

export function getTranslationSafetyIdentifierHeader(safetyIdentifier) {
  return safetyIdentifier?.status === 'provided' ? safetyIdentifier.value : null;
}

export function buildTranslationLifecycleMetadata(input = {}) {
  return compactRecord({
    event: TRANSLATION_LIFECYCLE_EVENT,
    phase: normalizeSetValue(input.phase, LIFECYCLE_PHASES, 'unknown'),
    result: normalizeSetValue(input.result, LIFECYCLE_RESULTS, 'failure'),
    route: TRANSLATION_SESSION_ROUTE,
    requestId: normalizeRequestId(input.requestId),
    targetLanguage: normalizeTargetLanguage(input.targetLanguage),
    statusCategory: normalizeSetValue(
      input.statusCategory,
      LIFECYCLE_STATUS_CATEGORIES,
      'unknown'
    ),
    statusCode: normalizeStatusCode(input.statusCode),
    errorCode: normalizeSafeCode(input.errorCode),
    durationConfig: normalizeDurationConfigRecord(input.durationConfig),
    safetyIdentifier: normalizeSafetyIdentifierRecord(input.safetyIdentifier),
    elapsedMs: normalizeElapsedMs(input.elapsedMs),
  });
}

function buildTranslationMaxSessionConfig(minutes, source) {
  const maxSeconds = Math.max(1, Math.round(minutes * 60));

  return {
    maxMinutes: roundMinutes(maxSeconds / 60),
    maxSeconds,
    defaultMinutes: TRANSLATION_DEFAULT_MAX_SESSION_MINUTES,
    hardMaxMinutes: TRANSLATION_HARD_MAX_SESSION_MINUTES,
    source,
  };
}

function normalizeDurationConfigRecord(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return normalizeTranslationMaxSessionConfig(undefined);
  }

  const source = DURATION_CONFIG_SOURCES.has(value.source) ? value.source : 'default';
  const maxSeconds = coerceSafeInteger(value.maxSeconds);
  const maxMinutes = coerceFiniteNumber(value.maxMinutes);
  const normalized =
    maxSeconds !== null
      ? buildTranslationMaxSessionConfig(maxSeconds / 60, source)
      : normalizeTranslationMaxSessionConfig(maxMinutes);

  return {
    maxMinutes: normalized.maxMinutes,
    maxSeconds: normalized.maxSeconds,
    defaultMinutes: TRANSLATION_DEFAULT_MAX_SESSION_MINUTES,
    hardMaxMinutes: TRANSLATION_HARD_MAX_SESSION_MINUTES,
    source,
  };
}

function normalizeSafetyIdentifierRecord(value) {
  const resolved =
    value && typeof value === 'object' && !Array.isArray(value)
      ? value
      : resolveTranslationSafetyIdentifier(undefined);
  const status = SAFETY_IDENTIFIER_STATUSES.has(resolved.status) ? resolved.status : 'deferred';

  return compactRecord({
    status,
    reason: normalizeSafeCode(resolved.reason),
  });
}

function normalizeRequestId(value) {
  if (Array.isArray(value)) {
    return normalizeRequestId(value[0]);
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = sanitizeLogInput(value.trim()).slice(0, 128);
  return REQUEST_ID_PATTERN.test(normalized) ? normalized : undefined;
}

function normalizeTargetLanguage(value) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = sanitizeLogInput(value.trim().toLowerCase()).slice(0, 8);
  return TARGET_LANGUAGE_PATTERN.test(normalized) ? normalized : undefined;
}

function normalizeStatusCode(value) {
  const parsed = coerceSafeInteger(value);
  return parsed !== null && parsed >= 100 && parsed <= 599 ? parsed : undefined;
}

function normalizeSafeCode(value) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = sanitizeLogInput(value.trim().toLowerCase()).slice(0, 80);
  return SAFE_CODE_PATTERN.test(normalized) ? normalized : undefined;
}

function normalizeSetValue(value, allowedValues, fallback) {
  return typeof value === 'string' && allowedValues.has(value) ? value : fallback;
}

function normalizeElapsedMs(value) {
  const parsed = coerceFiniteNumber(value);
  return parsed === null ? undefined : Math.max(0, Math.round(parsed * 100) / 100);
}

function coerceFiniteNumber(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return null;
    }

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function coerceSafeInteger(value) {
  const parsed = coerceFiniteNumber(value);
  if (parsed === null) {
    return null;
  }

  const rounded = Math.round(parsed);
  return Number.isSafeInteger(rounded) ? rounded : null;
}

function roundMinutes(value) {
  return Number(value.toFixed(2));
}

function compactRecord(record) {
  return Object.entries(record).reduce((result, [key, value]) => {
    if (value !== undefined) {
      result[key] = value;
    }
    return result;
  }, {});
}
