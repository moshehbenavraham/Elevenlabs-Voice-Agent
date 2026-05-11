import { describe, expect, it } from 'vitest';
import { expectNoOpenAITranslationSecretLeak } from './openaiTranslationTestUtils';

interface TranslationMaxSessionConfig {
  readonly maxMinutes: number;
  readonly maxSeconds: number;
  readonly defaultMinutes: number;
  readonly hardMaxMinutes: number;
  readonly source: 'default' | 'configured' | 'capped';
}

interface TranslationSafetyIdentifier {
  readonly status: 'provided' | 'deferred' | 'rejected';
  readonly reason?: string;
  readonly value?: string;
}

interface TranslationSafetyModule {
  readonly TRANSLATION_DURATION_CONFIG_ENV_VAR: string;
  readonly TRANSLATION_DEFAULT_MAX_SESSION_MINUTES: number;
  readonly TRANSLATION_HARD_MAX_SESSION_MINUTES: number;
  readonly TRANSLATION_LIFECYCLE_EVENT: string;
  readonly TRANSLATION_SESSION_ROUTE: string;
  normalizeTranslationMaxSessionConfig: (value: unknown) => TranslationMaxSessionConfig;
  resolveTranslationDurationConfig: (
    env?: Record<string, string | undefined>
  ) => TranslationMaxSessionConfig;
  resolveTranslationSafetyIdentifier: (value?: unknown) => TranslationSafetyIdentifier;
  getTranslationSafetyIdentifierHeader: (
    safetyIdentifier: TranslationSafetyIdentifier
  ) => string | null;
  buildTranslationLifecycleMetadata: (input?: Record<string, unknown>) => Record<string, unknown>;
}

const modulePath = '../../server/utils/translationSafety.js';
const safety = (await import(modulePath)) as TranslationSafetyModule;

describe('translationSafety', () => {
  it('normalizes max-session defaults, configured values, and hard caps', () => {
    expect(safety.TRANSLATION_DEFAULT_MAX_SESSION_MINUTES).toBe(30);
    expect(safety.TRANSLATION_HARD_MAX_SESSION_MINUTES).toBe(120);
    expect(safety.normalizeTranslationMaxSessionConfig(undefined)).toEqual({
      maxMinutes: 30,
      maxSeconds: 1800,
      defaultMinutes: 30,
      hardMaxMinutes: 120,
      source: 'default',
    });
    expect(safety.normalizeTranslationMaxSessionConfig('0.5')).toEqual({
      maxMinutes: 0.5,
      maxSeconds: 30,
      defaultMinutes: 30,
      hardMaxMinutes: 120,
      source: 'configured',
    });
    expect(safety.normalizeTranslationMaxSessionConfig(150)).toEqual({
      maxMinutes: 120,
      maxSeconds: 7200,
      defaultMinutes: 30,
      hardMaxMinutes: 120,
      source: 'capped',
    });

    for (const value of ['', 'not-a-number', 0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(safety.normalizeTranslationMaxSessionConfig(value).source).toBe('default');
    }
  });

  it('resolves duration config from the public translation env variable only', () => {
    expect(safety.TRANSLATION_DURATION_CONFIG_ENV_VAR).toBe(
      'VITE_OPENAI_TRANSLATION_MAX_SESSION_MINUTES'
    );
    expect(
      safety.resolveTranslationDurationConfig({
        VITE_OPENAI_TRANSLATION_MAX_SESSION_MINUTES: '45',
        OPENAI_API_KEY: 'sk-do-not-read',
      })
    ).toEqual({
      maxMinutes: 45,
      maxSeconds: 2700,
      defaultMinutes: 30,
      hardMaxMinutes: 120,
      source: 'configured',
    });
  });

  it('defers safety identifiers unless a non-PII app identifier is provided', () => {
    const deferred = safety.resolveTranslationSafetyIdentifier();
    expect(deferred).toEqual({
      status: 'deferred',
      reason: 'no-stable-non-pii-app-identifier',
    });
    expect(safety.getTranslationSafetyIdentifierHeader(deferred)).toBeNull();

    const provided = safety.resolveTranslationSafetyIdentifier('safe-user-hash-1234');
    expect(provided).toEqual({
      status: 'provided',
      value: 'safe-user-hash-1234',
    });
    expect(safety.getTranslationSafetyIdentifierHeader(provided)).toBe('safe-user-hash-1234');

    const rejected = safety.resolveTranslationSafetyIdentifier('short');
    expect(rejected).toEqual({
      status: 'rejected',
      reason: 'invalid-safety-identifier',
    });
    expect(safety.getTranslationSafetyIdentifierHeader(rejected)).toBeNull();
  });

  it('builds sanitized allowlisted translation lifecycle metadata', () => {
    const durationConfig = safety.normalizeTranslationMaxSessionConfig('999');
    const safetyIdentifier = safety.resolveTranslationSafetyIdentifier();
    const metadata = safety.buildTranslationLifecycleMetadata({
      phase: 'success',
      result: 'success',
      requestId: 'req-translation-1234',
      targetLanguage: ' ES ',
      statusCategory: 'openai-response',
      statusCode: '200',
      errorCode: 'missing-client-secret',
      durationConfig,
      safetyIdentifier,
      elapsedMs: 12.345,
      authorization: 'Bearer sk-test-secret',
      cookie: 'session=secret',
      clientSecret: 'ek_secret',
      transcript: 'raw private transcript',
      sdp: 'v=0',
    });

    expect(Object.keys(metadata).sort()).toEqual([
      'durationConfig',
      'elapsedMs',
      'errorCode',
      'event',
      'phase',
      'requestId',
      'result',
      'route',
      'safetyIdentifier',
      'statusCategory',
      'statusCode',
      'targetLanguage',
    ]);
    expect(metadata).toMatchObject({
      event: safety.TRANSLATION_LIFECYCLE_EVENT,
      phase: 'success',
      result: 'success',
      route: safety.TRANSLATION_SESSION_ROUTE,
      requestId: 'req-translation-1234',
      targetLanguage: 'es',
      statusCategory: 'openai-response',
      statusCode: 200,
      errorCode: 'missing-client-secret',
      elapsedMs: 12.35,
      durationConfig: {
        maxMinutes: 120,
        maxSeconds: 7200,
        defaultMinutes: 30,
        hardMaxMinutes: 120,
        source: 'capped',
      },
      safetyIdentifier: {
        status: 'deferred',
        reason: 'no-stable-non-pii-app-identifier',
      },
    });
    expectNoOpenAITranslationSecretLeak(metadata);
    expect(JSON.stringify(metadata)).not.toContain('raw private transcript');
    expect(JSON.stringify(metadata)).not.toContain('cookie');
  });

  it('falls back to stable categories for malformed lifecycle input', () => {
    const metadata = safety.buildTranslationLifecycleMetadata({
      phase: 'bad-phase',
      result: 'bad-result',
      requestId: 'bad',
      targetLanguage: 'english',
      statusCategory: 'bad-category',
      statusCode: 999,
      errorCode: 'bad code with spaces',
      elapsedMs: Number.POSITIVE_INFINITY,
    });

    expect(metadata).toEqual({
      event: safety.TRANSLATION_LIFECYCLE_EVENT,
      phase: 'unknown',
      result: 'failure',
      route: safety.TRANSLATION_SESSION_ROUTE,
      statusCategory: 'unknown',
      durationConfig: {
        maxMinutes: 30,
        maxSeconds: 1800,
        defaultMinutes: 30,
        hardMaxMinutes: 120,
        source: 'default',
      },
      safetyIdentifier: {
        status: 'deferred',
        reason: 'no-stable-non-pii-app-identifier',
      },
    });
  });
});
