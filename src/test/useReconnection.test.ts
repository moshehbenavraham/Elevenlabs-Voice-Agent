import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  calculateBackoff,
  addJitter,
  shouldReconnect,
  useReconnection,
} from '@/hooks/useReconnection';

// Mock timers for testing async behavior
vi.useFakeTimers();

describe('useReconnection', () => {
  beforeEach(() => {
    vi.clearAllTimers();
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateBackoff', () => {
    it('should return base delay for attempt 0', () => {
      const delay = calculateBackoff(0, 1000, 30000);
      expect(delay).toBe(1000);
    });

    it('should double delay for each attempt', () => {
      expect(calculateBackoff(1, 1000, 30000)).toBe(2000);
      expect(calculateBackoff(2, 1000, 30000)).toBe(4000);
      expect(calculateBackoff(3, 1000, 30000)).toBe(8000);
      expect(calculateBackoff(4, 1000, 30000)).toBe(16000);
    });

    it('should cap at maxDelay', () => {
      expect(calculateBackoff(5, 1000, 30000)).toBe(30000);
      expect(calculateBackoff(10, 1000, 30000)).toBe(30000);
    });

    it('should handle custom base and max delay', () => {
      expect(calculateBackoff(0, 500, 10000)).toBe(500);
      expect(calculateBackoff(4, 500, 10000)).toBe(8000);
      expect(calculateBackoff(5, 500, 10000)).toBe(10000);
    });

    it('should use default values when not provided', () => {
      const delay = calculateBackoff(0);
      expect(delay).toBe(1000);
    });
  });

  describe('addJitter', () => {
    it('should add positive jitter to delay', () => {
      // Mock Math.random to return 0.5
      const originalRandom = Math.random;
      Math.random = () => 0.5;

      const delay = addJitter(1000, 0.3);
      // With 30% jitter factor and 0.5 random: 1000 + (1000 * 0.3 * 0.5) = 1150
      expect(delay).toBe(1150);

      Math.random = originalRandom;
    });

    it('should not exceed jitterFactor percentage', () => {
      // With max random (1.0), jitter should be at most jitterFactor * delay
      const originalRandom = Math.random;
      Math.random = () => 1.0;

      const delay = addJitter(1000, 0.3);
      // 1000 + (1000 * 0.3 * 1.0) = 1300
      expect(delay).toBe(1300);

      Math.random = originalRandom;
    });

    it('should add no jitter when random returns 0', () => {
      const originalRandom = Math.random;
      Math.random = () => 0;

      const delay = addJitter(1000, 0.3);
      expect(delay).toBe(1000);

      Math.random = originalRandom;
    });

    it('should use default jitter factor', () => {
      const originalRandom = Math.random;
      Math.random = () => 0.5;

      const delay = addJitter(1000);
      // Default jitter factor is 0.3
      expect(delay).toBe(1150);

      Math.random = originalRandom;
    });

    it('should round to nearest integer', () => {
      const originalRandom = Math.random;
      Math.random = () => 0.33;

      const delay = addJitter(1000, 0.3);
      // 1000 + (1000 * 0.3 * 0.33) = 1099
      expect(delay).toBe(1099);

      Math.random = originalRandom;
    });
  });

  describe('shouldReconnect', () => {
    it('should return false for normal closure (code 1000)', () => {
      expect(shouldReconnect(1000)).toBe(false);
    });

    it('should return false for going away (code 1001)', () => {
      expect(shouldReconnect(1001)).toBe(false);
    });

    it('should return true for abnormal closure (code 1006)', () => {
      expect(shouldReconnect(1006)).toBe(true);
    });

    it('should return true for server error (code 1011)', () => {
      expect(shouldReconnect(1011)).toBe(true);
    });

    it('should return true for other unexpected codes', () => {
      expect(shouldReconnect(1002)).toBe(true); // Protocol error
      expect(shouldReconnect(1003)).toBe(true); // Unsupported data
      expect(shouldReconnect(1007)).toBe(true); // Invalid data
      expect(shouldReconnect(1008)).toBe(true); // Policy violation
      expect(shouldReconnect(1009)).toBe(true); // Message too big
      expect(shouldReconnect(1010)).toBe(true); // Mandatory extension
    });
  });

  describe('useReconnection hook', () => {
    it('should initialize with idle status', () => {
      const mockReconnect = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useReconnection(mockReconnect));

      expect(result.current.status).toBe('idle');
      expect(result.current.attempt).toBe(0);
      expect(result.current.countdown).toBe(0);
      expect(result.current.isOnline).toBe(true);
    });

    it('should transition to connected on onConnected', () => {
      const mockReconnect = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useReconnection(mockReconnect));

      act(() => {
        result.current.onConnected();
      });

      expect(result.current.status).toBe('connected');
      expect(result.current.attempt).toBe(0);
    });

    it('should reset state on resetReconnection', () => {
      const mockReconnect = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useReconnection(mockReconnect));

      // First connect then disconnect abnormally
      act(() => {
        result.current.onConnected();
      });

      act(() => {
        result.current.onDisconnected(1006);
      });

      // Reset
      act(() => {
        result.current.resetReconnection();
      });

      expect(result.current.status).toBe('idle');
      expect(result.current.attempt).toBe(0);
    });

    it('should not reconnect on normal closure (1000)', () => {
      const mockReconnect = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useReconnection(mockReconnect));

      act(() => {
        result.current.onDisconnected(1000);
      });

      // Should reset to idle, not reconnecting
      expect(result.current.status).toBe('idle');
      expect(mockReconnect).not.toHaveBeenCalled();
    });

    it('should start reconnecting on abnormal closure (1006)', () => {
      const mockReconnect = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useReconnection(mockReconnect));

      act(() => {
        result.current.onDisconnected(1006);
      });

      expect(result.current.status).toBe('reconnecting');
    });

    it('should transition to max_retries after exceeding max attempts', async () => {
      const mockReconnect = vi.fn().mockRejectedValue(new Error('Connection failed'));
      const { result } = renderHook(() =>
        useReconnection(mockReconnect, {
          maxRetries: 2,
          baseDelay: 100,
          maxDelay: 1000,
          jitterFactor: 0,
        })
      );

      // Trigger disconnection
      act(() => {
        result.current.onDisconnected(1006);
      });

      expect(result.current.status).toBe('reconnecting');

      // Advance through attempt 0 (100ms delay)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      // Advance through attempt 1 (200ms delay)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(200);
      });

      // Advance through attempt 2 (400ms delay) - this should hit max_retries
      await act(async () => {
        await vi.advanceTimersByTimeAsync(400);
      });

      // After max retries (2), should be in max_retries state
      expect(result.current.status).toBe('max_retries');
    });

    it('should allow manual reconnect after max retries', () => {
      const mockReconnect = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useReconnection(mockReconnect, { maxRetries: 1 }));

      // Manually set to max_retries state via manual reconnect
      act(() => {
        result.current.manualReconnect();
      });

      expect(result.current.status).toBe('reconnecting');
      expect(result.current.attempt).toBe(0);
    });

    it('should cancel reconnection on cancelReconnect', () => {
      const mockReconnect = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useReconnection(mockReconnect));

      // Start reconnection
      act(() => {
        result.current.onDisconnected(1006);
      });

      expect(result.current.status).toBe('reconnecting');

      // Cancel
      act(() => {
        result.current.cancelReconnect();
      });

      // Countdown should be cleared
      expect(result.current.countdown).toBe(0);
    });
  });

  describe('network status detection', () => {
    it('should detect when browser goes offline', () => {
      const mockReconnect = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useReconnection(mockReconnect));

      expect(result.current.isOnline).toBe(true);

      // Simulate going offline
      act(() => {
        Object.defineProperty(navigator, 'onLine', { value: false });
        window.dispatchEvent(new Event('offline'));
      });

      expect(result.current.isOnline).toBe(false);
    });

    it('should detect when browser comes back online', () => {
      const mockReconnect = vi.fn().mockResolvedValue(undefined);

      // Start offline
      Object.defineProperty(navigator, 'onLine', { value: false });

      const { result } = renderHook(() => useReconnection(mockReconnect));

      expect(result.current.isOnline).toBe(false);

      // Come back online
      act(() => {
        Object.defineProperty(navigator, 'onLine', { value: true });
        window.dispatchEvent(new Event('online'));
      });

      expect(result.current.isOnline).toBe(true);
    });
  });
});
