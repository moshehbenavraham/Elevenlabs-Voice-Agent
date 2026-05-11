import { describe, expect, it, vi } from 'vitest';
import {
  OPENAI_TRANSLATION_BACKEND_SESSION_ROUTE,
  OPENAI_TRANSLATION_DEFAULT_AUDIO_MIX_PERCENT,
  OPENAI_TRANSLATION_ENDPOINTS,
  OPENAI_TRANSLATION_INPUT_TRANSCRIPTION_MODEL,
  OPENAI_TRANSLATION_LANGUAGE_COUNT,
  OPENAI_TRANSLATION_MODEL,
  OPENAI_TRANSLATION_SOURCE_MODE_METADATA,
  OPENAI_TRANSLATION_SOURCE_MODES,
  OPENAI_TRANSLATION_TARGET_LANGUAGES,
  applyOpenAITranslationTranscriptEvent,
  assertTranslationTargetLanguage,
  buildOpenAITranslationDisplayMediaOptions,
  buildTranslationAudioMixState,
  buildTranslationSessionConfig,
  buildTranslationSessionRequest,
  buildTranslationSessionRequestDescriptor,
  buildTranslationSessionUpdate,
  clampTranslationAudioMixPercent,
  createOpenAITranslationMissingAudioTrackError,
  createOpenAITranslationRuntimeError,
  detectOpenAITranslationSourceCapabilities,
  exchangeOpenAITranslationSdp,
  getLatestOpenAITranslationCaption,
  getOpenAITranslationSourceCapability,
  getOpenAITranslationSourceModeMetadata,
  getOpenAITranslationSourceModes,
  getOpenAITranslationTranscriptDisplayEntries,
  getOpenAITranslationTranscriptEntriesByStream,
  getOriginalAudioVolume,
  getTranslationTargetLanguages,
  getTranslatedAudioVolume,
  getTranslationTargetLanguage,
  getTranslationTargetLanguageCodes,
  isOpenAITranslationBusyStatus,
  isOpenAITranslationRuntimeError,
  isOpenAITranslationSourceError,
  isOpenAITranslationSourceMode,
  isOpenAITranslationStartingStatus,
  isOpenAITranslationTerminalStatus,
  mapOpenAITranslationSourceError,
  isTranslationTargetLanguage,
  normalizeTranslationTargetLanguage,
  parseOpenAITranslationDataChannelMessage,
  requestOpenAITranslationClientSecret,
  shouldRetryOpenAITranslationStatus,
  summarizeOpenAITranslationTranscripts,
  validateTranslationTargetLanguage,
} from '@/lib/openaiTranslation';
import type {
  OpenAITranslationFetch,
  OpenAITranslationSessionRequestDescriptor,
  OpenAITranslationTargetLanguage,
  OpenAITranslationTranscriptEntry,
} from '@/types/openai-translation';

const EXPECTED_PRD_TARGET_LANGUAGES = [
  { code: 'es', label: 'Spanish' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'fr', label: 'French' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ru', label: 'Russian' },
  { code: 'zh', label: 'Chinese' },
  { code: 'de', label: 'German' },
  { code: 'ko', label: 'Korean' },
  { code: 'hi', label: 'Hindi' },
  { code: 'id', label: 'Indonesian' },
  { code: 'vi', label: 'Vietnamese' },
  { code: 'it', label: 'Italian' },
  { code: 'en', label: 'English' },
] as const satisfies readonly OpenAITranslationTargetLanguage[];

const EXPECTED_PRD_TARGET_LANGUAGE_CODES = EXPECTED_PRD_TARGET_LANGUAGES.map(
  (language) => language.code
);

describe('openaiTranslation', () => {
  describe('translation constants', () => {
    it('exports model, endpoint, and local route metadata', () => {
      expect(OPENAI_TRANSLATION_MODEL).toBe('gpt-realtime-translate');
      expect(OPENAI_TRANSLATION_INPUT_TRANSCRIPTION_MODEL).toBe('gpt-realtime-whisper');
      expect(OPENAI_TRANSLATION_BACKEND_SESSION_ROUTE).toBe('/api/openai/translation-session');
      expect(OPENAI_TRANSLATION_ENDPOINTS).toEqual({
        realtime: 'https://api.openai.com/v1/realtime/translations',
        calls: 'https://api.openai.com/v1/realtime/translations/calls',
        clientSecrets: 'https://api.openai.com/v1/realtime/translations/client_secrets',
      });
    });

    it('contains exactly the PRD target output languages in order', () => {
      const languageCodes = getTranslationTargetLanguageCodes();
      const labels = OPENAI_TRANSLATION_TARGET_LANGUAGES.map((language) => language.label);

      expect(languageCodes).toEqual(EXPECTED_PRD_TARGET_LANGUAGE_CODES);
      expect(getTranslationTargetLanguages()).toEqual(EXPECTED_PRD_TARGET_LANGUAGES);
      expect(OPENAI_TRANSLATION_TARGET_LANGUAGES).toEqual(EXPECTED_PRD_TARGET_LANGUAGES);
      expect(OPENAI_TRANSLATION_LANGUAGE_COUNT).toBe(13);
      expect(new Set(languageCodes).size).toBe(languageCodes.length);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it('uses ASCII-only English labels', () => {
      for (const language of OPENAI_TRANSLATION_TARGET_LANGUAGES) {
        expect(language.code).toMatch(/^[a-z]{2}$/);
        expect(language.label).toMatch(/^[\x20-\x7E]+$/);
        for (const character of language.label) {
          expect(character.charCodeAt(0)).toBeLessThanOrEqual(127);
        }
        expect(language.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe('source capture helpers', () => {
    it('exports stable source metadata in PRD order', () => {
      expect(OPENAI_TRANSLATION_SOURCE_MODES).toEqual(['microphone', 'browser-tab']);
      expect(getOpenAITranslationSourceModes()).toEqual(OPENAI_TRANSLATION_SOURCE_MODE_METADATA);
      expect(getOpenAITranslationSourceModeMetadata('microphone')).toMatchObject({
        mode: 'microphone',
        label: 'Microphone',
        actionLabel: 'Use microphone',
      });
      expect(getOpenAITranslationSourceModeMetadata('browser-tab')).toMatchObject({
        mode: 'browser-tab',
        label: 'Tab audio',
        actionLabel: 'Use tab audio',
      });
      expect(isOpenAITranslationSourceMode('microphone')).toBe(true);
      expect(isOpenAITranslationSourceMode('tab-audio')).toBe(false);

      for (const sourceMode of OPENAI_TRANSLATION_SOURCE_MODE_METADATA) {
        expect(sourceMode.label).toMatch(/^[\x20-\x7E]+$/);
        expect(sourceMode.description).toMatch(/^[\x20-\x7E]+$/);
      }
    });

    it('builds display-media options and rejects invalid option shapes', () => {
      expect(buildOpenAITranslationDisplayMediaOptions()).toEqual({
        audio: true,
        video: true,
        preferCurrentTab: true,
        selfBrowserSurface: 'include',
        surfaceSwitching: 'include',
        systemAudio: 'include',
      });
      expect(
        buildOpenAITranslationDisplayMediaOptions({
          preferCurrentTab: false,
          includeSystemAudio: false,
          surfaceSwitching: false,
        })
      ).toEqual({
        audio: true,
        video: true,
        preferCurrentTab: false,
        selfBrowserSurface: 'include',
        surfaceSwitching: 'exclude',
        systemAudio: 'exclude',
      });

      let caughtError: unknown = null;
      try {
        buildOpenAITranslationDisplayMediaOptions({ includeSystemAudio: 'yes' });
      } catch (error) {
        caughtError = error;
      }

      expect(caughtError).toMatchObject({
        kind: 'capture-failed',
        mode: 'browser-tab',
        code: 'invalid-display-media-options',
      });
      expect(isOpenAITranslationSourceError(caughtError)).toBe(true);
    });

    it('detects source capabilities without requesting media permissions', () => {
      const mediaDevices = {
        getUserMedia: vi.fn(),
        getDisplayMedia: vi.fn(),
      };

      const available = detectOpenAITranslationSourceCapabilities(mediaDevices, true);
      expect(available.microphone).toMatchObject({
        mode: 'microphone',
        supported: true,
        canRequest: true,
        status: 'available',
        message: null,
      });
      expect(getOpenAITranslationSourceCapability(available, 'browser-tab')).toMatchObject({
        mode: 'browser-tab',
        supported: true,
        canRequest: true,
        status: 'available',
      });
      expect(mediaDevices.getUserMedia).not.toHaveBeenCalled();
      expect(mediaDevices.getDisplayMedia).not.toHaveBeenCalled();

      expect(detectOpenAITranslationSourceCapabilities(null, true).microphone).toMatchObject({
        status: 'unavailable',
        canRequest: false,
      });
      expect(
        detectOpenAITranslationSourceCapabilities({ getUserMedia: vi.fn() }, true).browserTab
      ).toMatchObject({
        status: 'unsupported',
        canRequest: false,
      });
      expect(
        detectOpenAITranslationSourceCapabilities(mediaDevices, false).microphone
      ).toMatchObject({
        status: 'restricted',
        supported: true,
        canRequest: false,
      });
    });

    it('maps browser capture failures to stable source errors', () => {
      expect(
        mapOpenAITranslationSourceError({ name: 'NotAllowedError' }, 'microphone')
      ).toMatchObject({
        kind: 'permission-denied',
        mode: 'microphone',
        code: 'permission-denied',
        rawName: 'NotAllowedError',
      });
      expect(mapOpenAITranslationSourceError({ name: 'AbortError' }, 'browser-tab')).toMatchObject({
        kind: 'capture-cancelled',
        mode: 'browser-tab',
        code: 'capture-cancelled',
      });
      expect(
        mapOpenAITranslationSourceError({ name: 'NotFoundError' }, 'microphone')
      ).toMatchObject({
        kind: 'device-unavailable',
        mode: 'microphone',
        code: 'device-unavailable',
      });
      expect(mapOpenAITranslationSourceError({ name: 'TypeError' }, 'browser-tab')).toMatchObject({
        kind: 'capture-failed',
        mode: 'browser-tab',
        code: 'capture-failed',
      });
      expect(mapOpenAITranslationSourceError(new Error('nope'), 'microphone')).toMatchObject({
        kind: 'unknown',
        mode: 'microphone',
        code: 'unknown-capture-error',
      });
      expect(createOpenAITranslationMissingAudioTrackError('browser-tab')).toMatchObject({
        kind: 'missing-audio-track',
        mode: 'browser-tab',
        code: 'missing-audio-track',
      });
    });
  });

  describe('target language helpers', () => {
    it('normalizes supported language codes', () => {
      expect(normalizeTranslationTargetLanguage(' ES ')).toBe('es');
      expect(normalizeTranslationTargetLanguage('pt')).toBe('pt');
      expect(validateTranslationTargetLanguage(' JA ')).toEqual({
        valid: true,
        value: 'ja',
      });
      expect(assertTranslationTargetLanguage(' ko ')).toBe('ko');
    });

    it('uses a strict type guard for already-normalized codes', () => {
      expect(isTranslationTargetLanguage('es')).toBe(true);
      expect(isTranslationTargetLanguage(' ES ')).toBe(false);
      expect(isTranslationTargetLanguage('ar')).toBe(false);
    });

    it('looks up language metadata after normalization', () => {
      expect(getTranslationTargetLanguage(' FR ')).toEqual({
        code: 'fr',
        label: 'French',
      });
      expect(getTranslationTargetLanguage('nl')).toBeUndefined();
    });

    it('rejects malformed or unsupported language inputs', () => {
      const invalidValues = [undefined, null, 42, {}, '', '   ', 'english', 'e', 'e-', 'ar'];

      for (const value of invalidValues) {
        expect(normalizeTranslationTargetLanguage(value)).toBeNull();
        expect(validateTranslationTargetLanguage(value).valid).toBe(false);
      }

      expect(() => assertTranslationTargetLanguage('nl')).toThrow(
        'targetLanguage: must be one of es, pt, fr, ja, ru, zh, de, ko, hi, id, vi, it, en'
      );
    });
  });

  describe('audio mix helpers', () => {
    it('clamps unsafe mix percentages', () => {
      expect(clampTranslationAudioMixPercent(-5)).toBe(0);
      expect(clampTranslationAudioMixPercent(105)).toBe(100);
      expect(clampTranslationAudioMixPercent('40.5')).toBe(40.5);
      expect(clampTranslationAudioMixPercent(33.335)).toBe(33.34);
      expect(clampTranslationAudioMixPercent('', 25)).toBe(25);
      expect(clampTranslationAudioMixPercent(null, 15.5)).toBe(15.5);
      expect(clampTranslationAudioMixPercent('not-number')).toBe(85);
      expect(clampTranslationAudioMixPercent(Number.NaN)).toBe(85);
      expect(clampTranslationAudioMixPercent(Number.POSITIVE_INFINITY)).toBe(85);
      expect(clampTranslationAudioMixPercent(undefined, Number.POSITIVE_INFINITY)).toBe(
        OPENAI_TRANSLATION_DEFAULT_AUDIO_MIX_PERCENT
      );
    });

    it('builds deterministic original and translated volume state', () => {
      expect(buildTranslationAudioMixState('40.5')).toEqual({
        translatedPercent: 40.5,
        originalPercent: 59.5,
        translatedVolume: 0.405,
        originalVolume: 0.595,
        valueLabel: '40.5% translated',
        translatedLabel: 'Translated 40.5%',
        originalLabel: 'Original 59.5%',
      });
      expect(buildTranslationAudioMixState(33.335)).toEqual({
        translatedPercent: 33.34,
        originalPercent: 66.66,
        translatedVolume: 0.3334,
        originalVolume: 0.6666,
        valueLabel: '33.34% translated',
        translatedLabel: 'Translated 33.34%',
        originalLabel: 'Original 66.66%',
      });
      expect(buildTranslationAudioMixState('')).toEqual({
        translatedPercent: 85,
        originalPercent: 15,
        translatedVolume: 0.85,
        originalVolume: 0.15,
        valueLabel: '85% translated',
        translatedLabel: 'Translated 85%',
        originalLabel: 'Original 15%',
      });
      expect(getTranslatedAudioVolume(25)).toBe(0.25);
      expect(getOriginalAudioVolume(25)).toBe(0.75);
      expect(getTranslatedAudioVolume(150)).toBe(1);
      expect(getOriginalAudioVolume(-10)).toBe(1);
    });
  });

  describe('payload builders', () => {
    it('builds translation session config without voice-agent fields', () => {
      const config = buildTranslationSessionConfig({
        targetLanguage: ' ES ',
      });

      expect(config).toEqual({
        model: 'gpt-realtime-translate',
        audio: {
          output: {
            language: 'es',
          },
        },
      });
      expect('instructions' in config).toBe(false);
      expect('tools' in config).toBe(false);
      expect('voice' in config.audio.output).toBe(false);
    });

    it('adds optional transcription and noise reduction only when enabled', () => {
      expect(
        buildTranslationSessionConfig({
          targetLanguage: 'fr',
          enableInputTranscription: true,
          enableNoiseReduction: true,
        })
      ).toEqual({
        model: 'gpt-realtime-translate',
        audio: {
          input: {
            transcription: {
              model: 'gpt-realtime-whisper',
            },
            noise_reduction: {
              type: 'near_field',
            },
          },
          output: {
            language: 'fr',
          },
        },
      });
    });

    it('builds a translation-specific session.update payload', () => {
      const update = buildTranslationSessionUpdate({
        targetLanguage: 'JA',
        enableInputTranscription: true,
      });

      expect(update).toEqual({
        type: 'session.update',
        session: {
          audio: {
            input: {
              transcription: {
                model: 'gpt-realtime-whisper',
              },
            },
            output: {
              language: 'ja',
            },
          },
        },
      });
      expect('model' in update.session).toBe(false);
    });

    it('builds local translation-session request shapes', () => {
      expect(buildTranslationSessionRequest(' ID ')).toEqual({
        targetLanguage: 'id',
      });

      const descriptor: OpenAITranslationSessionRequestDescriptor =
        buildTranslationSessionRequestDescriptor(' VI ');
      expect(descriptor.url).toBe('/api/openai/translation-session');
      expect(descriptor.init.method).toBe('POST');
      expect(descriptor.init.headers).toEqual({
        'Content-Type': 'application/json',
      });
      expect(descriptor.init.body).toBe('{"targetLanguage":"vi"}');
      expect(JSON.parse(descriptor.init.body)).toEqual({
        targetLanguage: 'vi',
      });
      expect(Object.keys(JSON.parse(descriptor.init.body))).toEqual(['targetLanguage']);
    });
  });

  describe('runtime error and status helpers', () => {
    it('builds stable typed runtime errors', () => {
      const error = createOpenAITranslationRuntimeError('sdp-exchange', 'SDP failed', {
        status: 502,
        code: 'bad-gateway',
      });

      expect(error).toEqual({
        kind: 'sdp-exchange',
        message: 'SDP failed',
        recoverable: true,
        status: 502,
        code: 'bad-gateway',
      });
      expect(isOpenAITranslationRuntimeError(error)).toBe(true);
      expect(isOpenAITranslationRuntimeError(new Error('nope'))).toBe(false);
    });

    it('classifies runtime statuses and retryable HTTP responses', () => {
      expect(isOpenAITranslationStartingStatus('requesting-client-secret')).toBe(true);
      expect(isOpenAITranslationStartingStatus('connected')).toBe(false);
      expect(isOpenAITranslationBusyStatus('stopping')).toBe(true);
      expect(isOpenAITranslationBusyStatus('stopped')).toBe(false);
      expect(isOpenAITranslationTerminalStatus('idle')).toBe(true);
      expect(isOpenAITranslationTerminalStatus('connecting')).toBe(false);
      expect(shouldRetryOpenAITranslationStatus(408)).toBe(true);
      expect(shouldRetryOpenAITranslationStatus(429)).toBe(true);
      expect(shouldRetryOpenAITranslationStatus(503)).toBe(true);
      expect(shouldRetryOpenAITranslationStatus(400)).toBe(false);
    });
  });

  describe('data-channel event parsing', () => {
    it('parses known source transcript deltas', () => {
      const parsed = parseOpenAITranslationDataChannelMessage(
        JSON.stringify({
          type: 'conversation.item.input_audio_transcription.delta',
          item_id: 'source-1',
          delta: 'hel',
        })
      );

      expect(parsed).toEqual({
        ok: true,
        kind: 'transcript',
        event: {
          id: 'source-1',
          stream: 'source',
          phase: 'delta',
          text: 'hel',
          rawType: 'conversation.item.input_audio_transcription.delta',
        },
      });
    });

    it('parses known translated final transcripts', () => {
      const parsed = parseOpenAITranslationDataChannelMessage({
        type: 'response.audio_transcript.done',
        response_id: 'translated-1',
        transcript: 'hola',
      });

      expect(parsed).toEqual({
        ok: true,
        kind: 'transcript',
        event: {
          id: 'translated-1',
          stream: 'translated',
          phase: 'final',
          text: 'hola',
          rawType: 'response.audio_transcript.done',
        },
      });
    });

    it('ignores unknown event types without failing', () => {
      const parsed = parseOpenAITranslationDataChannelMessage({
        type: 'session.created',
        session: { id: 'session-1' },
      });

      expect(parsed).toEqual({
        ok: true,
        kind: 'unknown',
        eventType: 'session.created',
        raw: {
          type: 'session.created',
          session: { id: 'session-1' },
        },
      });
    });

    it('returns typed parser errors for malformed or missing event data', () => {
      const malformed = parseOpenAITranslationDataChannelMessage('{"type":');
      const missingText = parseOpenAITranslationDataChannelMessage({
        type: 'translation.source_transcript.delta',
        item_id: 'source-1',
      });

      expect(malformed.ok).toBe(false);
      if (!malformed.ok) {
        expect(malformed.error).toMatchObject({
          kind: 'parser',
          code: 'malformed-json',
        });
      }

      expect(missingText.ok).toBe(false);
      if (!missingText.ok) {
        expect(missingText.error).toMatchObject({
          kind: 'parser',
          code: 'missing-transcript-text',
        });
      }
    });

    it('parses translated transcript aliases and rejects blank transcript text', () => {
      const translatedDelta = parseOpenAITranslationDataChannelMessage({
        type: 'translation.translation_transcript.delta',
        response_id: 'translated-2',
        delta: 'bon',
      });
      const blankText = parseOpenAITranslationDataChannelMessage({
        type: 'translation.translated_transcript.final',
        response_id: 'translated-3',
        transcript: '   ',
      });

      expect(translatedDelta).toEqual({
        ok: true,
        kind: 'transcript',
        event: {
          id: 'translated-2',
          stream: 'translated',
          phase: 'delta',
          text: 'bon',
          rawType: 'translation.translation_transcript.delta',
        },
      });
      expect(blankText.ok).toBe(false);
      if (!blankText.ok) {
        expect(blankText.error).toMatchObject({
          kind: 'parser',
          code: 'missing-transcript-text',
        });
      }
    });
  });

  describe('transcript normalization', () => {
    it('appends partial entries and replaces final entries by id and stream', () => {
      const first = applyOpenAITranslationTranscriptEvent(
        [],
        {
          id: 'source-1',
          stream: 'source',
          phase: 'delta',
          text: 'hel',
          rawType: 'translation.source_transcript.delta',
        },
        10
      );
      const second = applyOpenAITranslationTranscriptEvent(
        first,
        {
          id: 'source-1',
          stream: 'source',
          phase: 'delta',
          text: 'lo',
          rawType: 'translation.source_transcript.delta',
        },
        20
      );
      const final = applyOpenAITranslationTranscriptEvent(
        second,
        {
          id: 'source-1',
          stream: 'source',
          phase: 'final',
          text: 'hello',
          rawType: 'translation.source_transcript.done',
        },
        30
      );

      expect(first).toEqual([
        {
          id: 'source-1',
          stream: 'source',
          text: 'hel',
          isFinal: false,
          updatedAt: 10,
        },
      ]);
      expect(second[0]).toMatchObject({
        text: 'hello',
        isFinal: false,
        updatedAt: 20,
      });
      expect(final[0]).toMatchObject({
        text: 'hello',
        isFinal: true,
        updatedAt: 30,
      });
    });

    it('keeps source and translated transcript entries separate', () => {
      const entries = applyOpenAITranslationTranscriptEvent(
        [
          {
            id: 'same-id',
            stream: 'source',
            text: 'hello',
            isFinal: true,
            updatedAt: 1,
          },
        ],
        {
          id: 'same-id',
          stream: 'translated',
          phase: 'final',
          text: 'hola',
          rawType: 'response.audio_transcript.done',
        },
        2
      );

      expect(entries).toHaveLength(2);
      expect(entries[0].stream).toBe('source');
      expect(entries[1]).toMatchObject({
        stream: 'translated',
        text: 'hola',
        isFinal: true,
      });
    });

    it('keeps same-id final replacements stable and ignores stale deltas after final', () => {
      const partial = applyOpenAITranslationTranscriptEvent(
        [],
        {
          id: 'source-2',
          stream: 'source',
          phase: 'delta',
          text: 'hel',
          rawType: 'translation.source_transcript.delta',
        },
        10
      );
      const final = applyOpenAITranslationTranscriptEvent(
        partial,
        {
          id: 'source-2',
          stream: 'source',
          phase: 'final',
          text: 'hello',
          rawType: 'translation.source_transcript.final',
        },
        20
      );
      const staleDelta = applyOpenAITranslationTranscriptEvent(
        final,
        {
          id: 'source-2',
          stream: 'source',
          phase: 'delta',
          text: ' again',
          rawType: 'translation.source_transcript.delta',
        },
        30
      );

      expect(final).toHaveLength(1);
      expect(final[0]).toMatchObject({
        text: 'hello',
        isFinal: true,
        updatedAt: 20,
      });
      expect(staleDelta).toEqual(final);
    });

    it('builds display selectors for stream filtering, summaries, and latest captions', () => {
      const entries: readonly OpenAITranslationTranscriptEntry[] = [
        {
          id: 'source-1',
          stream: 'source',
          text: 'hel',
          isFinal: false,
          updatedAt: 10,
        },
        {
          id: 'translated-1',
          stream: 'translated',
          text: 'hola',
          isFinal: false,
          updatedAt: 20,
        },
        {
          id: 'source-1',
          stream: 'source',
          text: 'hello',
          isFinal: true,
          updatedAt: 30,
        },
        {
          id: 'translated-2',
          stream: 'translated',
          text: 'adios',
          isFinal: true,
          updatedAt: 40,
        },
        {
          id: 'blank',
          stream: 'source',
          text: '   ',
          isFinal: false,
          updatedAt: 50,
        },
      ];

      expect(getOpenAITranslationTranscriptEntriesByStream(entries, 'source')).toEqual([
        {
          id: 'source-1',
          stream: 'source',
          text: 'hello',
          isFinal: true,
          updatedAt: 30,
        },
      ]);
      expect(getOpenAITranslationTranscriptDisplayEntries(entries)).toMatchObject([
        {
          id: 'source-1',
          sequence: 1,
          streamLabel: 'Source',
          statusLabel: 'Final',
        },
        {
          id: 'translated-1',
          sequence: 2,
          streamLabel: 'Translated',
          statusLabel: 'Partial',
        },
        {
          id: 'translated-2',
          sequence: 3,
          streamLabel: 'Translated',
          statusLabel: 'Final',
        },
      ]);
      expect(getLatestOpenAITranslationCaption(entries)).toMatchObject({
        id: 'translated-2',
        text: 'adios',
        stream: 'translated',
        statusLabel: 'Final',
      });
      expect(summarizeOpenAITranslationTranscripts(entries)).toEqual({
        totalCount: 3,
        sourceCount: 1,
        translatedCount: 2,
        finalCount: 2,
        partialCount: 1,
        hasEntries: true,
        hasTranslatedCaption: true,
      });
    });
  });

  describe('runtime request helpers', () => {
    it('requests a sanitized client secret through the backend route', async () => {
      const fetcher = vi.fn(
        async (_input: RequestInfo | URL, _init?: RequestInit): Promise<Response> =>
          new Response(
            JSON.stringify({
              clientSecret: 'ek_test',
              expiresAt: '2026-05-11T18:30:00.000Z',
              targetLanguage: 'es',
              model: 'gpt-realtime-translate',
            }),
            { status: 200 }
          )
      ) satisfies OpenAITranslationFetch;

      await expect(
        requestOpenAITranslationClientSecret({
          targetLanguage: 'es',
          apiBaseUrl: 'http://localhost:3001',
          fetcher,
          retryDelayMs: 0,
        })
      ).resolves.toEqual({
        clientSecret: 'ek_test',
        expiresAt: '2026-05-11T18:30:00.000Z',
        targetLanguage: 'es',
        model: 'gpt-realtime-translate',
      });
      expect(fetcher).toHaveBeenCalledWith(
        'http://localhost:3001/api/openai/translation-session',
        expect.objectContaining({
          method: 'POST',
          body: '{"targetLanguage":"es"}',
        })
      );
    });

    it('retries retryable client-secret failures and returns typed errors', async () => {
      const fetcher = vi
        .fn(async (): Promise<Response> => new Response('service down', { status: 503 }))
        .mockResolvedValueOnce(new Response('service down', { status: 503 }));

      await expect(
        requestOpenAITranslationClientSecret({
          targetLanguage: 'fr',
          fetcher,
          retryCount: 1,
          retryDelayMs: 0,
        })
      ).rejects.toMatchObject({
        kind: 'client-secret',
        status: 503,
      });
      expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it('exchanges SDP with the translation calls endpoint', async () => {
      const fetcher = vi.fn(
        async (_input: RequestInfo | URL, _init?: RequestInit): Promise<Response> =>
          new Response('answer-sdp', { status: 200 })
      ) satisfies OpenAITranslationFetch;

      await expect(
        exchangeOpenAITranslationSdp({
          clientSecret: 'ek_test',
          offerSdp: 'offer-sdp',
          fetcher,
          retryDelayMs: 0,
        })
      ).resolves.toBe('answer-sdp');
      expect(fetcher).toHaveBeenCalledWith(
        'https://api.openai.com/v1/realtime/translations/calls',
        expect.objectContaining({
          method: 'POST',
          body: 'offer-sdp',
          headers: {
            Authorization: 'Bearer ek_test',
            'Content-Type': 'application/sdp',
          },
        })
      );
    });

    it('rejects invalid SDP exchange inputs before fetching', async () => {
      const fetcher = vi.fn(async (): Promise<Response> => new Response('answer-sdp'));

      await expect(
        exchangeOpenAITranslationSdp({
          clientSecret: '',
          offerSdp: 'offer-sdp',
          fetcher,
        })
      ).rejects.toMatchObject({
        kind: 'sdp-exchange',
        code: 'missing-client-secret',
      });
      expect(fetcher).not.toHaveBeenCalled();
    });
  });
});
