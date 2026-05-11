import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useOpenAITranslationSessionTimer } from '@/hooks/useOpenAITranslationSessionTimer';

const START_TIME = Date.UTC(2026, 4, 11, 17, 0, 0);

describe('useOpenAITranslationSessionTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(START_TIME);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('returns zero elapsed time before a session starts', () => {
    const onAutoStop = vi.fn();

    const { result } = renderHook(() =>
      useOpenAITranslationSessionTimer({
        isActive: false,
        startedAt: null,
        endedAt: null,
        maxSeconds: 1800,
        onAutoStop,
      })
    );

    expect(result.current).toEqual({
      elapsedSeconds: 0,
      maxSeconds: 1800,
      remainingSeconds: 1800,
      isLimitReached: false,
    });
    expect(onAutoStop).not.toHaveBeenCalled();
  });

  it('ticks elapsed and remaining seconds while active', () => {
    const onAutoStop = vi.fn();

    const { result } = renderHook(() =>
      useOpenAITranslationSessionTimer({
        isActive: true,
        startedAt: START_TIME,
        endedAt: null,
        maxSeconds: 10,
        onAutoStop,
      })
    );

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.elapsedSeconds).toBe(2);
    expect(result.current.remainingSeconds).toBe(8);
    expect(result.current.isLimitReached).toBe(false);
    expect(onAutoStop).not.toHaveBeenCalled();
  });

  it('fires max-session auto-stop once across interval and timeout races', () => {
    const onAutoStop = vi.fn();

    const { result } = renderHook(() =>
      useOpenAITranslationSessionTimer({
        isActive: true,
        startedAt: START_TIME,
        endedAt: null,
        maxSeconds: 3,
        onAutoStop,
      })
    );

    act(() => {
      vi.advanceTimersByTime(3000);
      vi.advanceTimersByTime(3000);
    });

    expect(onAutoStop).toHaveBeenCalledTimes(1);
    expect(onAutoStop).toHaveBeenCalledWith('max-session-duration');
    expect(result.current.isLimitReached).toBe(true);
  });

  it('cleans up timers on unmount before auto-stop', () => {
    const onAutoStop = vi.fn();

    const { unmount } = renderHook(() =>
      useOpenAITranslationSessionTimer({
        isActive: true,
        startedAt: START_TIME,
        endedAt: null,
        maxSeconds: 3,
        onAutoStop,
      })
    );

    unmount();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(onAutoStop).not.toHaveBeenCalled();
  });

  it('resets elapsed time and auto-stop state on session re-entry', () => {
    const onAutoStop = vi.fn();

    const { result, rerender } = renderHook(
      ({ startedAt }) =>
        useOpenAITranslationSessionTimer({
          isActive: true,
          startedAt,
          endedAt: null,
          maxSeconds: 3,
          onAutoStop,
        }),
      { initialProps: { startedAt: START_TIME } }
    );

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.elapsedSeconds).toBe(2);

    const nextStartTime = Date.now();
    rerender({ startedAt: nextStartTime });

    expect(result.current.elapsedSeconds).toBe(0);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(onAutoStop).toHaveBeenCalledTimes(1);
  });

  it('uses endedAt for recently stopped sessions', () => {
    const onAutoStop = vi.fn();

    const { result } = renderHook(() =>
      useOpenAITranslationSessionTimer({
        isActive: false,
        startedAt: START_TIME,
        endedAt: START_TIME + 65000,
        maxSeconds: 1800,
        onAutoStop,
      })
    );

    expect(result.current.elapsedSeconds).toBe(65);
    expect(result.current.remainingSeconds).toBe(1735);
    expect(onAutoStop).not.toHaveBeenCalled();
  });
});
