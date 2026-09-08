import { getApiBaseUrl } from '@/lib/apiConfig';
import type { LiveKitConfig } from '@/types/livekit';
import type { TokenSourceResponseObject } from 'livekit-client';

/** Fetch public demo readiness without exposing server credentials. */
export async function getLiveKitConfiguration(signal: AbortSignal): Promise<LiveKitConfig> {
  const response = await fetch(`${getApiBaseUrl()}/api/livekit/config`, { signal });
  if (!response.ok) throw new Error('Could not reach the demo server. Please try again.');
  return response.json() as Promise<LiveKitConfig>;
}

/** Request an ephemeral session only after the visitor explicitly starts. */
export async function getLiveKitToken(signal: AbortSignal): Promise<TokenSourceResponseObject> {
  const response = await fetch(`${getApiBaseUrl()}/api/livekit/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
    signal,
  });
  if (!response.ok) {
    if (response.status === 429)
      throw new Error('Too many connection attempts. Wait a minute and try again.');
    if (response.status === 503)
      throw new Error('LiveKit is not configured. Ask the demo host to check setup.');
    throw new Error('Could not start the conversation. Please try again.');
  }
  const data = await response.json();
  if (typeof data.serverUrl !== 'string' || typeof data.participantToken !== 'string') {
    throw new Error('The demo server returned an invalid session. Please try again.');
  }
  return { serverUrl: data.serverUrl, participantToken: data.participantToken };
}

/** Map microphone and application failures to safe, actionable visitor messages. */
export function liveKitErrorMessage(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError')
      return 'Microphone access was denied. Allow it in your browser settings, then try again.';
    if (error.name === 'NotFoundError')
      return 'No microphone was found. Connect a microphone and try again.';
    if (error.name === 'NotReadableError')
      return 'Your microphone is busy. Close other apps using it and try again.';
  }
  // Only application-authored errors may reach the UI; SDK errors may include connection details.
  if (
    error instanceof Error &&
    /^(Could not|Too many|LiveKit is|The demo server)/.test(error.message)
  )
    return error.message;
  return 'The conversation could not connect. Check your connection and try again.';
}
