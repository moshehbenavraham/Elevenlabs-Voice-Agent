import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { UltravoxVoiceProvider } from '@/contexts/UltravoxVoiceContext';
import { useUltravoxVoice } from '@/hooks/useUltravoxVoice';
import { ultravoxMocks } from './setup';

// Mock fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Wrapper component for hook tests
const UltravoxWrapper = ({ children }: { children: ReactNode }) => (
  <UltravoxVoiceProvider>{children}</UltravoxVoiceProvider>
);

describe('UltravoxVoiceContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock successful call creation
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ joinUrl: 'wss://mock-ultravox-url.com/call/123' }),
    });
  });

  describe('useUltravoxVoice hook', () => {
    it('returns initial disconnected state', () => {
      const { result } = renderHook(() => useUltravoxVoice(), { wrapper: UltravoxWrapper });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSpeaking).toBe(false);
      expect(result.current.isListening).toBe(false);
      expect(result.current.isThinking).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.status).toBe('idle');
    });

    it('provides connect and disconnect functions', () => {
      const { result } = renderHook(() => useUltravoxVoice(), { wrapper: UltravoxWrapper });

      expect(typeof result.current.connect).toBe('function');
      expect(typeof result.current.disconnect).toBe('function');
    });

    it('provides toggleMic function', () => {
      const { result } = renderHook(() => useUltravoxVoice(), { wrapper: UltravoxWrapper });

      expect(typeof result.current.toggleMic).toBe('function');
    });

    it('provides clearError function', () => {
      const { result } = renderHook(() => useUltravoxVoice(), { wrapper: UltravoxWrapper });

      expect(typeof result.current.clearError).toBe('function');
    });

    it('has empty transcripts array initially', () => {
      const { result } = renderHook(() => useUltravoxVoice(), { wrapper: UltravoxWrapper });

      expect(result.current.transcripts).toEqual([]);
    });

    it('isMicMuted is false initially', () => {
      const { result } = renderHook(() => useUltravoxVoice(), { wrapper: UltravoxWrapper });

      expect(result.current.isMicMuted).toBe(false);
    });
  });

  describe('connection states', () => {
    it('sets loading state when connecting', async () => {
      const { result } = renderHook(() => useUltravoxVoice(), { wrapper: UltravoxWrapper });

      act(() => {
        result.current.connect();
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.status).toBe('connecting');
    });

    it('calls backend API to create call', async () => {
      const { result } = renderHook(() => useUltravoxVoice(), { wrapper: UltravoxWrapper });

      await act(async () => {
        await result.current.connect();
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/ultravox/call'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('creates UltravoxSession and joins call with joinUrl', async () => {
      const { result } = renderHook(() => useUltravoxVoice(), { wrapper: UltravoxWrapper });

      await act(async () => {
        await result.current.connect();
      });

      expect(ultravoxMocks.joinCall).toHaveBeenCalledWith('wss://mock-ultravox-url.com/call/123');
    });

    it('sets up event listeners on session', async () => {
      const { result } = renderHook(() => useUltravoxVoice(), { wrapper: UltravoxWrapper });

      await act(async () => {
        await result.current.connect();
      });

      expect(ultravoxMocks.addEventListener).toHaveBeenCalledWith('status', expect.any(Function));
      expect(ultravoxMocks.addEventListener).toHaveBeenCalledWith(
        'transcripts',
        expect.any(Function)
      );
    });

    it('prevents duplicate connections when already connected', async () => {
      const { result } = renderHook(() => useUltravoxVoice(), { wrapper: UltravoxWrapper });

      // First connect
      await act(async () => {
        await result.current.connect();
      });

      // Clear mocks to reset call counts
      mockFetch.mockClear();

      // Second connect should be ignored since already connected
      await act(async () => {
        await result.current.connect();
      });

      // Fetch should not be called again since already connecting/connected
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('throws error when useUltravoxVoice used outside provider', () => {
      expect(() => {
        renderHook(() => useUltravoxVoice());
      }).toThrow('useUltravoxVoice must be used within an UltravoxVoiceProvider');
    });

    it('sets error state when API call fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Server error' }),
      });

      const { result } = renderHook(() => useUltravoxVoice(), { wrapper: UltravoxWrapper });

      await act(async () => {
        await result.current.connect();
      });

      expect(result.current.error).toBe('Server error');
      expect(result.current.status).toBe('error');
    });

    it('sets error state when API returns non-JSON error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('Not JSON')),
      });

      const { result } = renderHook(() => useUltravoxVoice(), { wrapper: UltravoxWrapper });

      await act(async () => {
        await result.current.connect();
      });

      expect(result.current.error).toBe('Failed to create call');
    });

    it('clears error when clearError is called', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Test error' }),
      });

      const { result } = renderHook(() => useUltravoxVoice(), { wrapper: UltravoxWrapper });

      await act(async () => {
        await result.current.connect();
      });

      expect(result.current.error).toBe('Test error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('sets error when network request fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useUltravoxVoice(), { wrapper: UltravoxWrapper });

      await act(async () => {
        await result.current.connect();
      });

      expect(result.current.error).toBe('Network error');
    });
  });

  describe('disconnection', () => {
    it('calls leaveCall on session when disconnecting', async () => {
      const { result } = renderHook(() => useUltravoxVoice(), { wrapper: UltravoxWrapper });

      await act(async () => {
        await result.current.connect();
      });

      await act(async () => {
        await result.current.disconnect();
      });

      expect(ultravoxMocks.leaveCall).toHaveBeenCalled();
    });

    it('removes event listeners when disconnecting', async () => {
      const { result } = renderHook(() => useUltravoxVoice(), { wrapper: UltravoxWrapper });

      await act(async () => {
        await result.current.connect();
      });

      await act(async () => {
        await result.current.disconnect();
      });

      expect(ultravoxMocks.removeEventListener).toHaveBeenCalledWith(
        'status',
        expect.any(Function)
      );
      expect(ultravoxMocks.removeEventListener).toHaveBeenCalledWith(
        'transcripts',
        expect.any(Function)
      );
    });

    it('resets state to initial values after disconnect', async () => {
      const { result } = renderHook(() => useUltravoxVoice(), { wrapper: UltravoxWrapper });

      await act(async () => {
        await result.current.connect();
      });

      await act(async () => {
        await result.current.disconnect();
      });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.status).toBe('idle');
    });

    it('calls onDisconnect callback when provided', async () => {
      const onDisconnect = vi.fn();
      const wrapper = ({ children }: { children: ReactNode }) => (
        <UltravoxVoiceProvider onDisconnect={onDisconnect}>{children}</UltravoxVoiceProvider>
      );

      const { result } = renderHook(() => useUltravoxVoice(), { wrapper });

      await act(async () => {
        await result.current.connect();
      });

      await act(async () => {
        await result.current.disconnect();
      });

      expect(onDisconnect).toHaveBeenCalled();
    });
  });

  describe('microphone control', () => {
    it('toggles mic mute state', async () => {
      const { result } = renderHook(() => useUltravoxVoice(), { wrapper: UltravoxWrapper });

      await act(async () => {
        await result.current.connect();
      });

      expect(result.current.isMicMuted).toBe(false);

      act(() => {
        result.current.toggleMic();
      });

      expect(result.current.isMicMuted).toBe(true);
      expect(ultravoxMocks.muteMic).toHaveBeenCalled();
    });

    it('unmutes when toggled again', async () => {
      const { result } = renderHook(() => useUltravoxVoice(), { wrapper: UltravoxWrapper });

      await act(async () => {
        await result.current.connect();
      });

      act(() => {
        result.current.toggleMic();
      });

      act(() => {
        result.current.toggleMic();
      });

      expect(result.current.isMicMuted).toBe(false);
      expect(ultravoxMocks.unmuteMic).toHaveBeenCalled();
    });

    it('does nothing if no session exists', () => {
      const { result } = renderHook(() => useUltravoxVoice(), { wrapper: UltravoxWrapper });

      act(() => {
        result.current.toggleMic();
      });

      expect(ultravoxMocks.muteMic).not.toHaveBeenCalled();
      expect(ultravoxMocks.unmuteMic).not.toHaveBeenCalled();
    });
  });
});
