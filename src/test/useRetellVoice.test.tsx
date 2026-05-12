/**
 * useRetellVoice Hook Tests
 *
 * Unit tests for the Retell voice hook covering:
 * - Initial state
 * - Connection lifecycle (startCall, stopCall, toggleCall)
 * - Event handling (call_started, call_ended, agent speaking, update, error)
 * - Transcript accumulation (unique to Retell - SDK only provides last 5)
 * - Cleanup and edge cases
 */

import { vi } from 'vitest';
import React from 'react';

// Mock environment variables BEFORE any module imports
// vi.hoisted runs before all imports are evaluated
vi.hoisted(() => {
  vi.stubEnv('VITE_RETELL_AGENT_ID', 'test-agent-id');
  vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3001');
});

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useRetellVoice } from '@/hooks/useRetellVoice';
import { RetellVoiceProvider } from '@/contexts/RetellVoiceContext';
import { RetellCallStatus, RetellMessageRole, RetellTranscriptType } from '@/types/retell';
import { retellMocks } from './setup';

// Wrapper component that provides the RetellVoiceProvider context
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <RetellVoiceProvider>{children}</RetellVoiceProvider>
);

// Mock fetch for backend token calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useRetellVoice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    retellMocks.reset();
    // Default successful token response
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ access_token: 'test-token', call_id: 'call-123' }),
    });
  });

  afterEach(() => {
    retellMocks.reset();
  });

  // ===========================================
  // T008: Initial State Tests
  // ===========================================
  describe('initial state', () => {
    it('returns callStatus as IDLE initially', () => {
      const { result } = renderHook(() => useRetellVoice(), { wrapper });
      expect(result.current.callStatus).toBe(RetellCallStatus.IDLE);
    });

    it('returns isAgentSpeaking as false initially', () => {
      const { result } = renderHook(() => useRetellVoice(), { wrapper });
      expect(result.current.isAgentSpeaking).toBe(false);
    });

    it('returns empty messages array initially', () => {
      const { result } = renderHook(() => useRetellVoice(), { wrapper });
      expect(result.current.messages).toEqual([]);
    });

    it('returns null activeTranscript initially', () => {
      const { result } = renderHook(() => useRetellVoice(), { wrapper });
      expect(result.current.activeTranscript).toBeNull();
    });

    it('returns null error initially', () => {
      const { result } = renderHook(() => useRetellVoice(), { wrapper });
      expect(result.current.error).toBeNull();
    });

    it('returns null callId initially', () => {
      const { result } = renderHook(() => useRetellVoice(), { wrapper });
      expect(result.current.callId).toBeNull();
    });

    it('provides startCall, stopCall, and toggleCall functions', () => {
      const { result } = renderHook(() => useRetellVoice(), { wrapper });
      expect(typeof result.current.startCall).toBe('function');
      expect(typeof result.current.stopCall).toBe('function');
      expect(typeof result.current.toggleCall).toBe('function');
    });
  });

  // ===========================================
  // T009: Connection Lifecycle Tests
  // ===========================================
  describe('connection lifecycle', () => {
    it('sets callStatus to CONNECTING when startCall() is called', async () => {
      // Use a deferred promise to control fetch timing
      let resolveFetch: (value: unknown) => void;
      const fetchPromise = new Promise((resolve) => {
        resolveFetch = resolve;
      });
      mockFetch.mockReturnValue(fetchPromise);

      const { result } = renderHook(() => useRetellVoice(), { wrapper });

      // Start the call without awaiting completion
      await act(async () => {
        result.current.startCall();
        // Allow React to flush the synchronous state update
        await Promise.resolve();
      });

      // Status should be CONNECTING while fetch is pending
      expect(result.current.callStatus).toBe(RetellCallStatus.CONNECTING);

      // Clean up: resolve the fetch to avoid hanging promise
      await act(async () => {
        resolveFetch!({
          ok: true,
          json: () => Promise.resolve({ access_token: 'test-token', call_id: 'call-123' }),
        });
        await Promise.resolve();
      });
    });

    it('fetches access token from backend when starting call', async () => {
      const { result } = renderHook(() => useRetellVoice(), { wrapper });

      await act(async () => {
        await result.current.startCall();
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/retell/create-web-call',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('calls SDK startCall with access token', async () => {
      const { result } = renderHook(() => useRetellVoice(), { wrapper });

      await act(async () => {
        await result.current.startCall();
      });

      expect(retellMocks.startCall).toHaveBeenCalledWith(
        expect.objectContaining({
          accessToken: 'test-token',
        })
      );
    });

    it('stores callId from backend response', async () => {
      const { result } = renderHook(() => useRetellVoice(), { wrapper });

      await act(async () => {
        await result.current.startCall();
      });

      expect(result.current.callId).toBe('call-123');
    });

    it('clears previous messages on new call', async () => {
      const { result } = renderHook(() => useRetellVoice(), { wrapper });

      // First call with messages
      await act(async () => {
        await result.current.startCall();
        retellMocks.emit('call_started');
        retellMocks.emit('update', {
          transcript: [{ role: 'agent', content: 'Hello' }],
        });
      });

      expect(result.current.messages.length).toBe(1);

      // End call
      await act(async () => {
        retellMocks.emit('call_ended');
      });

      // New call should clear messages
      await act(async () => {
        await result.current.startCall();
      });

      expect(result.current.messages).toEqual([]);
    });

    it('does not start when already connected', async () => {
      const { result } = renderHook(() => useRetellVoice(), { wrapper });

      await act(async () => {
        await result.current.startCall();
        retellMocks.emit('call_started');
      });

      expect(result.current.callStatus).toBe(RetellCallStatus.CONNECTED);

      mockFetch.mockClear();

      await act(async () => {
        await result.current.startCall();
      });

      // Should not call fetch again
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('does not start when already connecting', async () => {
      // Use a deferred promise to keep status in CONNECTING state
      let resolveFetch: (value: unknown) => void;
      const fetchPromise = new Promise((resolve) => {
        resolveFetch = resolve;
      });
      mockFetch.mockReturnValue(fetchPromise);

      const { result } = renderHook(() => useRetellVoice(), { wrapper });

      // Start the first call
      await act(async () => {
        result.current.startCall();
        await Promise.resolve();
      });

      expect(result.current.callStatus).toBe(RetellCallStatus.CONNECTING);

      mockFetch.mockClear();

      // Try to start again while connecting
      await act(async () => {
        result.current.startCall();
        await Promise.resolve();
      });

      // Should not call fetch again
      expect(mockFetch).not.toHaveBeenCalled();

      // Clean up
      await act(async () => {
        resolveFetch!({
          ok: true,
          json: () => Promise.resolve({ access_token: 'test-token', call_id: 'call-123' }),
        });
        await Promise.resolve();
      });
    });

    it('calls SDK stopCall when stopCall() is called while connected', async () => {
      const { result } = renderHook(() => useRetellVoice(), { wrapper });

      await act(async () => {
        await result.current.startCall();
        retellMocks.emit('call_started');
      });

      expect(result.current.callStatus).toBe(RetellCallStatus.CONNECTED);

      act(() => {
        result.current.stopCall();
      });

      expect(retellMocks.stopCall).toHaveBeenCalled();
    });

    it('does nothing when stopCall called while idle', () => {
      const { result } = renderHook(() => useRetellVoice(), { wrapper });

      act(() => {
        result.current.stopCall();
      });

      expect(retellMocks.stopCall).not.toHaveBeenCalled();
    });

    it('toggleCall starts when idle', async () => {
      // Use a deferred promise to control fetch timing
      let resolveFetch: (value: unknown) => void;
      const fetchPromise = new Promise((resolve) => {
        resolveFetch = resolve;
      });
      mockFetch.mockReturnValue(fetchPromise);

      const { result } = renderHook(() => useRetellVoice(), { wrapper });

      await act(async () => {
        result.current.toggleCall();
        await Promise.resolve();
      });

      expect(result.current.callStatus).toBe(RetellCallStatus.CONNECTING);

      // Clean up
      await act(async () => {
        resolveFetch!({
          ok: true,
          json: () => Promise.resolve({ access_token: 'test-token', call_id: 'call-123' }),
        });
        await Promise.resolve();
      });
    });

    it('toggleCall stops when connected', async () => {
      const { result } = renderHook(() => useRetellVoice(), { wrapper });

      await act(async () => {
        await result.current.startCall();
        retellMocks.emit('call_started');
      });

      act(() => {
        result.current.toggleCall();
      });

      expect(retellMocks.stopCall).toHaveBeenCalled();
    });

    it('toggleCall does nothing when connecting', async () => {
      // Use a deferred promise to keep status in CONNECTING state
      let resolveFetch: (value: unknown) => void;
      const fetchPromise = new Promise((resolve) => {
        resolveFetch = resolve;
      });
      mockFetch.mockReturnValue(fetchPromise);

      const { result } = renderHook(() => useRetellVoice(), { wrapper });

      await act(async () => {
        result.current.startCall();
        await Promise.resolve();
      });

      expect(result.current.callStatus).toBe(RetellCallStatus.CONNECTING);

      retellMocks.startCall.mockClear();
      retellMocks.stopCall.mockClear();

      await act(async () => {
        result.current.toggleCall();
        await Promise.resolve();
      });

      // Should not start or stop
      expect(retellMocks.stopCall).not.toHaveBeenCalled();

      // Clean up
      await act(async () => {
        resolveFetch!({
          ok: true,
          json: () => Promise.resolve({ access_token: 'test-token', call_id: 'call-123' }),
        });
        await Promise.resolve();
      });
    });

    it('toggleCall starts when in error state', async () => {
      const { result } = renderHook(() => useRetellVoice(), { wrapper });

      // Trigger error state
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: 'Server error' }),
      });

      await act(async () => {
        await result.current.startCall();
      });

      expect(result.current.callStatus).toBe(RetellCallStatus.ERROR);

      // Use a deferred promise to control fetch timing
      let resolveFetch: (value: unknown) => void;
      const fetchPromise = new Promise((resolve) => {
        resolveFetch = resolve;
      });
      mockFetch.mockReturnValue(fetchPromise);

      await act(async () => {
        result.current.toggleCall();
        await Promise.resolve();
      });

      expect(result.current.callStatus).toBe(RetellCallStatus.CONNECTING);

      // Clean up
      await act(async () => {
        resolveFetch!({
          ok: true,
          json: () => Promise.resolve({ access_token: 'test-token', call_id: 'call-123' }),
        });
        await Promise.resolve();
      });
    });
  });

  // ===========================================
  // T010: Event Handling Tests
  // ===========================================
  describe('event handling', () => {
    it('sets callStatus to CONNECTED on call_started event', async () => {
      const { result } = renderHook(() => useRetellVoice(), { wrapper });

      await act(async () => {
        await result.current.startCall();
        retellMocks.emit('call_started');
      });

      expect(result.current.callStatus).toBe(RetellCallStatus.CONNECTED);
    });

    it('clears error on call_started event', async () => {
      const { result } = renderHook(() => useRetellVoice(), { wrapper });

      // Trigger error first
      await act(async () => {
        retellMocks.emit('error', 'Previous error');
      });

      await act(async () => {
        await result.current.startCall();
        retellMocks.emit('call_started');
      });

      expect(result.current.error).toBeNull();
    });

    it('sets callStatus to IDLE on call_ended event', async () => {
      const { result } = renderHook(() => useRetellVoice(), { wrapper });

      await act(async () => {
        await result.current.startCall();
        retellMocks.emit('call_started');
      });

      expect(result.current.callStatus).toBe(RetellCallStatus.CONNECTED);

      await act(async () => {
        retellMocks.emit('call_ended');
      });

      expect(result.current.callStatus).toBe(RetellCallStatus.IDLE);
    });

    it('clears activeTranscript on call_ended event', async () => {
      const { result } = renderHook(() => useRetellVoice(), { wrapper });

      await act(async () => {
        await result.current.startCall();
        retellMocks.emit('call_started');
        retellMocks.emit('update', {
          transcript: [{ role: 'agent', content: 'Hello' }],
        });
      });

      expect(result.current.activeTranscript).not.toBeNull();

      await act(async () => {
        retellMocks.emit('call_ended');
      });

      expect(result.current.activeTranscript).toBeNull();
    });

    it('sets isAgentSpeaking to true on agent_start_talking event', async () => {
      const { result } = renderHook(() => useRetellVoice(), { wrapper });

      await act(async () => {
        await result.current.startCall();
        retellMocks.emit('call_started');
        retellMocks.emit('agent_start_talking');
      });

      expect(result.current.isAgentSpeaking).toBe(true);
    });

    it('sets isAgentSpeaking to false on agent_stop_talking event', async () => {
      const { result } = renderHook(() => useRetellVoice(), { wrapper });

      await act(async () => {
        await result.current.startCall();
        retellMocks.emit('call_started');
        retellMocks.emit('agent_start_talking');
      });

      expect(result.current.isAgentSpeaking).toBe(true);

      await act(async () => {
        retellMocks.emit('agent_stop_talking');
      });

      expect(result.current.isAgentSpeaking).toBe(false);
    });

    it('sets error on error event', async () => {
      const { result } = renderHook(() => useRetellVoice(), { wrapper });

      await act(async () => {
        retellMocks.emit('error', 'Connection failed');
      });

      expect(result.current.error).toBe('Connection failed');
    });

    it('sets callStatus to ERROR on error event', async () => {
      const { result } = renderHook(() => useRetellVoice(), { wrapper });

      await act(async () => {
        await result.current.startCall();
        retellMocks.emit('call_started');
      });

      expect(result.current.callStatus).toBe(RetellCallStatus.CONNECTED);

      await act(async () => {
        retellMocks.emit('error', 'Connection lost');
      });

      expect(result.current.callStatus).toBe(RetellCallStatus.ERROR);
    });

    it('handles empty error message', async () => {
      const { result } = renderHook(() => useRetellVoice(), { wrapper });

      await act(async () => {
        retellMocks.emit('error', '');
      });

      expect(result.current.error).toBe('Unknown error occurred');
    });
  });

  // ===========================================
  // T011: Transcript and Update Event Tests
  // ===========================================
  describe('transcript handling', () => {
    it('adds transcripts from update event to messages', async () => {
      const { result } = renderHook(() => useRetellVoice(), { wrapper });

      await act(async () => {
        await result.current.startCall();
        retellMocks.emit('call_started');
        retellMocks.emit('update', {
          transcript: [{ role: 'agent', content: 'Hello, how can I help?' }],
        });
      });

      expect(result.current.messages.length).toBe(1);
      expect(result.current.messages[0].content).toBe('Hello, how can I help?');
      expect(result.current.messages[0].role).toBe(RetellMessageRole.AGENT);
    });

    it('handles user transcripts', async () => {
      const { result } = renderHook(() => useRetellVoice(), { wrapper });

      await act(async () => {
        await result.current.startCall();
        retellMocks.emit('call_started');
        retellMocks.emit('update', {
          transcript: [{ role: 'user', content: 'Hello' }],
        });
      });

      expect(result.current.messages[0].role).toBe(RetellMessageRole.USER);
    });

    it('accumulates multiple transcripts over time', async () => {
      const { result } = renderHook(() => useRetellVoice(), { wrapper });

      await act(async () => {
        await result.current.startCall();
        retellMocks.emit('call_started');
      });

      // First update with one transcript
      await act(async () => {
        retellMocks.emit('update', {
          transcript: [{ role: 'user', content: 'Hello' }],
        });
      });

      expect(result.current.messages.length).toBe(1);

      // Second update with two transcripts (SDK sliding window)
      await act(async () => {
        retellMocks.emit('update', {
          transcript: [
            { role: 'user', content: 'Hello' },
            { role: 'agent', content: 'Hi there!' },
          ],
        });
      });

      // Should only add the new one (index 1)
      expect(result.current.messages.length).toBe(2);
      expect(result.current.messages[1].content).toBe('Hi there!');
    });

    it('sets activeTranscript for agent messages', async () => {
      const { result } = renderHook(() => useRetellVoice(), { wrapper });

      await act(async () => {
        await result.current.startCall();
        retellMocks.emit('call_started');
        retellMocks.emit('update', {
          transcript: [{ role: 'agent', content: 'Hello...' }],
        });
      });

      expect(result.current.activeTranscript).not.toBeNull();
      expect(result.current.activeTranscript?.content).toBe('Hello...');
      expect(result.current.activeTranscript?.transcriptType).toBe(RetellTranscriptType.PARTIAL);
    });

    it('clears activeTranscript when user is last speaker', async () => {
      const { result } = renderHook(() => useRetellVoice(), { wrapper });

      await act(async () => {
        await result.current.startCall();
        retellMocks.emit('call_started');
        retellMocks.emit('update', {
          transcript: [{ role: 'agent', content: 'Hello' }],
        });
      });

      expect(result.current.activeTranscript).not.toBeNull();

      await act(async () => {
        retellMocks.emit('update', {
          transcript: [
            { role: 'agent', content: 'Hello' },
            { role: 'user', content: 'Hi' },
          ],
        });
      });

      expect(result.current.activeTranscript).toBeNull();
    });

    it('ignores update events with invalid transcript', async () => {
      const { result } = renderHook(() => useRetellVoice(), { wrapper });

      await act(async () => {
        await result.current.startCall();
        retellMocks.emit('call_started');
        retellMocks.emit('update', { transcript: null });
      });

      expect(result.current.messages).toEqual([]);

      await act(async () => {
        retellMocks.emit('update', {});
      });

      expect(result.current.messages).toEqual([]);
    });

    it('assigns unique IDs to each message', async () => {
      const { result } = renderHook(() => useRetellVoice(), { wrapper });

      await act(async () => {
        await result.current.startCall();
        retellMocks.emit('call_started');
        retellMocks.emit('update', {
          transcript: [{ role: 'agent', content: 'Hello' }],
        });
      });

      await act(async () => {
        retellMocks.emit('update', {
          transcript: [
            { role: 'agent', content: 'Hello' },
            { role: 'user', content: 'Hi' },
          ],
        });
      });

      const ids = result.current.messages.map((m) => m.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  // ===========================================
  // T012: Error Handling and Cleanup Tests
  // ===========================================
  describe('error handling and cleanup', () => {
    it('handles backend fetch error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useRetellVoice(), { wrapper });

      await act(async () => {
        await result.current.startCall();
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.callStatus).toBe(RetellCallStatus.ERROR);
    });

    it('handles HTTP error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Server error' }),
      });

      const { result } = renderHook(() => useRetellVoice(), { wrapper });

      await act(async () => {
        await result.current.startCall();
      });

      expect(result.current.error).toBe('Server error');
      expect(result.current.callStatus).toBe(RetellCallStatus.ERROR);
    });

    it('falls back to status-specific messages when HTTP error body is not JSON', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.reject(new Error('Not JSON')),
      });

      const { result } = renderHook(() => useRetellVoice(), { wrapper });

      await act(async () => {
        await result.current.startCall();
      });

      expect(result.current.error).toBe('Agent not found - check VITE_RETELL_AGENT_ID');
      expect(result.current.callStatus).toBe(RetellCallStatus.ERROR);
    });

    it('handles missing access token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const { result } = renderHook(() => useRetellVoice(), { wrapper });

      await act(async () => {
        await result.current.startCall();
      });

      expect(result.current.error).toBe('Backend did not return access token - check server logs');
      expect(result.current.callStatus).toBe(RetellCallStatus.ERROR);
    });

    it('handles SDK startCall error', async () => {
      retellMocks.startCall.mockRejectedValueOnce(new Error('SDK error'));

      const { result } = renderHook(() => useRetellVoice(), { wrapper });

      await act(async () => {
        await result.current.startCall();
      });

      expect(result.current.error).toBe('SDK error');
      expect(result.current.callStatus).toBe(RetellCallStatus.ERROR);
    });

    it('removes event listeners on unmount', async () => {
      const { unmount } = renderHook(() => useRetellVoice(), { wrapper });

      unmount();

      expect(retellMocks.off).toHaveBeenCalledWith('call_started', expect.any(Function));
      expect(retellMocks.off).toHaveBeenCalledWith('call_ended', expect.any(Function));
      expect(retellMocks.off).toHaveBeenCalledWith('agent_start_talking', expect.any(Function));
      expect(retellMocks.off).toHaveBeenCalledWith('agent_stop_talking', expect.any(Function));
      expect(retellMocks.off).toHaveBeenCalledWith('update', expect.any(Function));
      expect(retellMocks.off).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('calls stopCall on unmount', async () => {
      const { unmount } = renderHook(() => useRetellVoice(), { wrapper });

      unmount();

      expect(retellMocks.stopCall).toHaveBeenCalled();
    });

    it('handles stopCall error gracefully', async () => {
      const { result } = renderHook(() => useRetellVoice(), { wrapper });

      await act(async () => {
        await result.current.startCall();
        retellMocks.emit('call_started');
      });

      retellMocks.stopCall.mockImplementationOnce(() => {
        throw new Error('Stop failed');
      });

      act(() => {
        result.current.stopCall();
      });

      // Should still set state to idle
      expect(result.current.callStatus).toBe(RetellCallStatus.IDLE);
    });

    it('handles rapid connect/disconnect cycles', async () => {
      const { result } = renderHook(() => useRetellVoice(), { wrapper });

      await act(async () => {
        await result.current.startCall();
        retellMocks.emit('call_started');
        result.current.stopCall();
        retellMocks.emit('call_ended');
      });

      // Reset fetch mock
      mockFetch.mockClear();
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ access_token: 'test-token-2' }),
      });

      await act(async () => {
        await result.current.startCall();
        retellMocks.emit('call_started');
      });

      expect(result.current.callStatus).toBe(RetellCallStatus.CONNECTED);
    });

    it('resets transcript index on new call', async () => {
      const { result } = renderHook(() => useRetellVoice(), { wrapper });

      // First call with transcripts
      await act(async () => {
        await result.current.startCall();
        retellMocks.emit('call_started');
        retellMocks.emit('update', {
          transcript: [
            { role: 'user', content: 'Hello' },
            { role: 'agent', content: 'Hi!' },
          ],
        });
      });

      expect(result.current.messages.length).toBe(2);

      // End call
      await act(async () => {
        retellMocks.emit('call_ended');
      });

      // New call
      await act(async () => {
        await result.current.startCall();
        retellMocks.emit('call_started');
        retellMocks.emit('update', {
          transcript: [{ role: 'agent', content: 'Welcome back!' }],
        });
      });

      // Should have only the new message
      expect(result.current.messages.length).toBe(1);
      expect(result.current.messages[0].content).toBe('Welcome back!');
    });
  });

  // ===========================================
  // Configuration Tests
  // ===========================================
  describe('configuration', () => {
    it('sets error when agent ID is not configured', async () => {
      vi.stubEnv('VITE_RETELL_AGENT_ID', '');

      // Need to re-import to get new env
      vi.resetModules();

      const { useRetellVoice: useRetellVoiceNew } = await import('@/hooks/useRetellVoice');
      const { RetellVoiceProvider: NewProvider } = await import('@/contexts/RetellVoiceContext');

      // Create a new wrapper with the re-imported provider
      const newWrapper = ({ children }: { children: React.ReactNode }) => (
        <NewProvider>{children}</NewProvider>
      );

      const { result } = renderHook(() => useRetellVoiceNew(), { wrapper: newWrapper });

      await act(async () => {
        await result.current.startCall();
      });

      expect(result.current.error).toBe('VITE_RETELL_AGENT_ID is not configured');

      // Restore
      vi.stubEnv('VITE_RETELL_AGENT_ID', 'test-agent-id');
    });
  });
});
