/**
 * Utility functions for sanitizing user input before logging.
 * Prevents log injection attacks (CWE-117) by removing control characters.
 */

/**
 * Sanitizes input for safe logging by removing newlines and carriage returns.
 * This prevents log forging/injection attacks where malicious users could
 * inject fake log entries by including newline characters in input.
 *
 * @param {unknown} input - The value to sanitize
 * @returns {string} Sanitized string safe for logging
 */
export function sanitizeLogInput(input) {
  if (input === null || input === undefined) {
    return String(input);
  }

  if (typeof input === 'string') {
    return input.replace(/[\n\r]/g, '');
  }

  if (typeof input === 'object') {
    try {
      return JSON.stringify(input).replace(/[\n\r]/g, '');
    } catch {
      return '[Object]';
    }
  }

  return String(input).replace(/[\n\r]/g, '');
}
