import { motion } from 'framer-motion';
import { Clock3, Languages, Mic, Monitor, Play, Radio, ShieldCheck } from 'lucide-react';
import {
  OPENAI_TRANSLATION_DEFAULT_TARGET_LANGUAGE,
  OPENAI_TRANSLATION_LANGUAGE_COUNT,
  detectOpenAITranslationSourceCapabilities,
  getOpenAITranslationSourceCapability,
  getOpenAITranslationSourceModes,
  getTranslationTargetLanguage,
  getTranslationTargetLanguages,
} from '@/lib/openaiTranslation';
import { cn } from '@/lib/utils';
import type { OpenAITranslationSourceMode } from '@/types/openai-translation';

interface OpenAITranslationProviderProps {
  className?: string;
  isLoading?: boolean;
  isEmpty?: boolean;
  isOffline?: boolean;
  errorMessage?: string | null;
}

const SOURCE_MODE_ICONS: Record<OpenAITranslationSourceMode, typeof Mic> = {
  microphone: Mic,
  'browser-tab': Monitor,
};

const STATUS_ITEMS = [
  'Client secret route is available through the backend boundary.',
  'Source capability checks run without requesting microphone or tab permissions.',
  'SDP exchange, playback, and transcripts are deferred.',
  'No microphone permissions or network requests are started from this scaffold.',
] as const;

export function OpenAITranslationProvider({
  className,
  isLoading = false,
  isEmpty = true,
  isOffline = false,
  errorMessage = null,
}: OpenAITranslationProviderProps) {
  const targetLanguages = getTranslationTargetLanguages();
  const defaultLanguage = getTranslationTargetLanguage(OPENAI_TRANSLATION_DEFAULT_TARGET_LANGUAGE);
  const defaultLanguageLabel = defaultLanguage?.label ?? 'English';
  const previewLanguages = targetLanguages.slice(0, 5);
  const sourceCapabilities = detectOpenAITranslationSourceCapabilities();
  const sourceModes = getOpenAITranslationSourceModes();
  const isStartDeferred = true;
  const isStartPending = false;
  const scaffoldStates = [
    {
      label: 'Loading',
      value: isLoading ? 'Preparing scaffold' : 'Idle',
    },
    {
      label: 'Empty',
      value: isEmpty ? 'No translation session started' : 'Session placeholder occupied',
    },
    {
      label: 'Error',
      value: errorMessage ?? 'No scaffold errors',
    },
    {
      label: 'Offline',
      value: isOffline ? 'Offline' : 'Online',
    },
  ] as const;

  return (
    <motion.section
      key="openai-translation-scaffold"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className={cn('min-h-screen flex items-center justify-center px-4 sm:px-6 py-28', className)}
      aria-labelledby="openai-translation-title"
    >
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/25">
            <Languages className="h-7 w-7 text-emerald-300" aria-hidden="true" />
          </div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-300/80">
            OpenAI Realtime Translation
          </p>
          <h1
            id="openai-translation-title"
            className="mt-3 font-display text-4xl sm:text-5xl text-zinc-100"
          >
            Live Translation
          </h1>
          <p className="mt-4 text-zinc-400 max-w-2xl mx-auto">
            A dedicated translation provider path is scaffolded separately from OpenAI voice-agent
            conversations.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
          <section className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5">
            <div className="flex items-center gap-3 mb-5">
              <Radio className="h-5 w-5 text-emerald-300" aria-hidden="true" />
              <h2 className="font-display text-xl text-zinc-100">Source Mode</h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {sourceModes.map((sourceMode) => {
                const Icon = SOURCE_MODE_ICONS[sourceMode.mode];
                const capability = getOpenAITranslationSourceCapability(
                  sourceCapabilities,
                  sourceMode.mode
                );
                const capabilityLabel = capability.canRequest
                  ? 'Available'
                  : capability.status === 'restricted'
                    ? 'Secure context required'
                    : 'Unavailable';
                const description = capability.canRequest
                  ? sourceMode.description
                  : (capability.message ?? sourceMode.unavailableDescription);

                return (
                  <button
                    key={sourceMode.mode}
                    type="button"
                    disabled
                    aria-disabled="true"
                    aria-label={`${sourceMode.label} source mode ${capabilityLabel.toLowerCase()}`}
                    className={cn(
                      'min-h-[124px] rounded-lg border bg-zinc-950/50 p-4',
                      'text-left opacity-75 cursor-not-allowed',
                      capability.canRequest ? 'border-emerald-500/25' : 'border-zinc-800/80'
                    )}
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <Icon
                        className={cn(
                          'h-5 w-5',
                          capability.canRequest ? 'text-emerald-300' : 'text-zinc-500'
                        )}
                        aria-hidden="true"
                      />
                      <span
                        className={cn(
                          'rounded-full border px-2 py-0.5 text-[11px] leading-5',
                          capability.canRequest
                            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200/90'
                            : 'border-zinc-800 bg-zinc-900/80 text-zinc-500'
                        )}
                      >
                        {capabilityLabel}
                      </span>
                    </div>
                    <span className="block text-sm font-medium text-zinc-200">
                      {sourceMode.label}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-zinc-500">
                      {description}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5">
            <div className="flex items-center gap-3 mb-5">
              <Languages className="h-5 w-5 text-emerald-300" aria-hidden="true" />
              <h2 className="font-display text-xl text-zinc-100">Target Language</h2>
            </div>

            <label
              htmlFor="openai-translation-target-language"
              className="block text-sm font-medium text-zinc-300"
            >
              Deferred target language
            </label>
            <select
              id="openai-translation-target-language"
              value={OPENAI_TRANSLATION_DEFAULT_TARGET_LANGUAGE}
              disabled
              aria-describedby="openai-translation-language-help"
              className={cn(
                'mt-2 h-11 w-full rounded-lg border border-zinc-800 bg-zinc-950/70 px-3',
                'text-sm text-zinc-300 disabled:cursor-not-allowed disabled:opacity-75',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50'
              )}
              onChange={() => undefined}
            >
              {targetLanguages.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.label}
                </option>
              ))}
            </select>
            <p id="openai-translation-language-help" className="mt-3 text-sm text-zinc-500">
              Defaulting to {defaultLanguageLabel}. {OPENAI_TRANSLATION_LANGUAGE_COUNT} supported
              target languages are loaded from shared translation metadata.
            </p>

            <div className="mt-4 flex flex-wrap gap-2" aria-label="Language preview">
              {previewLanguages.map((language) => (
                <span
                  key={language.code}
                  className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200/90"
                >
                  {language.label}
                </span>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-4 rounded-xl border border-white/10 bg-zinc-950/60 backdrop-blur-xl p-5">
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"
          >
            <div className="flex gap-4">
              <ShieldCheck className="mt-1 h-6 w-6 flex-shrink-0 text-emerald-300" />
              <div>
                <h2 className="font-display text-xl text-zinc-100">Scaffold Ready</h2>
                <ul className="mt-2 space-y-1 text-sm text-zinc-500">
                  {STATUS_ITEMS.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <dl className="mt-4 grid gap-2 sm:grid-cols-2">
                  {scaffoldStates.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-lg border border-zinc-800/80 bg-zinc-950/50 px-3 py-2"
                    >
                      <dt className="text-xs uppercase tracking-[0.18em] text-zinc-600">
                        {item.label}
                      </dt>
                      <dd className="mt-1 text-sm text-zinc-300">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            <button
              type="button"
              disabled={isStartDeferred || isStartPending || isOffline || Boolean(errorMessage)}
              aria-disabled="true"
              aria-busy={isStartPending}
              aria-describedby="openai-translation-start-help"
              className={cn(
                'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full px-6 py-3',
                'border border-emerald-500/20 bg-emerald-500/10 text-sm font-medium text-emerald-200/70',
                'disabled:cursor-not-allowed disabled:opacity-70'
              )}
            >
              <Play className="h-4 w-4" aria-hidden="true" />
              Start translation
            </button>
          </div>

          <p
            id="openai-translation-start-help"
            className="mt-4 flex items-center gap-2 text-xs text-zinc-500"
          >
            <Clock3 className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            Runtime start is disabled until browser capture and WebRTC lifecycle handling are
            implemented.
          </p>
        </section>
      </div>
    </motion.section>
  );
}
