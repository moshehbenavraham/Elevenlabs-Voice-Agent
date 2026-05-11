#!/usr/bin/env node

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_HEALTH_PATH = '/api/health';
const DEFAULT_METRICS_PATH = '/api/metrics';
const USER_AGENT = 'voice-agent-production-verifier/1.0';

function printUsage() {
  console.log(`Usage: node scripts/deploy/verify-production.mjs --url <origin> [options]

Options:
  --url <url>              Production origin, or a direct /api/health URL.
  --timeout <ms>           Per-request timeout in milliseconds. Default: ${DEFAULT_TIMEOUT_MS}.
  --health-path <path>     Health endpoint path. Default: ${DEFAULT_HEALTH_PATH}.
  --metrics-path <path>    Metrics endpoint path. Default: ${DEFAULT_METRICS_PATH}.
  --skip-root              Skip the root page HTML check.
  --skip-metrics           Skip the metrics endpoint check.
  --skip-security          Skip security header and posture checks.
  --skip-cors              Skip CORS allowed/rejected origin checks.
  --denied-origin <origin> Origin to use for rejection checks. Default: https://unauthorized.example.
  --help                   Show this help text.

Environment fallback:
  PRODUCTION_URL or HEALTH_CHECK_URL can provide --url.
`);
}

function readValue(argv, index, name) {
  const value = argv[index + 1];
  if (!value || value.startsWith('--')) {
    throw new Error(`${name} requires a value.`);
  }
  return value;
}

function parseArgs(argv) {
  const options = {
    url: process.env.PRODUCTION_URL || process.env.HEALTH_CHECK_URL || '',
    timeoutMs: DEFAULT_TIMEOUT_MS,
    healthPath: DEFAULT_HEALTH_PATH,
    metricsPath: DEFAULT_METRICS_PATH,
    skipRoot: false,
    skipMetrics: false,
    skipSecurity: false,
    skipCors: false,
    deniedOrigin: 'https://unauthorized.example',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help' || arg === '-h') {
      printUsage();
      process.exit(0);
    }

    if (arg === '--url') {
      options.url = readValue(argv, index, '--url');
      index += 1;
      continue;
    }

    if (arg === '--timeout') {
      const value = Number(readValue(argv, index, '--timeout'));
      if (!Number.isInteger(value) || value < 1000) {
        throw new Error('--timeout must be an integer of at least 1000 milliseconds.');
      }
      options.timeoutMs = value;
      index += 1;
      continue;
    }

    if (arg === '--health-path') {
      const value = readValue(argv, index, '--health-path');
      options.healthPath = value.startsWith('/') ? value : `/${value}`;
      index += 1;
      continue;
    }

    if (arg === '--metrics-path') {
      const value = readValue(argv, index, '--metrics-path');
      options.metricsPath = value.startsWith('/') ? value : `/${value}`;
      index += 1;
      continue;
    }

    if (arg === '--skip-root') {
      options.skipRoot = true;
      continue;
    }

    if (arg === '--skip-metrics') {
      options.skipMetrics = true;
      continue;
    }

    if (arg === '--skip-security') {
      options.skipSecurity = true;
      continue;
    }

    if (arg === '--skip-cors') {
      options.skipCors = true;
      continue;
    }

    if (arg === '--denied-origin') {
      options.deniedOrigin = readValue(argv, index, '--denied-origin');
      index += 1;
      continue;
    }

    throw new Error(`Unknown option: ${arg}`);
  }

  if (!options.url) {
    throw new Error('Missing --url. Provide a production origin or set PRODUCTION_URL.');
  }

  return options;
}

function normalizeInputUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error('URL must use http or https.');
    }
    return url;
  } catch (error) {
    throw new Error(`Invalid URL "${value}": ${error.message}`);
  }
}

function getVerificationUrls(inputUrl, healthPath, metricsPath) {
  const normalized = normalizeInputUrl(inputUrl);
  const isHealthUrl = normalized.pathname.endsWith('/api/health');
  const rootUrl = new URL('/', normalized.origin);
  const healthUrl = isHealthUrl ? normalized : new URL(healthPath, normalized.origin);
  const metricsUrl = new URL(metricsPath, normalized.origin);

  return { rootUrl, healthUrl, metricsUrl };
}

function createBodyPreview(body) {
  return body.replace(/\s+/g, ' ').trim().slice(0, 500);
}

function responseHeadersToObject(headers) {
  return Object.fromEntries(headers.entries());
}

async function fetchText(url, timeoutMs, requestOptions = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: requestOptions.redirect || 'follow',
      method: requestOptions.method || 'GET',
      headers: {
        Accept: 'application/json,text/html;q=0.9,*/*;q=0.8',
        'User-Agent': USER_AGENT,
        ...(requestOptions.headers || {}),
      },
    });
    const body = await response.text();
    const headers = responseHeadersToObject(response.headers);

    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers,
      contentType: headers['content-type'] || '',
      requestId: headers['x-request-id'] || '',
      body,
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Timed out after ${timeoutMs} ms requesting ${url}`);
    }
    throw new Error(`Request failed for ${url}: ${error.message}`);
  } finally {
    clearTimeout(timeout);
  }
}

function validateRootPage(result) {
  if (!result.ok) {
    throw new Error(`Root page returned HTTP ${result.status} ${result.statusText}.`);
  }

  const body = result.body.toLowerCase();
  const isHtml =
    result.contentType.includes('text/html') ||
    body.includes('<!doctype html') ||
    body.includes('<html');

  if (!isHtml) {
    throw new Error(`Root page did not look like HTML. Preview: ${createBodyPreview(result.body)}`);
  }
}

function parseHealth(result) {
  let json;
  try {
    json = JSON.parse(result.body);
  } catch (error) {
    throw new Error(
      `Health endpoint did not return valid JSON. Preview: ${createBodyPreview(result.body)}`
    );
  }

  const status = typeof json.status === 'string' ? json.status : 'unknown';
  const allowedStatuses = new Set(['healthy', 'degraded', 'unhealthy']);

  if (!allowedStatuses.has(status)) {
    throw new Error(`Health endpoint returned unknown status "${status}".`);
  }

  if (status === 'unhealthy' || result.status >= 500) {
    throw new Error(`Health endpoint is ${status} with HTTP ${result.status}.`);
  }

  if (result.status !== 200) {
    throw new Error(`Health endpoint returned HTTP ${result.status}; expected HTTP 200.`);
  }

  return json;
}

function validateApiRequestId(result, json, label) {
  if (!result.requestId) {
    throw new Error(`${label} response did not include X-Request-Id.`);
  }

  if (json.requestId && json.requestId !== result.requestId) {
    throw new Error(`${label} requestId body/header mismatch.`);
  }
}

function requireHeader(result, name) {
  const value = result.headers[name.toLowerCase()];
  if (!value) {
    throw new Error(`Missing required security header: ${name}`);
  }
  return value;
}

function validateSecurityHeaders(result, url) {
  const csp = requireHeader(result, 'content-security-policy');
  if (!csp.includes("default-src 'self'") || !csp.includes('frame-ancestors')) {
    throw new Error('Content-Security-Policy is present but missing required directives.');
  }

  if (requireHeader(result, 'x-frame-options').toUpperCase() !== 'DENY') {
    throw new Error('X-Frame-Options must be DENY.');
  }

  if (requireHeader(result, 'x-content-type-options').toLowerCase() !== 'nosniff') {
    throw new Error('X-Content-Type-Options must be nosniff.');
  }

  requireHeader(result, 'referrer-policy');
  requireHeader(result, 'permissions-policy');

  if (url.protocol === 'https:') {
    requireHeader(result, 'strict-transport-security');
  }
}

function getHealthSecurity(health) {
  return health && typeof health.security === 'object' ? health.security : null;
}

function validateSecurityPosture(health) {
  const security = getHealthSecurity(health);
  if (!security) {
    throw new Error('Health response did not include security posture.');
  }

  const tokenRoutes = security.rateLimiting?.tokens?.routes;
  if (!Array.isArray(tokenRoutes) || tokenRoutes.length === 0) {
    throw new Error('Health security posture did not include token limiter routes.');
  }

  const expectedRoutes = [
    '/api/openai/session',
    '/api/xai/session',
    '/api/elevenlabs/signed-url',
    '/api/ultravox/call',
    '/api/retell/create-web-call',
    '/api/gemini/session',
  ];
  const missingRoute = expectedRoutes.find(route => !tokenRoutes.includes(route));
  if (missingRoute) {
    throw new Error(`Health security posture is missing token limiter route ${missingRoute}.`);
  }

  if (!security.headers?.enabled || !security.headers?.csp || !security.headers?.frameProtection) {
    throw new Error('Health security posture did not report enabled security headers.');
  }

  if (!security.bodyParsing?.jsonLimit) {
    throw new Error('Health security posture did not report the JSON body limit.');
  }

  return { security, tokenRoutes };
}

async function fetchCorsPreflight(url, timeoutMs, origin) {
  return fetchText(url, timeoutMs, {
    method: 'OPTIONS',
    redirect: 'manual',
    headers: {
      Origin: origin,
      'Access-Control-Request-Method': 'POST',
    },
  });
}

function validateDeniedCors(result, deniedOrigin) {
  const allowOrigin = result.headers['access-control-allow-origin'] || '';
  if (allowOrigin === '*' || allowOrigin === deniedOrigin) {
    throw new Error(`Denied CORS origin was allowed: ${allowOrigin}`);
  }
}

function validateAllowedCors(result, allowedOrigin) {
  const allowOrigin = result.headers['access-control-allow-origin'] || '';
  if (allowOrigin !== allowedOrigin) {
    throw new Error(`Allowed CORS origin ${allowedOrigin} was not reflected.`);
  }
}

function parseMetrics(result) {
  let json;
  try {
    json = JSON.parse(result.body);
  } catch (error) {
    throw new Error(
      `Metrics endpoint did not return valid JSON. Preview: ${createBodyPreview(result.body)}`
    );
  }

  if (result.status === 503 && json.status === 'disabled') {
    return { disabled: true, json };
  }

  if (!result.ok) {
    throw new Error(`Metrics endpoint returned HTTP ${result.status} ${result.statusText}.`);
  }

  if (json.status !== 'ok' || !json.metrics || typeof json.metrics !== 'object') {
    throw new Error(`Metrics endpoint returned an unexpected shape. Preview: ${createBodyPreview(result.body)}`);
  }

  const requests = json.metrics.requests;
  const latency = json.metrics.latencyMs;
  if (!requests || typeof requests.total !== 'number') {
    throw new Error('Metrics endpoint did not include numeric request totals.');
  }

  if (!latency || typeof latency.average !== 'number') {
    throw new Error('Metrics endpoint did not include latency summary.');
  }

  return { disabled: false, json };
}

function formatProviderSummary(health) {
  const summary = health.providerSummary;
  if (!summary || typeof summary !== 'object') {
    return 'provider summary unavailable';
  }

  return `${summary.configured ?? '?'} configured, ${summary.unconfigured ?? '?'} unconfigured, ${summary.total ?? '?'} total`;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const { rootUrl, healthUrl, metricsUrl } = getVerificationUrls(
    options.url,
    options.healthPath,
    options.metricsPath
  );

  console.log('Production verification');
  console.log(`Root URL: ${rootUrl.href}`);
  console.log(`Health URL: ${healthUrl.href}`);
  console.log(`Metrics URL: ${metricsUrl.href}`);
  console.log(`Timeout: ${options.timeoutMs} ms`);

  if (!options.skipRoot) {
    const rootResult = await fetchText(rootUrl, options.timeoutMs);
    validateRootPage(rootResult);
    console.log(`[PASS] Root page served HTML over HTTP ${rootResult.status}.`);
  } else {
    console.log('[SKIP] Root page check skipped.');
  }

  const healthResult = await fetchText(healthUrl, options.timeoutMs);
  const health = parseHealth(healthResult);
  validateApiRequestId(healthResult, health, 'Health');
  const providerSummary = formatProviderSummary(health);

  if (health.status === 'degraded') {
    console.log(`[WARN] Health status: degraded (${providerSummary}).`);
    console.log('[WARN] The app is serving, but one or more providers are not configured.');
  } else {
    console.log(`[PASS] Health status: healthy (${providerSummary}).`);
  }

  console.log(`[PASS] Health response included X-Request-Id: ${healthResult.requestId}`);

  if (options.skipSecurity) {
    console.log('[SKIP] Security posture checks skipped.');
  } else {
    validateSecurityHeaders(healthResult, healthUrl);
    const { security, tokenRoutes } = validateSecurityPosture(health);
    console.log('[PASS] Security headers are present on /api/health.');
    console.log(`[PASS] Security posture lists ${tokenRoutes.length} token/session limiter routes.`);
    if (security.cors?.unsafeProductionConfig) {
      throw new Error(`Unsafe production CORS configuration: ${security.cors.issues.join('; ')}`);
    }
  }

  if (options.skipCors) {
    console.log('[SKIP] CORS checks skipped.');
  } else {
    const corsUrl = new URL('/api/xai/session', healthUrl.origin);
    const denied = await fetchCorsPreflight(corsUrl, options.timeoutMs, options.deniedOrigin);
    validateDeniedCors(denied, options.deniedOrigin);
    console.log(`[PASS] CORS rejected unauthorized origin ${options.deniedOrigin}.`);

    const allowedOrigins = health.security?.cors?.configuredOrigins || [];
    if (allowedOrigins.length > 0) {
      const allowedOrigin = allowedOrigins[0];
      const allowed = await fetchCorsPreflight(corsUrl, options.timeoutMs, allowedOrigin);
      validateAllowedCors(allowed, allowedOrigin);
      console.log(`[PASS] CORS allowed configured origin ${allowedOrigin}.`);
    } else {
      console.log('[WARN] No configured CORS origins were reported; allowed-origin check skipped.');
    }
  }

  if (options.skipMetrics) {
    console.log('[SKIP] Metrics endpoint check skipped.');
  } else {
    const metricsResult = await fetchText(metricsUrl, options.timeoutMs);
    const metrics = parseMetrics(metricsResult);
    validateApiRequestId(metricsResult, metrics.json, 'Metrics');

    if (metrics.disabled) {
      console.log('[WARN] Metrics endpoint is disabled by configuration.');
    } else {
      console.log(
        `[PASS] Metrics endpoint returned ${metrics.json.metrics.requests.total} total requests.`
      );
      console.log(`[PASS] Metrics response included X-Request-Id: ${metricsResult.requestId}`);
    }
  }

  console.log('Production verification complete.');
}

main().catch((error) => {
  console.error(`[FAIL] ${error.message}`);
  process.exitCode = 1;
});
