/**
 * Structured logger for AI-friendly error capture
 * Uses pino for high-performance JSON logging
 */
import pino from 'pino';
import fs from 'fs';
import path from 'path';

const isDevelopment = process.env.NODE_ENV !== 'production';

// Configure pino logger
export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// Error capture for AI-friendly debugging
interface ErrorContext {
  timestamp: string;
  level: 'error';
  msg: string;
  error: {
    type: string;
    message: string;
    stack?: string;
  };
  context: Record<string, unknown>;
}

/**
 * Write error details to logs/last_error_<timestamp>.json for AI debugging
 */
export function captureError(
  error: Error,
  message: string,
  context: Record<string, unknown> = {}
): void {
  const errorContext: ErrorContext = {
    timestamp: new Date().toISOString(),
    level: 'error',
    msg: message,
    error: {
      type: error.constructor.name,
      message: error.message,
      stack: error.stack,
    },
    context,
  };

  // Log to pino
  logger.error({ err: error, ...context }, message);

  // Write to last_error file for AI debugging (server-side only)
  if (typeof window === 'undefined') {
    try {
      const logsDir = path.join(process.cwd(), 'logs');
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }
      const timestamp = errorContext.timestamp.replace(/[:.]/g, '-');
      const errorFile = path.join(logsDir, `last_error_${timestamp}.json`);
      fs.writeFileSync(errorFile, JSON.stringify(errorContext, null, 2));
    } catch (writeError) {
      // Fire-and-forget - don't let logging errors break the app
      console.error('Failed to write error log:', writeError);
    }
  }
}

// Convenience methods for common log levels
export const log = {
  debug: (msg: string, data?: Record<string, unknown>) => logger.debug(data, msg),
  info: (msg: string, data?: Record<string, unknown>) => logger.info(data, msg),
  warn: (msg: string, data?: Record<string, unknown>) => logger.warn(data, msg),
  error: (msg: string, error?: Error, context?: Record<string, unknown>) => {
    if (error) {
      captureError(error, msg, context);
    } else {
      logger.error(context, msg);
    }
  },
};

export default logger;
