import { useEffect, useRef, useState } from 'react';
import type { OpenAITranslationAutoStopReason } from '@/types/openai-translation';

interface UseOpenAITranslationSessionTimerOptions {
  readonly isActive: boolean;
  readonly startedAt: number | null;
  readonly endedAt: number | null;
  readonly maxSeconds: number;
  readonly onAutoStop: (reason: OpenAITranslationAutoStopReason) => void | Promise<void>;
}

interface UseOpenAITranslationSessionTimerResult {
  readonly elapsedSeconds: number;
  readonly maxSeconds: number;
  readonly remainingSeconds: number;
  readonly isLimitReached: boolean;
}

export function useOpenAITranslationSessionTimer({
  isActive,
  startedAt,
  endedAt,
  maxSeconds,
  onAutoStop,
}: UseOpenAITranslationSessionTimerOptions): UseOpenAITranslationSessionTimerResult {
  const autoStopTriggeredRef = useRef(false);
  const normalizedMaxSeconds = normalizeMaxSeconds(maxSeconds);
  const [, setTimerVersion] = useState(0);

  useEffect(() => {
    autoStopTriggeredRef.current = false;

    if (!isActive || startedAt === null || normalizedMaxSeconds <= 0) {
      return undefined;
    }

    const triggerAutoStop = (): void => {
      if (autoStopTriggeredRef.current) {
        return;
      }

      autoStopTriggeredRef.current = true;
      setTimerVersion((currentVersion) => currentVersion + 1);

      void Promise.resolve(onAutoStop('max-session-duration')).catch((error) => {
        console.error('[useOpenAITranslationSessionTimer] Auto-stop callback failed', error);
      });
    };

    const intervalId = window.setInterval(() => {
      const nextElapsedSeconds = calculateElapsedSeconds({
        isActive: true,
        startedAt,
        endedAt: null,
      });
      setTimerVersion((currentVersion) => currentVersion + 1);

      if (nextElapsedSeconds >= normalizedMaxSeconds) {
        triggerAutoStop();
      }
    }, 1000);
    const remainingMilliseconds = Math.max(
      0,
      normalizedMaxSeconds * 1000 - Math.max(0, Date.now() - startedAt)
    );
    const timeoutId = window.setTimeout(triggerAutoStop, remainingMilliseconds);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [endedAt, isActive, normalizedMaxSeconds, onAutoStop, startedAt]);

  const elapsedSeconds = calculateElapsedSeconds({ isActive, startedAt, endedAt });
  const remainingSeconds = Math.max(0, normalizedMaxSeconds - elapsedSeconds);

  return {
    elapsedSeconds,
    maxSeconds: normalizedMaxSeconds,
    remainingSeconds,
    isLimitReached: remainingSeconds === 0,
  };
}

function calculateElapsedSeconds({
  isActive,
  startedAt,
  endedAt,
}: {
  readonly isActive: boolean;
  readonly startedAt: number | null;
  readonly endedAt: number | null;
}): number {
  if (startedAt === null || !Number.isFinite(startedAt)) {
    return 0;
  }

  const referenceTime = isActive ? Date.now() : (endedAt ?? Date.now());
  return Math.max(0, Math.floor((referenceTime - startedAt) / 1000));
}

function normalizeMaxSeconds(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}
