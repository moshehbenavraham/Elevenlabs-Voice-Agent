import pino from 'pino';
import { randomUUID } from 'crypto';
import { sanitizeLogInput } from './sanitize.js';
import {
  TRANSLATION_LIFECYCLE_EVENT,
  buildTranslationLifecycleMetadata,
} from './translationSafety.js';

export const REQUEST_ID_HEADER = 'x-request-id';

const DEFAULT_MAX_LATENCY_SAMPLES = 100;
const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{8,128}$/;
const STATUS_CLASSES = ['1xx', '2xx', '3xx', '4xx', '5xx'];
const RESERVED_COUNT_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
export const TRANSLATION_LIFECYCLE_LOG_FIELDS = [
  'event',
  'phase',
  'result',
  'route',
  'requestId',
  'targetLanguage',
  'statusCategory',
  'statusCode',
  'errorCode',
  'durationConfig',
  'safetyIdentifier',
  'elapsedMs',
];

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';

export const serverLogger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  transport:
    isProduction || isTest
      ? undefined
      : {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

function toBooleanEnv(value, defaultValue) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  return String(value).toLowerCase() !== 'false';
}

export function isRequestLoggingEnabled() {
  return toBooleanEnv(process.env.REQUEST_LOGGING_ENABLED, true);
}

export function isMetricsEnabled() {
  return toBooleanEnv(process.env.METRICS_ENABLED, true);
}

export function normalizeRequestId(value) {
  if (Array.isArray(value)) {
    return normalizeRequestId(value[0]);
  }

  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!REQUEST_ID_PATTERN.test(trimmed)) {
    return null;
  }

  return sanitizeLogInput(trimmed).slice(0, 128);
}

export function createRequestId() {
  return randomUUID();
}

export function resolveRequestId(req) {
  return (
    normalizeRequestId(req?.headers?.[REQUEST_ID_HEADER]) ||
    normalizeRequestId(req?.headers?.['x-correlation-id']) ||
    createRequestId()
  );
}

function firstHeaderValue(value) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function safeString(value, maxLength = 200) {
  if (typeof value !== 'string' || value.length === 0) {
    return undefined;
  }

  return sanitizeLogInput(value).slice(0, maxLength);
}

function safeCountKey(value, fallback = 'unknown', maxLength = 256) {
  const key = safeString(value, maxLength) || fallback;
  return RESERVED_COUNT_KEYS.has(key) ? fallback : key;
}

function safeReferer(value) {
  const raw = firstHeaderValue(value);
  if (typeof raw !== 'string' || raw.length === 0) {
    return undefined;
  }

  try {
    const parsed = new URL(raw, 'http://local.invalid');
    const origin = parsed.origin === 'http://local.invalid' ? '' : parsed.origin;
    return safeString(`${origin}${parsed.pathname}`, 200);
  } catch {
    return safeString(raw.split('?')[0], 200);
  }
}

function safeContentLength(value) {
  const raw = firstHeaderValue(value);
  if (typeof raw !== 'string') {
    return undefined;
  }

  const parsed = Number(raw);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    return undefined;
  }

  return parsed;
}

function getStatusClass(statusCode) {
  const status = Number(statusCode);
  if (!Number.isInteger(status) || status < 100 || status > 599) {
    return 'unknown';
  }

  return `${Math.floor(status / 100)}xx`;
}

function incrementCount(target, key) {
  target.set(key, (target.get(key) || 0) + 1);
}

function sortCountMap(counts) {
  const entries = [...counts.entries()].sort(([left], [right]) => {
    const leftNumber = Number(left);
    const rightNumber = Number(right);

    if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
      return leftNumber - rightNumber;
    }

    return left.localeCompare(right);
  });

  return Object.fromEntries(entries);
}

function percentile(sortedValues, percentileValue) {
  if (sortedValues.length === 0) {
    return 0;
  }

  const index = Math.ceil((percentileValue / 100) * sortedValues.length) - 1;
  return sortedValues[Math.min(Math.max(index, 0), sortedValues.length - 1)];
}

function roundMilliseconds(value) {
  return Math.round(value * 100) / 100;
}

export function getSafeRequestMetadata(req) {
  const headers = req?.headers || {};
  const requestId = req?.requestId || req?.id || normalizeRequestId(headers[REQUEST_ID_HEADER]);
  const path = req?.path || req?.url || '';

  return {
    requestId: normalizeRequestId(requestId) || undefined,
    method: safeString(req?.method, 16),
    path: safeString(path.split('?')[0], 256),
    route: safeString(req?.route?.path || path.split('?')[0], 256),
    client: {
      ip: safeString(req?.ip || req?.socket?.remoteAddress, 120),
      forwardedFor: safeString(firstHeaderValue(headers['x-forwarded-for']), 120),
      protocol: safeString(req?.protocol || firstHeaderValue(headers['x-forwarded-proto']), 20),
      host: safeString(firstHeaderValue(headers.host), 120),
      userAgent: safeString(firstHeaderValue(headers['user-agent']), 200),
      origin: safeString(firstHeaderValue(headers.origin), 200),
      referer: safeReferer(headers.referer || headers.referrer),
      contentType: safeString(firstHeaderValue(headers['content-type']), 120),
      contentLength: safeContentLength(headers['content-length']),
    },
  };
}

export function createTranslationLifecycleLogRecord(input = {}) {
  const metadata = buildTranslationLifecycleMetadata(input);

  return TRANSLATION_LIFECYCLE_LOG_FIELDS.reduce((record, field) => {
    if (metadata[field] !== undefined) {
      record[field] = metadata[field];
    }
    return record;
  }, {});
}

export function logTranslationLifecycleEvent(input = {}, options = {}) {
  const logger = options.logger || serverLogger;
  const record = createTranslationLifecycleLogRecord(input);
  const message = TRANSLATION_LIFECYCLE_EVENT;
  const statusCode = Number(record.statusCode || 0);

  if (statusCode >= 500) {
    logger.error(record, message);
    return record;
  }

  if (record.result === 'failure') {
    logger.warn(record, message);
    return record;
  }

  logger.info(record, message);
  return record;
}

export function createRequestMetrics(options = {}) {
  const maxLatencySamples = Math.max(
    1,
    Number.isInteger(options.maxLatencySamples)
      ? options.maxLatencySamples
      : DEFAULT_MAX_LATENCY_SAMPLES
  );

  const state = {
    startedAt: new Date(),
    totalRequests: 0,
    errorRequests: 0,
    clientErrorRequests: 0,
    serverErrorRequests: 0,
    inFlightRequests: 0,
    statusCounts: new Map(),
    statusClassCounts: new Map(STATUS_CLASSES.map((key) => [key, 0])),
    methodCounts: new Map(),
    routeCounts: new Map(),
    latencySamplesMs: [],
    latencyTotalMs: 0,
    latencyMinMs: null,
    latencyMaxMs: null,
    lastRequestAt: null,
  };

  function recordRequest(result) {
    const statusCode = Number(result?.statusCode || 0);
    const durationMs = Math.max(0, Number(result?.durationMs || 0));
    const method = safeCountKey(result?.method, 'UNKNOWN', 16);
    const route = safeCountKey(result?.route || result?.path, 'unknown', 256);
    const statusKey = Number.isInteger(statusCode) ? String(statusCode) : 'unknown';
    const statusClass = getStatusClass(statusCode);

    state.totalRequests += 1;
    state.lastRequestAt = new Date();
    incrementCount(state.statusCounts, statusKey);
    if (statusClass !== 'unknown') {
      incrementCount(state.statusClassCounts, statusClass);
    }
    incrementCount(state.methodCounts, method);
    incrementCount(state.routeCounts, route);

    if (statusCode >= 400) {
      state.errorRequests += 1;
    }
    if (statusCode >= 400 && statusCode < 500) {
      state.clientErrorRequests += 1;
    }
    if (statusCode >= 500) {
      state.serverErrorRequests += 1;
    }

    state.latencyTotalMs += durationMs;
    state.latencyMinMs =
      state.latencyMinMs === null ? durationMs : Math.min(state.latencyMinMs, durationMs);
    state.latencyMaxMs =
      state.latencyMaxMs === null ? durationMs : Math.max(state.latencyMaxMs, durationMs);
    state.latencySamplesMs.push(durationMs);
    if (state.latencySamplesMs.length > maxLatencySamples) {
      state.latencySamplesMs.shift();
    }
  }

  function incrementInFlight() {
    state.inFlightRequests += 1;
  }

  function decrementInFlight() {
    state.inFlightRequests = Math.max(0, state.inFlightRequests - 1);
  }

  function reset() {
    state.startedAt = new Date();
    state.totalRequests = 0;
    state.errorRequests = 0;
    state.clientErrorRequests = 0;
    state.serverErrorRequests = 0;
    state.inFlightRequests = 0;
    state.statusCounts = new Map();
    state.statusClassCounts = new Map(STATUS_CLASSES.map((key) => [key, 0]));
    state.methodCounts = new Map();
    state.routeCounts = new Map();
    state.latencySamplesMs = [];
    state.latencyTotalMs = 0;
    state.latencyMinMs = null;
    state.latencyMaxMs = null;
    state.lastRequestAt = null;
  }

  function getSnapshot(options = {}) {
    const includeRoutes = options.includeRoutes === true;
    const now = new Date();
    const sortedSamples = [...state.latencySamplesMs].sort((left, right) => left - right);
    const latencyCount = state.totalRequests;

    const snapshot = {
      generatedAt: now.toISOString(),
      startedAt: state.startedAt.toISOString(),
      uptimeSeconds: Math.floor((now.getTime() - state.startedAt.getTime()) / 1000),
      requests: {
        total: state.totalRequests,
        inFlight: state.inFlightRequests,
        errors: {
          total: state.errorRequests,
          client: state.clientErrorRequests,
          server: state.serverErrorRequests,
        },
        byStatusCode: sortCountMap(state.statusCounts),
        byStatusClass: sortCountMap(state.statusClassCounts),
        byMethod: sortCountMap(state.methodCounts),
      },
      latencyMs: {
        count: latencyCount,
        sampleCount: state.latencySamplesMs.length,
        min: state.latencyMinMs === null ? 0 : roundMilliseconds(state.latencyMinMs),
        max: state.latencyMaxMs === null ? 0 : roundMilliseconds(state.latencyMaxMs),
        average: latencyCount === 0 ? 0 : roundMilliseconds(state.latencyTotalMs / latencyCount),
        p50: roundMilliseconds(percentile(sortedSamples, 50)),
        p95: roundMilliseconds(percentile(sortedSamples, 95)),
        sampleLimit: maxLatencySamples,
      },
      lastRequestAt: state.lastRequestAt ? state.lastRequestAt.toISOString() : null,
    };

    if (includeRoutes) {
      snapshot.requests.byRoute = sortCountMap(state.routeCounts);
    }

    return snapshot;
  }

  return {
    recordRequest,
    incrementInFlight,
    decrementInFlight,
    reset,
    getSnapshot,
  };
}

export const requestMetrics = createRequestMetrics();

export function createRequestLoggingMiddleware(options = {}) {
  const logger = options.logger || serverLogger;
  const metrics = options.metrics || requestMetrics;
  const shouldLog = options.logEnabled ?? isRequestLoggingEnabled();
  const shouldRecordMetrics = options.metricsEnabled ?? isMetricsEnabled();

  return function requestLoggingMiddleware(req, res, next) {
    const requestId = resolveRequestId(req);
    const start = process.hrtime.bigint();
    let completed = false;

    req.requestId = requestId;
    req.id = requestId;
    res.setHeader(REQUEST_ID_HEADER, requestId);

    if (shouldRecordMetrics) {
      metrics.incrementInFlight();
    }

    const cleanup = () => {
      res.removeListener('finish', onFinish);
      res.removeListener('close', onClose);
    };

    const complete = (eventName) => {
      if (completed) {
        return;
      }

      completed = true;
      cleanup();

      const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
      const statusCode = eventName === 'close' && !res.writableEnded ? 499 : res.statusCode;
      const metadata = getSafeRequestMetadata(req);
      const record = {
        requestId,
        method: metadata.method,
        path: metadata.path,
        route: metadata.route,
        statusCode,
        durationMs: roundMilliseconds(durationMs),
        completedBy: eventName,
        client: metadata.client,
      };

      if (shouldRecordMetrics) {
        try {
          metrics.recordRequest(record);
        } finally {
          metrics.decrementInFlight();
        }
      }

      if (shouldLog) {
        const message = statusCode >= 500 ? 'api request failed' : 'api request completed';
        if (statusCode >= 500) {
          logger.error(record, message);
        } else if (statusCode >= 400) {
          logger.warn(record, message);
        } else {
          logger.info(record, message);
        }
      }
    };

    function onFinish() {
      complete('finish');
    }

    function onClose() {
      complete('close');
    }

    res.once('finish', onFinish);
    res.once('close', onClose);

    next();
  };
}
