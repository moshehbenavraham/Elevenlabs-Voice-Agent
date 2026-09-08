import { useEffect, useState } from 'react';
import { getApiBaseUrl } from '@/lib/apiConfig';

export type RuntimeProviderName =
  'elevenlabs' | 'openai' | 'xai' | 'ultravox' | 'vapi' | 'retell' | 'gemini' | 'livekit';

export interface RuntimeProviderStatus {
  readonly configured: boolean;
  readonly missing: readonly string[];
}

type RuntimeProviderServices = Partial<Record<RuntimeProviderName, RuntimeProviderStatus>>;

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

export async function fetchProviderRuntimeConfiguration(
  signal?: AbortSignal
): Promise<RuntimeProviderServices> {
  const response = await fetch(`${getApiBaseUrl()}/api/health`, {
    method: 'GET',
    credentials: 'include',
    signal,
  });
  if (!response.ok) {
    throw new Error(`Provider health request failed with status ${response.status}.`);
  }
  return parseServices(await response.json());
}

/** Load the server-authoritative provider configuration before enabling provider controls. */
export function useProviderRuntimeConfiguration(): {
  readonly services: RuntimeProviderServices | null;
  readonly isChecking: boolean;
} {
  const [services, setServices] = useState<RuntimeProviderServices | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    fetchProviderRuntimeConfiguration(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setServices(result);
      })
      .catch(() => {
        if (!controller.signal.aborted) setServices(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsChecking(false);
      });
    return () => controller.abort();
  }, []);

  return { services, isChecking };
}
