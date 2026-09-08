import { useCallback, useEffect, useState } from 'react';
import { getApiBaseUrl } from '@/lib/apiConfig';

const PROVIDER_HEALTH_TIMEOUT_MS = 10_000;

export type RuntimeProviderName =
  'elevenlabs' | 'openai' | 'xai' | 'ultravox' | 'vapi' | 'retell' | 'gemini' | 'livekit';

export interface RuntimeProviderStatus {
  readonly configured: boolean;
  readonly missing: readonly string[];
}

type RuntimeProviderServices = Partial<Record<RuntimeProviderName, RuntimeProviderStatus>>;

/** Parse provider readiness from the server health response. */
function parseServices(payload: unknown): RuntimeProviderServices {
  if (!payload || typeof payload !== 'object' || !('services' in payload)) {
    throw new Error('Health response is missing provider services.');
  }

  const rawServices = payload.services;
  if (!rawServices || typeof rawServices !== 'object') {
    throw new Error('Health response has invalid provider services.');
  }

  const services: RuntimeProviderServices = {};
  for (const [name, value] of Object.entries(rawServices)) {
    if (!value || typeof value !== 'object' || !('configured' in value)) continue;
    if (typeof value.configured !== 'boolean') continue;
    services[name as RuntimeProviderName] = {
      configured: value.configured,
      missing:
        'missing' in value && Array.isArray(value.missing)
          ? (value.missing as unknown[]).filter(
              (item: unknown): item is string => typeof item === 'string'
            )
          : [],
    };
  }
  return services;
}

/** Fetch provider readiness with caller cancellation and a bounded deadline. */
export async function fetchProviderRuntimeConfiguration(
  signal?: AbortSignal
): Promise<RuntimeProviderServices> {
  const controller = new AbortController();
  const abortFromCaller = () => controller.abort(signal?.reason);
  if (signal?.aborted) {
    abortFromCaller();
  } else {
    signal?.addEventListener('abort', abortFromCaller, { once: true });
  }
  const timeoutId = setTimeout(
    () => controller.abort(new DOMException('Provider health request timed out.', 'AbortError')),
    PROVIDER_HEALTH_TIMEOUT_MS
  );

  try {
    const response = await fetch(`${getApiBaseUrl()}/api/health`, {
      method: 'GET',
      credentials: 'include',
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Provider health request failed with status ${response.status}.`);
    }
    return parseServices(await response.json());
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener('abort', abortFromCaller);
  }
}

/** Load the server-authoritative provider configuration before enabling provider controls. */
export function useProviderRuntimeConfiguration(): {
  readonly services: RuntimeProviderServices | null;
  readonly isChecking: boolean;
  readonly error: string | null;
  readonly retry: () => void;
} {
  const [services, setServices] = useState<RuntimeProviderServices | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => {
    setServices(null);
    setError(null);
    setIsChecking(true);
    setAttempt((current) => current + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchProviderRuntimeConfiguration(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setServices(result);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setServices(null);
          setError(
            cause instanceof Error ? cause.message : 'Provider configuration could not be verified.'
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsChecking(false);
      });
    return () => controller.abort();
  }, [attempt]);

  return { services, isChecking, error, retry };
}
