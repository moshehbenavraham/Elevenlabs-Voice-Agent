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

/**
 * Track an error with optional context
 */
export function trackError(
  source: string,
  message: string,
  error?: unknown,
  context?: ErrorContext
): void {
  const errorInfo = {
    source,
    message,
    error: error instanceof Error ? error.message : error,
    stack: error instanceof Error ? error.stack : undefined,
    context,
    timestamp: new Date().toISOString(),
  };

  if (isDevelopment) {
    // In development, log to console for debugging
    console.error(`[${source}] ${message}`, error, context);
  } else {
    // In production, send to error tracking service
    // TODO: Integrate with Sentry, LogRocket, or similar service
    // Example: Sentry.captureException(error, { extra: errorInfo });

    // For now, still log in production but in a structured format
    // that could be captured by log aggregation services
    console.error(JSON.stringify(errorInfo));
  }
}

/**
 * Track a warning (non-critical issue)
 */
export function trackWarning(source: string, message: string, context?: ErrorContext): void {
  const warningInfo = {
    source,
    message,
    context,
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
