import { Languages } from 'lucide-react';
import {
  OPENAI_TRANSLATION_LANGUAGE_COUNT,
  getTranslationTargetLanguages,
  validateTranslationTargetLanguage,
} from '@/lib/openaiTranslation';
import { cn } from '@/lib/utils';
import type { OpenAITranslationTargetLanguageCode } from '@/types/openai-translation';

interface OpenAITranslationLanguageSelectProps {
  readonly value: OpenAITranslationTargetLanguageCode;
  readonly disabled?: boolean;
  readonly onChange: (value: OpenAITranslationTargetLanguageCode) => void;
}

export function OpenAITranslationLanguageSelect({
  value,
  disabled = false,
  onChange,
}: OpenAITranslationLanguageSelectProps) {
  const targetLanguages = getTranslationTargetLanguages();

  return (
    <section
      className="rounded-xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl sm:p-5"
      aria-labelledby="openai-translation-language-heading"
    >
      <div className="mb-4 flex items-center gap-3">
        <Languages className="h-5 w-5 text-sky-300" aria-hidden="true" />
        <div>
          <h2
            id="openai-translation-language-heading"
            className="font-display text-xl text-zinc-100"
          >
            Target Language
          </h2>
          <p className="text-xs leading-5 text-zinc-500">
            {OPENAI_TRANSLATION_LANGUAGE_COUNT} supported target languages.
          </p>
        </div>
      </div>

      <label
        htmlFor="openai-translation-target-language"
        className="block text-sm font-medium text-zinc-300"
      >
        Target language
      </label>
      <select
        id="openai-translation-target-language"
        value={value}
        disabled={disabled}
        aria-describedby="openai-translation-language-help"
        className={cn(
          'mt-2 h-11 w-full rounded-lg border border-zinc-800 bg-zinc-950/75 px-3',
          'text-sm text-zinc-200 disabled:cursor-not-allowed disabled:opacity-60',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60'
        )}
        onChange={(event) => {
          const validation = validateTranslationTargetLanguage(event.target.value);
          if (validation.valid) {
            onChange(validation.value);
          }
        }}
      >
        {targetLanguages.map((language) => (
          <option key={language.code} value={language.code}>
            {language.label}
          </option>
        ))}
      </select>
      <p id="openai-translation-language-help" className="mt-3 text-sm leading-6 text-zinc-500">
        Language changes apply to the next translation session.
      </p>
    </section>
  );
}
