import { useState, useEffect, useRef, useCallback } from 'react';

// Reconnection state machine states
export type ReconnectionStatus =
  | 'idle'
  | 'connected'
  | 'disconnected'
  | 'reconnecting'
  | 'max_retries';

// Configuration for the reconnection hook
export interface ReconnectionConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  jitterFactor: number;
}

// State exposed by the hook
export interface ReconnectionState {
  status: ReconnectionStatus;
  attempt: number;
  countdown: number;
  isOnline: boolean;
}

// Return type of the hook
export interface UseReconnectionReturn extends ReconnectionState {
  scheduleReconnect: () => void;
  cancelReconnect: () => void;
  resetReconnection: () => void;
  onConnected: () => void;
  onDisconnected: (closeCode: number) => void;
  manualReconnect: () => void;
}

// Default configuration values
const DEFAULT_CONFIG: ReconnectionConfig = {
  maxRetries: 5,
  baseDelay: 1000,
  maxDelay: 30000,
  jitterFactor: 0.3,
};

/**
 * Calculate exponential backoff delay for a given attempt
 * Delay doubles with each attempt: 1s, 2s, 4s, 8s, 16s, capped at maxDelay
 */
export function calculateBackoff(
  attempt: number,
  baseDelay: number = DEFAULT_CONFIG.baseDelay,
  maxDelay: number = DEFAULT_CONFIG.maxDelay
): number {
  const delay = baseDelay * Math.pow(2, attempt);
  return Math.min(delay, maxDelay);
}

/**
 * Add random jitter to a delay value to prevent thundering herd
 * Jitter adds 0-jitterFactor (default 30%) variability
 */
export function addJitter(
  delay: number,
  jitterFactor: number = DEFAULT_CONFIG.jitterFactor
): number {
  const jitter = delay * jitterFactor * Math.random();
  return Math.round(delay + jitter);
}

/**
 * Determine if reconnection should be attempted based on WebSocket close code
 * - 1000: Normal closure (intentional) - do not reconnect
 * - 1001: Going away (tab close) - do not reconnect
 * - 1006: Abnormal closure (network issue) - reconnect
 * - Other codes: Generally reconnect for unexpected closures
 */
export function shouldReconnect(closeCode: number): boolean {
  // Normal closure codes that should NOT trigger reconnection
  const normalCloseCodes = [1000, 1001];
  return !normalCloseCodes.includes(closeCode);
}

/**
 * Hook for managing WebSocket reconnection with exponential backoff
 *
 * Features:
 * - Exponential backoff with jitter
 * - Maximum retry attempts
 * - Network online/offline detection
 * - Countdown timer for UI feedback
 * - Clean cancellation on intentional disconnect
 */
export function useReconnection(
  onReconnect: () => Promise<void>,
  config: Partial<ReconnectionConfig> = {}
): UseReconnectionReturn {
  const mergedConfig: ReconnectionConfig = { ...DEFAULT_CONFIG, ...config };

  // State
  const [status, setStatus] = useState<ReconnectionStatus>('idle');
  const [attempt, setAttempt] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Refs to avoid stale closures in async callbacks
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const attemptRef = useRef(attempt);
  const isReconnectingRef = useRef(false);
  const onReconnectRef = useRef(onReconnect);
  const scheduleReconnectRef = useRef<() => void>(() => {});

  // Keep refs in sync
  useEffect(() => {
    attemptRef.current = attempt;
  }, [attempt]);

  useEffect(() => {
    onReconnectRef.current = onReconnect;
  }, [onReconnect]);

  /**
   * Clear all pending timers
   */
  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setCountdown(0);
  }, []);

  /**
   * Schedule a reconnection attempt with exponential backoff
   */
  const scheduleReconnect = useCallback(() => {
    // Don't schedule if already at max retries
    if (attemptRef.current >= mergedConfig.maxRetries) {
      setStatus('max_retries');
      return;
    }

    // Don't schedule if offline - will resume when online
    if (!navigator.onLine) {
      setStatus('disconnected');
      return;
    }

    setStatus('reconnecting');
    isReconnectingRef.current = true;

    const baseDelay = calculateBackoff(
      attemptRef.current,
      mergedConfig.baseDelay,
      mergedConfig.maxDelay
    );
    const delay = addJitter(baseDelay, mergedConfig.jitterFactor);

    // Start countdown
    setCountdown(Math.ceil(delay / 1000));

    // Update countdown every second
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Schedule the actual reconnection
    timerRef.current = setTimeout(async () => {
      if (!isReconnectingRef.current) {
        return;
      }

      setAttempt((prev) => prev + 1);

      try {
        await onReconnectRef.current();
        // If successful, onConnected will be called by the provider
      } catch {
        // Reconnect failed, schedule next attempt via ref to avoid stale closure
        scheduleReconnectRef.current();
      }
    }, delay);
  }, [
    mergedConfig.maxRetries,
    mergedConfig.baseDelay,
    mergedConfig.maxDelay,
    mergedConfig.jitterFactor,
  ]);

  // Keep scheduleReconnect ref in sync
  useEffect(() => {
    scheduleReconnectRef.current = scheduleReconnect;
  }, [scheduleReconnect]);

  /**
   * Cancel any pending reconnection attempts
   */
  const cancelReconnect = useCallback(() => {
    clearTimers();
    isReconnectingRef.current = false;
  }, [clearTimers]);

  /**
   * Reset reconnection state to initial values
   */
  const resetReconnection = useCallback(() => {
    cancelReconnect();
    setStatus('idle');
    setAttempt(0);
    setCountdown(0);
  }, [cancelReconnect]);

  /**
   * Called when connection is successfully established
   */
  const onConnected = useCallback(() => {
    cancelReconnect();
    setStatus('connected');
    setAttempt(0);
  }, [cancelReconnect]);

  /**
   * Called when WebSocket connection is closed
   * Determines whether to attempt reconnection based on close code
   */
  const onDisconnected = useCallback(
    (closeCode: number) => {
      if (shouldReconnect(closeCode)) {
        setStatus('disconnected');
        scheduleReconnect();
      } else {
        // Intentional disconnect - reset state
        resetReconnection();
      }
    },
    [scheduleReconnect, resetReconnection]
  );

  /**
   * Manually trigger reconnection (after max retries exceeded)
   */
  const manualReconnect = useCallback(() => {
    setAttempt(0);
    attemptRef.current = 0;
    setStatus('disconnected');
    scheduleReconnect();
  }, [scheduleReconnect]);

  /**
   * Handle browser online/offline events
   */
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Resume reconnection if we were disconnected
      if (status === 'disconnected' && attemptRef.current < mergedConfig.maxRetries) {
        scheduleReconnect();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      // Pause reconnection when offline
      if (status === 'reconnecting') {
        cancelReconnect();
        setStatus('disconnected');
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [status, mergedConfig.maxRetries, scheduleReconnect, cancelReconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  return {
    status,
    attempt,
    countdown,
    isOnline,
    scheduleReconnect,
    cancelReconnect,
    resetReconnection,
    onConnected,
    onDisconnected,
    manualReconnect,
  };
}

export default useReconnection;
