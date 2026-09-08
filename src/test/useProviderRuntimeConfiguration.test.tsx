import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  fetchProviderRuntimeConfiguration,
  useProviderRuntimeConfiguration,
} from '@/hooks/useProviderRuntimeConfiguration';

describe('provider runtime configuration', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('parses server-authoritative provider availability', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          services: {
            openai: { configured: false, missing: ['OPENAI_API_KEY'] },
            livekit: { configured: true, missing: [] },
          },
        }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchProviderRuntimeConfiguration()).resolves.toEqual({
      openai: { configured: false, missing: ['OPENAI_API_KEY'] },
      livekit: { configured: true, missing: [] },
    });
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3001/api/health', {
      method: 'GET',
      credentials: 'include',
      signal: undefined,
    });
  });

  it('keeps provider controls unavailable when health cannot be verified', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const { result } = renderHook(() => useProviderRuntimeConfiguration());

    await waitFor(() => expect(result.current.isChecking).toBe(false));
    expect(result.current.services).toBeNull();
  });
});
