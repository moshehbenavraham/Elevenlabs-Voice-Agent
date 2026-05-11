import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
    vi.stubEnv('VITE_OPENAI_TRANSLATION_ENABLED', 'false');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('useProvider hook', () => {
    it('returns default provider as elevenlabs', () => {
      const { result } = renderHook(() => useProvider(), { wrapper });

      expect(result.current.activeProvider).toBe('elevenlabs');
    });

    it('returns list of all providers', () => {
      const { result } = renderHook(() => useProvider(), { wrapper });

      expect(result.current.providers).toEqual([
        'elevenlabs',
        'elevenlabs-sdk',
        'xai',
        'openai',
        'ultravox',
        'vapi',
        'retell',
        'gemini',
      ]);
    });

    it('hides OpenAI Translation provider when feature flag is disabled', () => {
      const { result } = renderHook(() => useProvider(), { wrapper });

      expect(result.current.providers).not.toContain('openai-translation');
      expect(result.current.isProviderAvailable('openai-translation')).toBe(false);
    });

    it('includes OpenAI Translation provider when feature flag is enabled', () => {
      vi.stubEnv('VITE_OPENAI_TRANSLATION_ENABLED', 'true');

      const { result } = renderHook(() => useProvider(), { wrapper });

      expect(result.current.providers).toContain('openai-translation');
      expect(result.current.isProviderAvailable('openai-translation')).toBe(true);
    });

    it('correctly identifies available providers', () => {
      const { result } = renderHook(() => useProvider(), { wrapper });

      // ElevenLabs Widget availability depends on VITE_ELEVENLABS_ENABLED env var (true in test env)
      expect(result.current.isProviderAvailable('elevenlabs')).toBe(true);
      // ElevenLabs SDK availability depends on VITE_ELEVENLABS_SDK_ENABLED env var (true in test env)
      expect(result.current.isProviderAvailable('elevenlabs-sdk')).toBe(true);
      // xAI availability depends on VITE_XAI_ENABLED env var (true in test env)
      expect(result.current.isProviderAvailable('xai')).toBe(true);
      // OpenAI availability depends on VITE_OPENAI_ENABLED env var (true in test env)
      expect(result.current.isProviderAvailable('openai')).toBe(true);
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

    it('switches to OpenAI provider when available', () => {
      const { result } = renderHook(() => useProvider(), { wrapper });

      // openai is now available via VITE_OPENAI_ENABLED env var
      act(() => {
        result.current.setActiveProvider('openai');
      });

      expect(result.current.activeProvider).toBe('openai');
    });

    it('does not switch to OpenAI Translation when feature flag is disabled', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const { result } = renderHook(() => useProvider(), { wrapper });

      act(() => {
        result.current.setActiveProvider('openai-translation');
      });

      expect(result.current.activeProvider).toBe('elevenlabs');
      expect(consoleWarnSpy).toHaveBeenCalledWith('Provider openai-translation is hidden');

      consoleWarnSpy.mockRestore();
    });

    it('switches to OpenAI Translation when feature flag is enabled', () => {
      vi.stubEnv('VITE_OPENAI_TRANSLATION_ENABLED', 'true');
      const { result } = renderHook(() => useProvider(), { wrapper });

      act(() => {
        result.current.setActiveProvider('openai-translation');
      });

      expect(result.current.activeProvider).toBe('openai-translation');
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

    it('falls back to default for saved OpenAI Translation when feature flag is disabled', () => {
      localStorageMock.getItem.mockReturnValueOnce('openai-translation');

      const { result } = renderHook(() => useProvider(), { wrapper });

      expect(result.current.activeProvider).toBe('elevenlabs');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('voice-ai-provider', 'elevenlabs');
    });

    it('uses saved OpenAI Translation when feature flag is enabled', () => {
      vi.stubEnv('VITE_OPENAI_TRANSLATION_ENABLED', 'true');
      localStorageMock.getItem.mockReturnValueOnce('openai-translation');

      const { result } = renderHook(() => useProvider(), { wrapper });

      expect(result.current.activeProvider).toBe('openai-translation');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'voice-ai-provider',
        'openai-translation'
      );
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
