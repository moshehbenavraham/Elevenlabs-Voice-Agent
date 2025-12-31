/**
 * Vapi SDK Singleton
 *
 * Single instance of the Vapi SDK initialized with the public web token.
 * Unlike other providers (OpenAI, xAI), Vapi uses a public key that is
 * safe to expose in the frontend - no backend token exchange needed.
 */

import Vapi from '@vapi-ai/web';

const webToken = import.meta.env.VITE_VAPI_WEB_TOKEN;

if (!webToken) {
  console.warn('[Vapi] VITE_VAPI_WEB_TOKEN not configured. Vapi voice provider will not work.');
}

/**
 * Vapi SDK singleton instance
 * Initialized with the public web token from environment variables
 */
export const vapi = webToken ? new Vapi(webToken) : null;
