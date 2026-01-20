/**
 * Vapi SDK Singleton
 *
 * Single instance of the Vapi SDK initialized with the public web token.
 * Unlike other providers (OpenAI, xAI), Vapi uses a public key that is
 * safe to expose in the frontend - no backend token exchange needed.
 */

import Vapi from '@vapi-ai/web';

// Logging prefix for easy filtering in console
const LOG_PREFIX = '[Vapi:SDK]';

const webToken = import.meta.env.VITE_VAPI_WEB_TOKEN;

console.log(`${LOG_PREFIX} Initializing Vapi SDK module...`);
console.log(`${LOG_PREFIX} Web token configured:`, !!webToken);
console.log(
  `${LOG_PREFIX} Token preview:`,
  webToken ? `${webToken.substring(0, 10)}...` : 'NOT SET'
);

if (!webToken) {
  console.warn(
    `${LOG_PREFIX} VITE_VAPI_WEB_TOKEN not configured. Vapi voice provider will not work.`
  );
}

/**
 * Vapi SDK singleton instance
 * Initialized with the public web token from environment variables
 */
export const vapi = webToken ? new Vapi(webToken) : null;

if (vapi) {
  console.log(`${LOG_PREFIX} Vapi SDK instance created successfully`);
} else {
  console.warn(`${LOG_PREFIX} Vapi SDK instance is NULL (no web token)`);
}

// Window augmentation for AudioContext storage
declare global {
  interface Window {
    __vapiAudioContext?: AudioContext;
    __vapiDebugMode?: boolean;
  }
}

// Enable debug mode for extra verbose logging
window.__vapiDebugMode = true;

/**
 * Pre-initialize AudioContext to prevent AudioWorklet failures.
 * MUST be called during a user gesture (click/tap) BEFORE vapi.start()
 *
 * Note: This may not fully prevent Krisp errors because Daily.co creates
 * its own AudioContext internally. However, it ensures the browser's
 * audio system is primed during a user gesture.
 */
export function prepareAudioContext(): AudioContext | null {
  console.log(`${LOG_PREFIX} prepareAudioContext() called`);

  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) {
      console.warn(`${LOG_PREFIX} AudioContext not supported in this browser`);
      return null;
    }

    // Reuse existing context if available
    if (window.__vapiAudioContext) {
      const ctx = window.__vapiAudioContext;
      console.log(`${LOG_PREFIX} Reusing existing AudioContext, state:`, ctx.state);

      if (ctx.state === 'suspended') {
        console.log(`${LOG_PREFIX} AudioContext is suspended, attempting resume...`);
        ctx
          .resume()
          .then(() =>
            console.log(`${LOG_PREFIX} AudioContext resumed successfully, new state:`, ctx.state)
          )
          .catch((e) => console.warn(`${LOG_PREFIX} Failed to resume AudioContext:`, e));
      }
      return ctx;
    }

    // Create new context during user gesture
    console.log(`${LOG_PREFIX} Creating new AudioContext...`);
    const ctx = new AudioContextClass();
    window.__vapiAudioContext = ctx;

    console.log(`${LOG_PREFIX} AudioContext created successfully:`, {
      state: ctx.state,
      sampleRate: ctx.sampleRate,
      baseLatency: ctx.baseLatency,
      outputLatency: ctx.outputLatency,
    });

    return ctx;
  } catch (e) {
    console.error(`${LOG_PREFIX} Failed to pre-initialize AudioContext:`, e);
    return null;
  }
}

/**
 * Cleanup AudioContext on app unmount
 */
export function cleanupAudioContext(): void {
  console.log(`${LOG_PREFIX} cleanupAudioContext() called`);

  const ctx = window.__vapiAudioContext;
  if (ctx) {
    console.log(`${LOG_PREFIX} Closing AudioContext, current state:`, ctx.state);
    ctx
      .close()
      .then(() => console.log(`${LOG_PREFIX} AudioContext closed successfully`))
      .catch((e) => console.warn(`${LOG_PREFIX} Error closing AudioContext:`, e));
    delete window.__vapiAudioContext;
  } else {
    console.log(`${LOG_PREFIX} No AudioContext to cleanup`);
  }
}

/**
 * Get current Vapi debug info for troubleshooting
 */
export function getVapiDebugInfo(): Record<string, unknown> {
  const audioCtx = window.__vapiAudioContext;
  const dailyCall = vapi?.getDailyCallObject?.();

  return {
    sdkInitialized: !!vapi,
    webTokenConfigured: !!webToken,
    audioContext: audioCtx
      ? {
          state: audioCtx.state,
          sampleRate: audioCtx.sampleRate,
        }
      : null,
    dailyCallObject: dailyCall
      ? {
          meetingState: dailyCall.meetingState?.(),
          participants: dailyCall.participants?.(),
        }
      : null,
  };
}
