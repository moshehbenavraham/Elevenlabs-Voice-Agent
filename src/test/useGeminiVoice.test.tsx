/**
 * useGeminiVoice Hook Tests
 *
 * Unit tests for the Gemini voice hook and context:
 * - Connection lifecycle and status transitions
 * - Transcript accumulation and deduplication
 * - Session timer warnings and auto-disconnect
 * - Error handling
 * - Mute toggle behavior
 *
 * @see src/hooks/useGeminiVoice.ts
 * @see src/contexts/GeminiVoiceContext.tsx
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { type ReactNode } from 'react';
import { GeminiVoiceProvider } from '@/contexts/GeminiVoiceContext';
import { useGeminiVoice } from '@/hooks/useGeminiVoice';
import { GEMINI_SESSION_TIMERS, GEMINI_INITIAL_STATE } from '@/types/gemini';

// Mock timers for testing async behavior
vi.useFakeTimers();

// Mock fetch for token endpoint
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock GenAILiveClient
const mockClientOn = vi.fn();
const mockClientOff = vi.fn();
const mockClientConnect = vi.fn();
const mockClientDisconnect = vi.fn();
const mockClientSendRealtimeInput = vi.fn();
const mockClientSendToolResponse = vi.fn();

vi.mock('@/lib/gemini/genai-live-client', () => ({
  GenAILiveClient: class MockGenAILiveClient {
    isConnected = false;
    on = mockClientOn;
    off = mockClientOff;
    connect = mockClientConnect.mockImplementation(async () => {
      this.isConnected = true;
    });
    disconnect = mockClientDisconnect.mockImplementation(() => {
      this.isConnected = false;
    });
    sendRealtimeInput = mockClientSendRealtimeInput;
    sendToolResponse = mockClientSendToolResponse;
  },
}));

// Mock GeminiAudioRecorder
const mockRecorderOn = vi.fn();
const mockRecorderStart = vi.fn();
const mockRecorderStop = vi.fn();

vi.mock('@/lib/gemini/audio-recorder', () => ({
  GeminiAudioRecorder: class MockGeminiAudioRecorder {
    on = mockRecorderOn;
    start = mockRecorderStart.mockResolvedValue(undefined);
    stop = mockRecorderStop;
  },
}));

// Mock GeminiAudioStreamer
const mockStreamerOn = vi.fn();
const mockStreamerStart = vi.fn();
const mockStreamerStop = vi.fn();
const mockStreamerCleanup = vi.fn();
const mockStreamerSetVolume = vi.fn();
const mockStreamerAddPCM = vi.fn();

vi.mock('@/lib/gemini/audio-streamer', () => ({
  GeminiAudioStreamer: class MockGeminiAudioStreamer {
    on = mockStreamerOn;
    start = mockStreamerStart;
    stop = mockStreamerStop;
    cleanup = mockStreamerCleanup;
    setVolume = mockStreamerSetVolume;
    addPCM = mockStreamerAddPCM;
  },
}));

// Mock error tracking
vi.mock('@/lib/errorTracking', () => ({
  trackError: vi.fn(),
}));

// Helper wrapper for rendering hooks with context
const wrapper = ({ children }: { children: ReactNode }) => (
  <GeminiVoiceProvider>{children}</GeminiVoiceProvider>
);

// Helper to simulate client events
function simulateClientEvent(event: string, data?: unknown) {
  const handler = mockClientOn.mock.calls.find((call) => call[0] === event)?.[1];
  if (handler) {
    handler(data);
  }
}

describe('useGeminiVoice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();

    // Mock successful token fetch by default
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ token: 'test-token' }),
    });

    // Reset localStorage
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================
  // Hook Basic Tests
  // ===========================================
  describe('hook basics', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useGeminiVoice());
      }).toThrow('useGeminiVoice must be used within a GeminiVoiceProvider');

      consoleSpy.mockRestore();
    });

    it('should return initial state', () => {
      const { result } = renderHook(() => useGeminiVoice(), { wrapper });

      expect(result.current.status).toBe('idle');
      expect(result.current.isConnected).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSpeaking).toBe(false);
      expect(result.current.isListening).toBe(false);
      expect(result.current.isThinking).toBe(false);
      expect(result.current.isMuted).toBe(false);
      expect(result.current.messages).toEqual([]);
      expect(result.current.activeTranscript).toBe('');
      expect(result.current.error).toBeNull();
      expect(result.current.sessionDuration).toBe(0);
      expect(result.current.sessionWarning).toBeNull();
    });

    it('should provide control functions', () => {
      const { result } = renderHook(() => useGeminiVoice(), { wrapper });

      expect(typeof result.current.connect).toBe('function');
      expect(typeof result.current.disconnect).toBe('function');
      expect(typeof result.current.toggleMute).toBe('function');
      expect(typeof result.current.sendText).toBe('function');
      expect(typeof result.current.setVolume).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
      expect(typeof result.current.getAnalyserNode).toBe('function');
      expect(typeof result.current.setVoice).toBe('function');
      expect(typeof result.current.setSystemPrompt).toBe('function');
    });
  });

  // ===========================================
  // Connection Lifecycle Tests
  // ===========================================
  describe('connection lifecycle', () => {
    it('should transition to connecting when connect is called', async () => {
      const { result } = renderHook(() => useGeminiVoice(), { wrapper });

      act(() => {
        result.current.connect();
      });

      expect(result.current.status).toBe('connecting');
      expect(result.current.isLoading).toBe(true);
    });

    it('should transition to connected after setup complete', async () => {
      const { result } = renderHook(() => useGeminiVoice(), { wrapper });

      await act(async () => {
        await result.current.connect();
      });

      // Simulate setupComplete event
      act(() => {
        simulateClientEvent('setupComplete');
      });

      expect(result.current.status).toBe('connected');
      expect(result.current.isConnected).toBe(true);
      expect(result.current.isListening).toBe(true);
    });

    it('should not connect if already connecting', async () => {
      const { result } = renderHook(() => useGeminiVoice(), { wrapper });

      act(() => {
        result.current.connect();
      });

      // Second call should be ignored
      act(() => {
        result.current.connect();
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should transition to idle on disconnect', async () => {
      const { result } = renderHook(() => useGeminiVoice(), { wrapper });

      await act(async () => {
        await result.current.connect();
      });

      act(() => {
        simulateClientEvent('setupComplete');
      });

      await act(async () => {
        await result.current.disconnect();
      });

      expect(result.current.status).toBe('idle');
      expect(result.current.isConnected).toBe(false);
    });

    it('should handle token fetch failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Unauthorized' }),
      });

      const { result } = renderHook(() => useGeminiVoice(), { wrapper });

      await act(async () => {
        await result.current.connect();
      });

      expect(result.current.status).toBe('error');
      expect(result.current.error).toBe('Unauthorized');
    });
  });

  // ===========================================
  // Status Transition Tests
  // ===========================================
  describe('status transitions', () => {
    it('should transition to listening when user starts speaking', async () => {
      const { result } = renderHook(() => useGeminiVoice(), { wrapper });

      await act(async () => {
        await result.current.connect();
      });

      act(() => {
        simulateClientEvent('setupComplete');
      });

      // Simulate user transcription (indicates user is speaking)
      act(() => {
        simulateClientEvent('transcription', { text: 'Hello', type: 'input' });
      });

      expect(result.current.status).toBe('listening');
      expect(result.current.isListening).toBe(true);
    });

    it('should transition to thinking after 300ms delay', async () => {
      const { result } = renderHook(() => useGeminiVoice(), { wrapper });

      await act(async () => {
        await result.current.connect();
      });

      act(() => {
        simulateClientEvent('setupComplete');
      });

      // Simulate user transcription
      act(() => {
        simulateClientEvent('transcription', { text: 'Hello', type: 'input' });
      });

      // Advance past thinking delay
      await act(async () => {
        await vi.advanceTimersByTimeAsync(GEMINI_SESSION_TIMERS.THINKING_DELAY_MS + 10);
      });

      expect(result.current.status).toBe('thinking');
      expect(result.current.isThinking).toBe(true);
    });

    it('should transition to speaking when audio arrives', async () => {
      const { result } = renderHook(() => useGeminiVoice(), { wrapper });

      await act(async () => {
        await result.current.connect();
      });

      act(() => {
        simulateClientEvent('setupComplete');
      });

      // Simulate audio event
      act(() => {
        simulateClientEvent('audio', { audio: 'base64audio', mimeType: 'audio/pcm' });
      });

      expect(result.current.status).toBe('speaking');
      expect(result.current.isSpeaking).toBe(true);
      expect(result.current.isThinking).toBe(false);
    });

    it('should transition back to connected on turn complete', async () => {
      const { result } = renderHook(() => useGeminiVoice(), { wrapper });

      await act(async () => {
        await result.current.connect();
      });

      act(() => {
        simulateClientEvent('setupComplete');
      });

      // Simulate speaking state
      act(() => {
        simulateClientEvent('audio', { audio: 'base64audio', mimeType: 'audio/pcm' });
      });

      // Simulate turn complete
      act(() => {
        simulateClientEvent('turnComplete');
      });

      expect(result.current.status).toBe('connected');
      expect(result.current.isSpeaking).toBe(false);
      expect(result.current.isListening).toBe(true);
    });
  });

  // ===========================================
  // Transcript Accumulation Tests
  // ===========================================
  describe('transcript accumulation', () => {
    it('should add user message on input transcription', async () => {
      const { result } = renderHook(() => useGeminiVoice(), { wrapper });

      await act(async () => {
        await result.current.connect();
      });

      act(() => {
        simulateClientEvent('setupComplete');
      });

      act(() => {
        simulateClientEvent('transcription', { text: 'Hello Gemini', type: 'input' });
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].role).toBe('user');
      expect(result.current.messages[0].content).toBe('Hello Gemini');
    });

    it('should track partial output transcription in activeTranscript', async () => {
      const { result } = renderHook(() => useGeminiVoice(), { wrapper });

      await act(async () => {
        await result.current.connect();
      });

      act(() => {
        simulateClientEvent('setupComplete');
      });

      act(() => {
        simulateClientEvent('transcription', { text: 'I am responding', type: 'output' });
      });

      expect(result.current.activeTranscript).toBe('I am responding');
    });

    it('should commit assistant message on turn complete', async () => {
      const { result } = renderHook(() => useGeminiVoice(), { wrapper });

      await act(async () => {
        await result.current.connect();
      });

      act(() => {
        simulateClientEvent('setupComplete');
      });

      // Simulate output transcription
      act(() => {
        simulateClientEvent('transcription', { text: 'Hello! How can I help?', type: 'output' });
      });

      // Turn complete should commit the message
      act(() => {
        simulateClientEvent('turnComplete');
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].role).toBe('assistant');
      expect(result.current.messages[0].content).toBe('Hello! How can I help?');
      expect(result.current.activeTranscript).toBe('');
    });

    it('should not duplicate messages on turn complete', async () => {
      const { result } = renderHook(() => useGeminiVoice(), { wrapper });

      await act(async () => {
        await result.current.connect();
      });

      act(() => {
        simulateClientEvent('setupComplete');
      });

      // Simulate output transcription
      act(() => {
        simulateClientEvent('transcription', { text: 'Same message', type: 'output' });
      });

      // Multiple turn completes with same content
      act(() => {
        simulateClientEvent('turnComplete');
      });

      act(() => {
        simulateClientEvent('turnComplete');
      });

      // Should only have one message
      expect(result.current.messages).toHaveLength(1);
    });

    it('should ignore empty transcriptions', async () => {
      const { result } = renderHook(() => useGeminiVoice(), { wrapper });

      await act(async () => {
        await result.current.connect();
      });

      act(() => {
        simulateClientEvent('setupComplete');
      });

      act(() => {
        simulateClientEvent('transcription', { text: '', type: 'input' });
      });

      act(() => {
        simulateClientEvent('transcription', { text: '   ', type: 'input' });
      });

      expect(result.current.messages).toHaveLength(0);
    });
  });

  // ===========================================
  // Session Timer Tests
  // ===========================================
  describe('session timer', () => {
    it('should track session duration', async () => {
      const { result } = renderHook(() => useGeminiVoice(), { wrapper });

      await act(async () => {
        await result.current.connect();
      });

      act(() => {
        simulateClientEvent('setupComplete');
      });

      // Advance time by 5 seconds
      await act(async () => {
        await vi.advanceTimersByTimeAsync(5000);
      });

      expect(result.current.sessionDuration).toBeGreaterThanOrEqual(5);
    });

    it('should set warning at 12 minutes', async () => {
      const { result } = renderHook(() => useGeminiVoice(), { wrapper });

      await act(async () => {
        await result.current.connect();
      });

      act(() => {
        simulateClientEvent('setupComplete');
      });

      // Advance to 12 minutes
      await act(async () => {
        await vi.advanceTimersByTimeAsync(GEMINI_SESSION_TIMERS.WARNING_SECONDS * 1000);
      });

      expect(result.current.sessionWarning).toBe('warning');
    });

    it('should set urgent warning at 14 minutes', async () => {
      const { result } = renderHook(() => useGeminiVoice(), { wrapper });

      await act(async () => {
        await result.current.connect();
      });

      act(() => {
        simulateClientEvent('setupComplete');
      });

      // Advance to 14 minutes
      await act(async () => {
        await vi.advanceTimersByTimeAsync(GEMINI_SESSION_TIMERS.URGENT_SECONDS * 1000);
      });

      expect(result.current.sessionWarning).toBe('urgent');
    });

    it('should auto-disconnect at 15 minutes', async () => {
      const { result } = renderHook(() => useGeminiVoice(), { wrapper });

      await act(async () => {
        await result.current.connect();
      });

      act(() => {
        simulateClientEvent('setupComplete');
      });

      // Advance to 15 minutes + a bit more to trigger the effect
      await act(async () => {
        await vi.advanceTimersByTimeAsync(GEMINI_SESSION_TIMERS.DISCONNECT_SECONDS * 1000 + 1000);
      });

      // The auto-disconnect is triggered by a useEffect watching sessionDuration
      expect(result.current.status).toBe('idle');
    }, 10000);

    it('should reset session timer on disconnect', async () => {
      const { result } = renderHook(() => useGeminiVoice(), { wrapper });

      await act(async () => {
        await result.current.connect();
      });

      act(() => {
        simulateClientEvent('setupComplete');
      });

      // Advance some time
      await act(async () => {
        await vi.advanceTimersByTimeAsync(10000);
      });

      await act(async () => {
        await result.current.disconnect();
      });

      expect(result.current.sessionDuration).toBe(0);
      expect(result.current.sessionWarning).toBeNull();
    });
  });

  // ===========================================
  // Error Handling Tests
  // ===========================================
  describe('error handling', () => {
    it('should set error on client error event', async () => {
      const { result } = renderHook(() => useGeminiVoice(), { wrapper });

      await act(async () => {
        await result.current.connect();
      });

      act(() => {
        simulateClientEvent('setupComplete');
      });

      act(() => {
        // When error.error is provided, parseGeminiError is called
        simulateClientEvent('error', {
          code: 'WEBSOCKET_ERROR',
          message: 'Connection lost',
          error: new Error('websocket connection failed'),
        });
      });

      // parseGeminiError returns "Connection lost. Please try again." for websocket errors
      expect(result.current.error).toBe('Connection lost. Please try again.');
    });

    it('should clear error with clearError', async () => {
      const { result } = renderHook(() => useGeminiVoice(), { wrapper });

      await act(async () => {
        await result.current.connect();
      });

      act(() => {
        simulateClientEvent('error', {
          code: 'WEBSOCKET_ERROR',
          message: 'Connection lost',
        });
      });

      expect(result.current.error).not.toBeNull();

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useGeminiVoice(), { wrapper });

      await act(async () => {
        await result.current.connect();
      });

      expect(result.current.status).toBe('error');
      expect(result.current.error).toContain('Network');
    });
  });

  // ===========================================
  // Mute Toggle Tests
  // ===========================================
  describe('mute toggle', () => {
    it('should toggle mute state', async () => {
      const { result } = renderHook(() => useGeminiVoice(), { wrapper });

      expect(result.current.isMuted).toBe(false);

      act(() => {
        result.current.toggleMute();
      });

      expect(result.current.isMuted).toBe(true);

      act(() => {
        result.current.toggleMute();
      });

      expect(result.current.isMuted).toBe(false);
    });
  });

  // ===========================================
  // Barge-in (Interrupted) Tests
  // ===========================================
  describe('barge-in handling', () => {
    it('should clear speaking state on interrupted event', async () => {
      const { result } = renderHook(() => useGeminiVoice(), { wrapper });

      await act(async () => {
        await result.current.connect();
      });

      act(() => {
        simulateClientEvent('setupComplete');
      });

      // Start speaking
      act(() => {
        simulateClientEvent('audio', { audio: 'base64audio', mimeType: 'audio/pcm' });
      });

      expect(result.current.isSpeaking).toBe(true);

      // User interrupts
      act(() => {
        simulateClientEvent('interrupted');
      });

      expect(result.current.isSpeaking).toBe(false);
      expect(result.current.status).toBe('listening');
    });

    it('should stop audio streamer on interrupted', async () => {
      const { result } = renderHook(() => useGeminiVoice(), { wrapper });

      await act(async () => {
        await result.current.connect();
      });

      act(() => {
        simulateClientEvent('setupComplete');
      });

      act(() => {
        simulateClientEvent('interrupted');
      });

      expect(mockStreamerStop).toHaveBeenCalled();
    });

    it('should clear active transcript on interrupted', async () => {
      const { result } = renderHook(() => useGeminiVoice(), { wrapper });

      await act(async () => {
        await result.current.connect();
      });

      act(() => {
        simulateClientEvent('setupComplete');
      });

      act(() => {
        simulateClientEvent('transcription', { text: 'Partial response...', type: 'output' });
      });

      expect(result.current.activeTranscript).toBe('Partial response...');

      act(() => {
        simulateClientEvent('interrupted');
      });

      expect(result.current.activeTranscript).toBe('');
    });
  });

  // ===========================================
  // Volume Control Tests
  // ===========================================
  describe('volume control', () => {
    it('should set volume', async () => {
      const { result } = renderHook(() => useGeminiVoice(), { wrapper });

      act(() => {
        result.current.setVolume(0.5);
      });

      expect(result.current.volume).toBe(0.5);
    });

    it('should clamp volume to 0-1 range', async () => {
      const { result } = renderHook(() => useGeminiVoice(), { wrapper });

      act(() => {
        result.current.setVolume(1.5);
      });

      expect(result.current.volume).toBe(1);

      act(() => {
        result.current.setVolume(-0.5);
      });

      expect(result.current.volume).toBe(0);
    });

    it('should update streamer volume when connected', async () => {
      const { result } = renderHook(() => useGeminiVoice(), { wrapper });

      await act(async () => {
        await result.current.connect();
      });

      act(() => {
        result.current.setVolume(0.3);
      });

      expect(mockStreamerSetVolume).toHaveBeenCalledWith(0.3);
    });
  });

  // ===========================================
  // Voice and Prompt Persistence Tests
  // ===========================================
  describe('voice and prompt persistence', () => {
    it('should persist voice selection to localStorage', async () => {
      const { result } = renderHook(() => useGeminiVoice(), { wrapper });

      act(() => {
        result.current.setVoice('Zephyr');
      });

      expect(localStorage.getItem('gemini-voice')).toBe('Zephyr');
    });

    it('should persist system prompt to localStorage', async () => {
      const { result } = renderHook(() => useGeminiVoice(), { wrapper });

      act(() => {
        result.current.setSystemPrompt('Custom prompt');
      });

      expect(localStorage.getItem('gemini-system-prompt')).toBe('Custom prompt');
    });

    it('should load voice from localStorage on mount', async () => {
      localStorage.setItem('gemini-voice', 'Aoede');

      const { result } = renderHook(() => useGeminiVoice(), { wrapper });

      expect(result.current.selectedVoice).toBe('Aoede');
    });

    it('should load system prompt from localStorage on mount', async () => {
      localStorage.setItem('gemini-system-prompt', 'Saved prompt');

      const { result } = renderHook(() => useGeminiVoice(), { wrapper });

      expect(result.current.systemPrompt).toBe('Saved prompt');
    });
  });

  // ===========================================
  // Initial State Constant Tests
  // ===========================================
  describe('GEMINI_INITIAL_STATE', () => {
    it('should have correct default values', () => {
      expect(GEMINI_INITIAL_STATE.status).toBe('idle');
      expect(GEMINI_INITIAL_STATE.isConnected).toBe(false);
      expect(GEMINI_INITIAL_STATE.isLoading).toBe(false);
      expect(GEMINI_INITIAL_STATE.isSpeaking).toBe(false);
      expect(GEMINI_INITIAL_STATE.isListening).toBe(false);
      expect(GEMINI_INITIAL_STATE.isThinking).toBe(false);
      expect(GEMINI_INITIAL_STATE.isMuted).toBe(false);
      expect(GEMINI_INITIAL_STATE.messages).toEqual([]);
      expect(GEMINI_INITIAL_STATE.activeTranscript).toBe('');
      expect(GEMINI_INITIAL_STATE.pendingFunctionCall).toBeNull();
      expect(GEMINI_INITIAL_STATE.error).toBeNull();
      expect(GEMINI_INITIAL_STATE.sessionDuration).toBe(0);
      expect(GEMINI_INITIAL_STATE.sessionWarning).toBeNull();
      expect(GEMINI_INITIAL_STATE.volume).toBe(0.7);
    });
  });

  // ===========================================
  // Session Timer Constants Tests
  // ===========================================
  describe('GEMINI_SESSION_TIMERS', () => {
    it('should have correct warning threshold (12 min)', () => {
      expect(GEMINI_SESSION_TIMERS.WARNING_SECONDS).toBe(12 * 60);
    });

    it('should have correct urgent threshold (14 min)', () => {
      expect(GEMINI_SESSION_TIMERS.URGENT_SECONDS).toBe(14 * 60);
    });

    it('should have correct disconnect threshold (15 min)', () => {
      expect(GEMINI_SESSION_TIMERS.DISCONNECT_SECONDS).toBe(15 * 60);
    });

    it('should have correct thinking delay (300ms)', () => {
      expect(GEMINI_SESSION_TIMERS.THINKING_DELAY_MS).toBe(300);
    });
  });
});
