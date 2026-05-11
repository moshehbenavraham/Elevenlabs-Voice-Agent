#!/usr/bin/env node

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_HEALTH_PATH = '/api/health';
const USER_AGENT = 'voice-agent-production-verifier/1.0';

function printUsage() {
  console.log(`Usage: node scripts/deploy/verify-production.mjs --url <origin> [options]

Options:
  --url <url>              Production origin, or a direct /api/health URL.
  --timeout <ms>           Per-request timeout in milliseconds. Default: ${DEFAULT_TIMEOUT_MS}.
  --health-path <path>     Health endpoint path. Default: ${DEFAULT_HEALTH_PATH}.
  --skip-root              Skip the root page HTML check.
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
    skipRoot: false,
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

    if (arg === '--skip-root') {
      options.skipRoot = true;
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

function getVerificationUrls(inputUrl, healthPath) {
  const normalized = normalizeInputUrl(inputUrl);
  const isHealthUrl = normalized.pathname.endsWith('/api/health');
  const rootUrl = new URL('/', normalized.origin);
  const healthUrl = isHealthUrl ? normalized : new URL(healthPath, normalized.origin);

  return { rootUrl, healthUrl };
}

function createBodyPreview(body) {
  return body.replace(/\s+/g, ' ').trim().slice(0, 500);
}

async function fetchText(url, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        Accept: 'application/json,text/html;q=0.9,*/*;q=0.8',
        'User-Agent': USER_AGENT,
      },
    });
    const body = await response.text();

    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type') || '',
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

function formatProviderSummary(health) {
  const summary = health.providerSummary;
  if (!summary || typeof summary !== 'object') {
    return 'provider summary unavailable';
  }

  return `${summary.configured ?? '?'} configured, ${summary.unconfigured ?? '?'} unconfigured, ${summary.total ?? '?'} total`;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const { rootUrl, healthUrl } = getVerificationUrls(options.url, options.healthPath);

  console.log('Production verification');
  console.log(`Root URL: ${rootUrl.href}`);
  console.log(`Health URL: ${healthUrl.href}`);
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
  const providerSummary = formatProviderSummary(health);

  if (health.status === 'degraded') {
    console.log(`[WARN] Health status: degraded (${providerSummary}).`);
    console.log('[WARN] The app is serving, but one or more providers are not configured.');
  } else {
    console.log(`[PASS] Health status: healthy (${providerSummary}).`);
  }

  console.log('Production verification complete.');
}

main().catch((error) => {
  console.error(`[FAIL] ${error.message}`);
  process.exitCode = 1;
});
