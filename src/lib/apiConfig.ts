/**
 * API Configuration Utility
 *
 * Provides runtime API base URL resolution that supports:
 * 1. Demo mode: window.__DEMO_CONFIG__ from public/config.js (ngrok URLs)
 * 2. Normal mode: import.meta.env.VITE_API_BASE_URL (build-time)
 * 3. Fallback: localhost:3001
 *
 * The demo mode config is set by configure-urls.sh during demo startup,
 * which generates public/config.js with the ngrok backend URL.
 *
 * @see scripts/ngrok/configure-urls.sh
 * @see public/config.template.js
 */

// Type declaration for demo mode config injected via window
declare global {
  interface Window {
    __DEMO_CONFIG__?: {
      apiBaseUrl: string;
      frontendUrl: string;
      isDemoMode: boolean;
      generatedAt: string;
    };
  }
}

// Default fallback URL for local development
const DEFAULT_API_BASE_URL = 'http://localhost:3001';

/**
 * Get the API base URL for making backend requests.
 *
 * Resolution order:
 * 1. window.__DEMO_CONFIG__.apiBaseUrl (demo mode - ngrok URL or empty for same-origin)
 * 2. import.meta.env.VITE_API_BASE_URL (build-time env var)
 * 3. DEFAULT_API_BASE_URL (localhost fallback)
 *
 * @returns The API base URL without trailing slash
 */
export function getApiBaseUrl(): string {
  // Priority 1: Demo mode runtime config (set by config.js)
  // Check isDemoMode first - apiBaseUrl may be empty string for same-origin requests
  if (typeof window !== 'undefined' && window.__DEMO_CONFIG__?.isDemoMode === true) {
    // Return apiBaseUrl even if empty (empty = same-origin, no CORS)
    return window.__DEMO_CONFIG__.apiBaseUrl || '';
  }

  // Priority 2: Build-time environment variable
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl) {
    // Remove trailing slash for consistency
    return envUrl.replace(/\/$/, '');
  }

  // Priority 3: Default fallback
  return DEFAULT_API_BASE_URL;
}

/**
 * Check if the app is running in demo mode (via ngrok tunnels).
 *
 * @returns true if demo mode is active
 */
export function isDemoMode(): boolean {
  return typeof window !== 'undefined' && window.__DEMO_CONFIG__?.isDemoMode === true;
}

/**
 * Get the full demo config if available.
 *
 * @returns Demo config object or null if not in demo mode
 */
export function getDemoConfig(): Window['__DEMO_CONFIG__'] | null {
  if (typeof window !== 'undefined' && window.__DEMO_CONFIG__) {
    return window.__DEMO_CONFIG__;
  }
  return null;
}

// Export a constant for backwards compatibility with existing code
// that uses direct import of API_BASE_URL
// Note: This is evaluated once at module load time, so it works for
// static usage but getApiBaseUrl() is preferred for dynamic contexts
export const API_BASE_URL = getApiBaseUrl();
