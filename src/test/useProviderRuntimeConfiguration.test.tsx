import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  fetchProviderRuntimeConfiguration,
  useProviderRuntimeConfiguration,
} from '@/hooks/useProviderRuntimeConfiguration';
import { getApiBaseUrl } from '@/lib/apiConfig';

describe('provider runtime configuration', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

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
    expect(fetchMock).toHaveBeenCalledWith(`${getApiBaseUrl()}/api/health`, {
      method: 'GET',
      credentials: 'include',
      signal: expect.any(AbortSignal),
    });
  });

  it('reports failed checks separately and retries them', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            services: { openai: { configured: true, missing: [] } },
          }),
      });
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useProviderRuntimeConfiguration());

    await waitFor(() => expect(result.current.isChecking).toBe(false));
    expect(result.current.services).toBeNull();
    expect(result.current.error).toBe('offline');

    act(() => result.current.retry());

    await waitFor(() => {
      expect(result.current.services?.openai?.configured).toBe(true);
    });
    expect(result.current.error).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('aborts a stalled health request after ten seconds', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn((_url: string, init: RequestInit) => {
      return new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => reject(init.signal?.reason), { once: true });
      });
    });
    vi.stubGlobal('fetch', fetchMock);
    const rejection = expect(fetchProviderRuntimeConfiguration()).rejects.toMatchObject({
      name: 'AbortError',
      message: 'Provider health request timed out.',
    });

    await vi.advanceTimersByTimeAsync(10_000);

    await rejection;
  });
});
