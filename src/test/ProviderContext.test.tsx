import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProviderProvider, useProvider } from '@/contexts/ProviderContext';
import type { ReactNode } from 'react';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <ProviderProvider>{children}</ProviderProvider>
);

describe('ProviderContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  describe('useProvider hook', () => {
    it('returns default provider as elevenlabs', () => {
      const { result } = renderHook(() => useProvider(), { wrapper });

      expect(result.current.activeProvider).toBe('elevenlabs');
    });

    it('returns list of all providers', () => {
      const { result } = renderHook(() => useProvider(), { wrapper });

      expect(result.current.providers).toEqual(['elevenlabs', 'xai', 'openai']);
    });

    it('correctly identifies available providers', () => {
      const { result } = renderHook(() => useProvider(), { wrapper });

      expect(result.current.isProviderAvailable('elevenlabs')).toBe(true);
      // xAI availability depends on VITE_XAI_ENABLED env var (true in test env)
      expect(result.current.isProviderAvailable('xai')).toBe(true);
      expect(result.current.isProviderAvailable('openai')).toBe(false);
    });
  });

  describe('setActiveProvider', () => {
    it('updates active provider when valid and available', () => {
      const { result } = renderHook(() => useProvider(), { wrapper });

      // elevenlabs is the only available provider currently
      act(() => {
        result.current.setActiveProvider('elevenlabs');
      });

      expect(result.current.activeProvider).toBe('elevenlabs');
    });

    it('does not update to unavailable provider', () => {
      const { result } = renderHook(() => useProvider(), { wrapper });
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // openai is unavailable, test with that instead of xai
      act(() => {
        result.current.setActiveProvider('openai');
      });

      expect(result.current.activeProvider).toBe('elevenlabs');
      expect(consoleSpy).toHaveBeenCalledWith('Provider openai is not available');

      consoleSpy.mockRestore();
    });
  });

  describe('localStorage persistence', () => {
    it('persists active provider to localStorage', () => {
      renderHook(() => useProvider(), { wrapper });

      expect(localStorageMock.setItem).toHaveBeenCalledWith('voice-ai-provider', 'elevenlabs');
    });

    it('reads saved provider from localStorage on mount', () => {
      localStorageMock.getItem.mockReturnValueOnce('elevenlabs');

      const { result } = renderHook(() => useProvider(), { wrapper });

      expect(result.current.activeProvider).toBe('elevenlabs');
    });

    it('falls back to default for invalid localStorage value', () => {
      localStorageMock.getItem.mockReturnValueOnce('invalid-provider');

      const { result } = renderHook(() => useProvider(), { wrapper });

      expect(result.current.activeProvider).toBe('elevenlabs');
    });
  });

  describe('error handling', () => {
    it('throws error when useProvider used outside ProviderProvider', () => {
      expect(() => {
        renderHook(() => useProvider());
      }).toThrow('useProvider must be used within a ProviderProvider');
    });
  });
});
