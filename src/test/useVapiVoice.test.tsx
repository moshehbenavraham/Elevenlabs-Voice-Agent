/**
 * useVapiVoice Hook Tests
 *
 * Unit tests for the Vapi voice hook covering:
 * - Initial state
 * - Connection lifecycle (start, stop, toggle)
 * - Event handling (call-start, call-end, speech, volume, message, error)
 * - Transcript handling (partial vs final)
 * - Cleanup and edge cases
 *
 * Note: The hook must be used within VapiVoiceProvider, so we wrap all
 * renderHook calls with the provider.
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useVapiVoice } from '@/hooks/useVapiVoice';
import { VapiVoiceProvider } from '@/contexts/VapiVoiceContext';
import { VapiCallStatus, VapiMessageType, VapiTranscriptType, VapiMessageRole } from '@/types/vapi';
import { vapiMocks } from './setup';
import type { ReactNode } from 'react';

// Mock the vapi singleton module
vi.mock('@/lib/vapi', () => ({
  vapi: {
    start: vi.fn((...args: unknown[]) => vapiMocks.start(...args)),
    stop: vi.fn(() => vapiMocks.stop()),
    getDailyCallObject: vi.fn(() => vapiMocks.getDailyCallObject()),
    on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      if (!vapiMocks.eventHandlers.has(event)) {
        vapiMocks.eventHandlers.set(event, new Set());
      }
      vapiMocks.eventHandlers.get(event)?.add(handler);
      vapiMocks.on(event, handler);
    }),
    off: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      vapiMocks.eventHandlers.get(event)?.delete(handler);
      vapiMocks.off(event, handler);
    }),
  },
  getVapiDebugInfo: vi.fn().mockReturnValue({
    sdkInitialized: true,
    webTokenConfigured: true,
    audioContext: null,
    dailyCallObject: null,
  }),
}));

// Wrapper component that provides VapiVoiceProvider
function TestWrapper({ children }: { children: ReactNode }) {
  return <VapiVoiceProvider>{children}</VapiVoiceProvider>;
}

describe('useVapiVoice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vapiMocks.reset();
  });

  afterEach(() => {
    vapiMocks.reset();
  });

  // ===========================================
  // T008: Initial State Tests
  // ===========================================
  describe('initial state', () => {
    it('returns callStatus as INACTIVE initially', () => {
      const { result } = renderHook(() => useVapiVoice(), { wrapper: TestWrapper });
      expect(result.current.callStatus).toBe(VapiCallStatus.INACTIVE);
    });

    it('returns isSpeechActive as false initially', () => {
      const { result } = renderHook(() => useVapiVoice(), { wrapper: TestWrapper });
      expect(result.current.isSpeechActive).toBe(false);
    });

    it('returns empty messages array initially', () => {
      const { result } = renderHook(() => useVapiVoice(), { wrapper: TestWrapper });
      expect(result.current.messages).toEqual([]);
    });

    it('returns null activeTranscript initially', () => {
      const { result } = renderHook(() => useVapiVoice(), { wrapper: TestWrapper });
      expect(result.current.activeTranscript).toBeNull();
    });

    it('returns audioLevel as 0 initially', () => {
      const { result } = renderHook(() => useVapiVoice(), { wrapper: TestWrapper });
      expect(result.current.audioLevel).toBe(0);
    });

    it('returns null error initially (when SDK is initialized)', () => {
      const { result } = renderHook(() => useVapiVoice(), { wrapper: TestWrapper });
      // Error may be set if vapi is null, but with our mock it should be null
      expect(result.current.error).toBeNull();
    });

    it('provides start, stop, and toggleCall functions', () => {
      const { result } = renderHook(() => useVapiVoice(), { wrapper: TestWrapper });
      expect(typeof result.current.start).toBe('function');
      expect(typeof result.current.stop).toBe('function');
      expect(typeof result.current.toggleCall).toBe('function');
    });
  });

  // ===========================================
  // T009: Connection Tests
  // ===========================================
  describe('connection lifecycle', () => {
    it('sets callStatus to LOADING when start() is called', async () => {
      const { result } = renderHook(() => useVapiVoice(), { wrapper: TestWrapper });

      act(() => {
        result.current.start();
      });

      expect(result.current.callStatus).toBe(VapiCallStatus.LOADING);
    });

    it('calls vapi.start when start() is called', async () => {
      const { result } = renderHook(() => useVapiVoice(), { wrapper: TestWrapper });

      await act(async () => {
        await result.current.start();
      });

      expect(vapiMocks.start).toHaveBeenCalled();
    });

    it('passes assistant ID to vapi.start when provided as string', async () => {
      const { result } = renderHook(() => useVapiVoice(), { wrapper: TestWrapper });

      await act(async () => {
        await result.current.start('asst_123');
      });

      // vapi.start() uses POSITIONAL parameters - assistant ID string is first param
      expect(vapiMocks.start).toHaveBeenCalledWith('asst_123');
    });

    it('passes assistantId from config object to vapi.start', async () => {
      const { result } = renderHook(() => useVapiVoice(), { wrapper: TestWrapper });

      await act(async () => {
        await result.current.start({ assistantId: 'asst_456' });
      });

      // vapi.start() uses POSITIONAL parameters - extracts assistantId from config
      expect(vapiMocks.start).toHaveBeenCalledWith('asst_456');
    });

    it('sets callStatus to LOADING when stop() is called while connected', async () => {
      const { result } = renderHook(() => useVapiVoice(), { wrapper: TestWrapper });

      // Start and simulate call-start event
      await act(async () => {
        await result.current.start();
        vapiMocks.emit('call-start');
      });

      expect(result.current.callStatus).toBe(VapiCallStatus.ACTIVE);

      act(() => {
        result.current.stop();
      });

      expect(result.current.callStatus).toBe(VapiCallStatus.LOADING);
    });

    it('calls vapi.stop when stop() is called', async () => {
      const { result } = renderHook(() => useVapiVoice(), { wrapper: TestWrapper });

      // Start and connect
      await act(async () => {
        await result.current.start();
        vapiMocks.emit('call-start');
      });

      act(() => {
        result.current.stop();
      });

      expect(vapiMocks.stop).toHaveBeenCalled();
    });

    it('does not call stop when already inactive', () => {
      const { result } = renderHook(() => useVapiVoice(), { wrapper: TestWrapper });

      act(() => {
        result.current.stop();
      });

      expect(vapiMocks.stop).not.toHaveBeenCalled();
    });

    it('toggleCall starts when inactive', async () => {
      const { result } = renderHook(() => useVapiVoice(), { wrapper: TestWrapper });

      act(() => {
        result.current.toggleCall();
      });

      expect(result.current.callStatus).toBe(VapiCallStatus.LOADING);
      expect(vapiMocks.start).toHaveBeenCalled();
    });

    it('toggleCall stops when active', async () => {
      const { result } = renderHook(() => useVapiVoice(), { wrapper: TestWrapper });

      // Start and connect
      await act(async () => {
        await result.current.start();
        vapiMocks.emit('call-start');
      });

      act(() => {
        result.current.toggleCall();
      });

      expect(vapiMocks.stop).toHaveBeenCalled();
    });

    it('toggleCall does nothing when loading', async () => {
      const { result } = renderHook(() => useVapiVoice(), { wrapper: TestWrapper });

      act(() => {
        result.current.start();
      });

      expect(result.current.callStatus).toBe(VapiCallStatus.LOADING);

      // Clear mocks to verify no additional calls
      vapiMocks.start.mockClear();
      vapiMocks.stop.mockClear();

      act(() => {
        result.current.toggleCall();
      });

      expect(vapiMocks.start).not.toHaveBeenCalled();
      expect(vapiMocks.stop).not.toHaveBeenCalled();
    });
  });

  // ===========================================
  // T010: Event Handling Tests
  // ===========================================
  describe('event handling', () => {
    it('sets callStatus to ACTIVE on call-start event', async () => {
      const { result } = renderHook(() => useVapiVoice(), { wrapper: TestWrapper });

      await act(async () => {
        await result.current.start();
        vapiMocks.emit('call-start');
      });

      expect(result.current.callStatus).toBe(VapiCallStatus.ACTIVE);
    });

    it('clears error on call-start event', async () => {
      const { result } = renderHook(() => useVapiVoice(), { wrapper: TestWrapper });

      // Simulate an error first
      await act(async () => {
        vapiMocks.emit('error', new Error('Test error'));
      });

      // Start and get call-start
      await act(async () => {
        await result.current.start();
        vapiMocks.emit('call-start');
      });

      expect(result.current.error).toBeNull();
    });

    it('clears messages on call-start event', async () => {
      const { result } = renderHook(() => useVapiVoice(), { wrapper: TestWrapper });

      // Add a message first
      await act(async () => {
        await result.current.start();
        vapiMocks.emit('call-start');
        vapiMocks.emit('message', {
          type: VapiMessageType.TRANSCRIPT,
          role: VapiMessageRole.USER,
          transcriptType: VapiTranscriptType.FINAL,
          transcript: 'Hello',
        });
      });

      expect(result.current.messages.length).toBe(1);

      // New call should clear messages
      await act(async () => {
        vapiMocks.emit('call-end');
        await result.current.start();
        vapiMocks.emit('call-start');
      });

      expect(result.current.messages).toEqual([]);
    });

    it('sets callStatus to INACTIVE on call-end event', async () => {
      const { result } = renderHook(() => useVapiVoice(), { wrapper: TestWrapper });

      await act(async () => {
        await result.current.start();
        vapiMocks.emit('call-start');
      });

      expect(result.current.callStatus).toBe(VapiCallStatus.ACTIVE);

      await act(async () => {
        vapiMocks.emit('call-end');
      });

      expect(result.current.callStatus).toBe(VapiCallStatus.INACTIVE);
    });

    it('clears activeTranscript on call-end event', async () => {
      const { result } = renderHook(() => useVapiVoice(), { wrapper: TestWrapper });

      await act(async () => {
        await result.current.start();
        vapiMocks.emit('call-start');
        // Emit partial transcript
        vapiMocks.emit('message', {
          type: VapiMessageType.TRANSCRIPT,
          role: VapiMessageRole.ASSISTANT,
          transcriptType: VapiTranscriptType.PARTIAL,
          transcript: 'Hello...',
        });
      });

      expect(result.current.activeTranscript).not.toBeNull();

      await act(async () => {
        vapiMocks.emit('call-end');
      });

      expect(result.current.activeTranscript).toBeNull();
    });

    it('sets isSpeechActive to true on speech-start event', async () => {
      const { result } = renderHook(() => useVapiVoice(), { wrapper: TestWrapper });

      await act(async () => {
        await result.current.start();
        vapiMocks.emit('call-start');
        vapiMocks.emit('speech-start');
      });

      expect(result.current.isSpeechActive).toBe(true);
    });

    it('sets isSpeechActive to false on speech-end event', async () => {
      const { result } = renderHook(() => useVapiVoice(), { wrapper: TestWrapper });

      await act(async () => {
        await result.current.start();
        vapiMocks.emit('call-start');
        vapiMocks.emit('speech-start');
      });

      expect(result.current.isSpeechActive).toBe(true);

      await act(async () => {
        vapiMocks.emit('speech-end');
      });

      expect(result.current.isSpeechActive).toBe(false);
    });

    it('updates audioLevel on volume-level event', async () => {
      const { result } = renderHook(() => useVapiVoice(), { wrapper: TestWrapper });

      await act(async () => {
        await result.current.start();
        vapiMocks.emit('call-start');
        vapiMocks.emit('volume-level', 0.75);
      });

      expect(result.current.audioLevel).toBe(0.75);
    });

    it('sets error on error event', async () => {
      const { result } = renderHook(() => useVapiVoice(), { wrapper: TestWrapper });

      await act(async () => {
        vapiMocks.emit('error', new Error('Connection failed'));
      });

      expect(result.current.error).toBe('Connection failed');
    });

    it('sets callStatus to INACTIVE on error event', async () => {
      const { result } = renderHook(() => useVapiVoice(), { wrapper: TestWrapper });

      await act(async () => {
        await result.current.start();
        vapiMocks.emit('call-start');
      });

      expect(result.current.callStatus).toBe(VapiCallStatus.ACTIVE);

      await act(async () => {
        vapiMocks.emit('error', new Error('Connection lost'));
      });

      expect(result.current.callStatus).toBe(VapiCallStatus.INACTIVE);
    });

    it('handles error objects with message property', async () => {
      const { result } = renderHook(() => useVapiVoice(), { wrapper: TestWrapper });

      await act(async () => {
        vapiMocks.emit('error', { message: 'Custom error message' });
      });

      expect(result.current.error).toBe('Custom error message');
    });

    it('handles unknown error types', async () => {
      const { result } = renderHook(() => useVapiVoice(), { wrapper: TestWrapper });

      await act(async () => {
        vapiMocks.emit('error', 'string error');
      });

      expect(result.current.error).toBe('Unknown error occurred');
    });
  });

  // ===========================================
  // T011: Transcript Tests
  // ===========================================
  describe('transcript handling', () => {
    it('stores partial transcript in activeTranscript', async () => {
      const { result } = renderHook(() => useVapiVoice(), { wrapper: TestWrapper });

      const partialMessage = {
        type: VapiMessageType.TRANSCRIPT,
        role: VapiMessageRole.ASSISTANT,
        transcriptType: VapiTranscriptType.PARTIAL,
        transcript: 'Hello, how can I...',
      };

      await act(async () => {
        await result.current.start();
        vapiMocks.emit('call-start');
        vapiMocks.emit('message', partialMessage);
      });

      expect(result.current.activeTranscript).toEqual(partialMessage);
      expect(result.current.messages).toEqual([]); // Partial should not be in messages
    });

    it('adds final transcript to messages array', async () => {
      const { result } = renderHook(() => useVapiVoice(), { wrapper: TestWrapper });

      const finalMessage = {
        type: VapiMessageType.TRANSCRIPT,
        role: VapiMessageRole.ASSISTANT,
        transcriptType: VapiTranscriptType.FINAL,
        transcript: 'Hello, how can I help you?',
      };

      await act(async () => {
        await result.current.start();
        vapiMocks.emit('call-start');
        vapiMocks.emit('message', finalMessage);
      });

      expect(result.current.messages).toContainEqual(finalMessage);
    });

    it('clears activeTranscript when final transcript arrives', async () => {
      const { result } = renderHook(() => useVapiVoice(), { wrapper: TestWrapper });

      await act(async () => {
        await result.current.start();
        vapiMocks.emit('call-start');
        // Partial first
        vapiMocks.emit('message', {
          type: VapiMessageType.TRANSCRIPT,
          role: VapiMessageRole.ASSISTANT,
          transcriptType: VapiTranscriptType.PARTIAL,
          transcript: 'Hello...',
        });
      });

      expect(result.current.activeTranscript).not.toBeNull();

      await act(async () => {
        // Then final
        vapiMocks.emit('message', {
          type: VapiMessageType.TRANSCRIPT,
          role: VapiMessageRole.ASSISTANT,
          transcriptType: VapiTranscriptType.FINAL,
          transcript: 'Hello, how can I help?',
        });
      });

      expect(result.current.activeTranscript).toBeNull();
    });

    it('handles user transcripts', async () => {
      const { result } = renderHook(() => useVapiVoice(), { wrapper: TestWrapper });

      const userMessage = {
        type: VapiMessageType.TRANSCRIPT,
        role: VapiMessageRole.USER,
        transcriptType: VapiTranscriptType.FINAL,
        transcript: 'What is the weather?',
      };

      await act(async () => {
        await result.current.start();
        vapiMocks.emit('call-start');
        vapiMocks.emit('message', userMessage);
      });

      expect(result.current.messages).toContainEqual(userMessage);
    });

    it('handles function call messages', async () => {
      const { result } = renderHook(() => useVapiVoice(), { wrapper: TestWrapper });

      const functionCallMessage = {
        type: VapiMessageType.FUNCTION_CALL,
        functionCall: {
          name: 'get_weather',
          parameters: { location: 'New York' },
        },
      };

      await act(async () => {
        await result.current.start();
        vapiMocks.emit('call-start');
        vapiMocks.emit('message', functionCallMessage);
      });

      expect(result.current.messages).toContainEqual(functionCallMessage);
    });

    it('accumulates multiple messages', async () => {
      const { result } = renderHook(() => useVapiVoice(), { wrapper: TestWrapper });

      await act(async () => {
        await result.current.start();
        vapiMocks.emit('call-start');
        vapiMocks.emit('message', {
          type: VapiMessageType.TRANSCRIPT,
          role: VapiMessageRole.USER,
          transcriptType: VapiTranscriptType.FINAL,
          transcript: 'Hello',
        });
        vapiMocks.emit('message', {
          type: VapiMessageType.TRANSCRIPT,
          role: VapiMessageRole.ASSISTANT,
          transcriptType: VapiTranscriptType.FINAL,
          transcript: 'Hi there!',
        });
      });

      expect(result.current.messages.length).toBe(2);
    });
  });

  // ===========================================
  // T012: Cleanup and Edge Cases
  // ===========================================
  describe('cleanup and edge cases', () => {
    it('removes event listeners on unmount', () => {
      const { unmount } = renderHook(() => useVapiVoice(), { wrapper: TestWrapper });

      unmount();

      // Should have called off for each event type
      expect(vapiMocks.off).toHaveBeenCalledWith('call-start', expect.any(Function));
      expect(vapiMocks.off).toHaveBeenCalledWith('call-end', expect.any(Function));
      expect(vapiMocks.off).toHaveBeenCalledWith('speech-start', expect.any(Function));
      expect(vapiMocks.off).toHaveBeenCalledWith('speech-end', expect.any(Function));
      expect(vapiMocks.off).toHaveBeenCalledWith('volume-level', expect.any(Function));
      expect(vapiMocks.off).toHaveBeenCalledWith('message', expect.any(Function));
      expect(vapiMocks.off).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('prevents duplicate start when already active', async () => {
      const { result } = renderHook(() => useVapiVoice(), { wrapper: TestWrapper });

      await act(async () => {
        await result.current.start();
        vapiMocks.emit('call-start');
      });

      expect(result.current.callStatus).toBe(VapiCallStatus.ACTIVE);

      // Clear mock to check if it's called again
      vapiMocks.start.mockClear();

      await act(async () => {
        await result.current.start();
      });

      // Should not call start again when already active
      expect(vapiMocks.start).not.toHaveBeenCalled();
    });

    it('handles start error gracefully', async () => {
      const { result } = renderHook(() => useVapiVoice(), { wrapper: TestWrapper });

      vapiMocks.start.mockRejectedValueOnce(new Error('Failed to start'));

      await act(async () => {
        await result.current.start();
      });

      expect(result.current.error).toBe('Failed to start');
      expect(result.current.callStatus).toBe(VapiCallStatus.INACTIVE);
    });

    it('handles non-Error start failures', async () => {
      const { result } = renderHook(() => useVapiVoice(), { wrapper: TestWrapper });

      vapiMocks.start.mockRejectedValueOnce('string error');

      await act(async () => {
        await result.current.start();
      });

      expect(result.current.error).toBe('Failed to start call');
    });

    it('handles rapid connect/disconnect cycles', async () => {
      const { result } = renderHook(() => useVapiVoice(), { wrapper: TestWrapper });

      // Rapid cycle
      await act(async () => {
        await result.current.start();
        vapiMocks.emit('call-start');
        result.current.stop();
        vapiMocks.emit('call-end');
        await result.current.start();
        vapiMocks.emit('call-start');
      });

      expect(result.current.callStatus).toBe(VapiCallStatus.ACTIVE);
    });

    it('updates activeTranscript progressively for typing indicator', async () => {
      const { result } = renderHook(() => useVapiVoice(), { wrapper: TestWrapper });

      await act(async () => {
        await result.current.start();
        vapiMocks.emit('call-start');
      });

      // Simulate progressive partial updates
      await act(async () => {
        vapiMocks.emit('message', {
          type: VapiMessageType.TRANSCRIPT,
          role: VapiMessageRole.ASSISTANT,
          transcriptType: VapiTranscriptType.PARTIAL,
          transcript: 'H',
        });
      });
      expect(result.current.activeTranscript?.transcript).toBe('H');

      await act(async () => {
        vapiMocks.emit('message', {
          type: VapiMessageType.TRANSCRIPT,
          role: VapiMessageRole.ASSISTANT,
          transcriptType: VapiTranscriptType.PARTIAL,
          transcript: 'Hello',
        });
      });
      expect(result.current.activeTranscript?.transcript).toBe('Hello');

      await act(async () => {
        vapiMocks.emit('message', {
          type: VapiMessageType.TRANSCRIPT,
          role: VapiMessageRole.ASSISTANT,
          transcriptType: VapiTranscriptType.PARTIAL,
          transcript: 'Hello, how',
        });
      });
      expect(result.current.activeTranscript?.transcript).toBe('Hello, how');
    });
  });
});
