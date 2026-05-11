/**
 * Error tracking utility
 *
 * In development: logs errors to console
 * In production: can be extended to integrate with services like Sentry
 *
 * Usage:
 *   import { trackError, trackWarning } from '@/lib/errorTracking';
 *   trackError('ComponentName', 'Failed to initialize', error);
 */

type ErrorContext = Record<string, unknown>;

const isDevelopment = import.meta.env.DEV;
const fallbackProvider = 'console';

interface ErrorTrackingStatus {
  readonly mode: 'development-console' | 'production-console' | 'deferred-external';
  readonly externalReportingEnabled: false;
  readonly externalServiceStatus: 'not-configured' | 'deferred';
  readonly provider: string;
  readonly reason: string;
}

function getConfiguredProvider(): string {
  const provider = import.meta.env.VITE_ERROR_TRACKING_PROVIDER;
  return typeof provider === 'string' && provider.trim().length > 0
    ? provider.trim()
    : fallbackProvider;
}

function isExternalTrackingRequested(): boolean {
  return (
    import.meta.env.VITE_ERROR_TRACKING_ENABLED === 'true' &&
    getConfiguredProvider() !== fallbackProvider
  );
}

/**
 * Report the active frontend error tracking posture.
 *
 * No external provider SDK is wired in this repository yet. If a deployment
 * sets provider variables, this function still reports deferred status so
 * operators do not mistake structured console output for managed reporting.
 */
export function getErrorTrackingStatus(): ErrorTrackingStatus {
  if (isDevelopment) {
    return {
      mode: 'development-console',
      externalReportingEnabled: false,
      externalServiceStatus: 'not-configured',
      provider: fallbackProvider,
      reason: 'Development errors are logged to the browser console.',
    };
  }

  if (isExternalTrackingRequested()) {
    return {
      mode: 'deferred-external',
      externalReportingEnabled: false,
      externalServiceStatus: 'deferred',
      provider: getConfiguredProvider(),
      reason:
        'External frontend error tracking is requested, but no provider SDK integration is wired.',
    };
  }

  return {
    mode: 'production-console',
    externalReportingEnabled: false,
    externalServiceStatus: 'not-configured',
    provider: fallbackProvider,
    reason:
      'Production frontend errors use structured console output until a managed provider is selected.',
  };
}

/**
 * Track an error with optional context
 */
export function trackError(
  source: string,
  message: string,
  error?: unknown,
  context?: ErrorContext
): void {
  const tracking = getErrorTrackingStatus();
  const errorInfo = {
    level: 'error',
    source,
    message,
    error: error instanceof Error ? error.message : error,
    stack: error instanceof Error ? error.stack : undefined,
    context,
    tracking,
    timestamp: new Date().toISOString(),
  };

  if (isDevelopment) {
    // In development, log to console for debugging
    console.error(`[${source}] ${message}`, error, context);
  } else {
    // No external provider SDK is wired yet. Keep production output structured
    // so a host/browser log collector can capture it without claiming managed
    // error reporting is active.
    console.error(JSON.stringify(errorInfo));
  }
}

/**
 * Track a warning (non-critical issue)
 */
export function trackWarning(source: string, message: string, context?: ErrorContext): void {
  const tracking = getErrorTrackingStatus();
  const warningInfo = {
    level: 'warn',
    source,
    message,
    context,
    tracking,
    timestamp: new Date().toISOString(),
  };

  if (isDevelopment) {
    console.warn(`[${source}] ${message}`, context);
  } else {
    // In production, log structured warning
    console.warn(JSON.stringify(warningInfo));
  }
}

/**
 * Track a 404 navigation error
 */
export function track404(pathname: string): void {
  trackWarning('Navigation', `404 - Route not found: ${pathname}`, {
    pathname,
    referrer: document.referrer || undefined,
  });
}
