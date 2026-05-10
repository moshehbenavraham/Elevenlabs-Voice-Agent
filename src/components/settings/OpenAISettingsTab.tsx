import { type FC } from 'react';
import { VoiceSelector } from '@/components/voice/VoiceSelector';
import { useOpenAIVoice } from '@/hooks/useOpenAIVoice';
import type { ProviderSettings } from '@/lib/settingsStorage';
import { cn } from '@/lib/utils';

interface OpenAISettingsTabProps {
  settings: ProviderSettings;
  onSettingsChange: (updates: Partial<ProviderSettings>) => void;
}

/**
 * OpenAI provider settings tab
 * Includes voice selection and system prompt editing
 */
export const OpenAISettingsTab: FC<OpenAISettingsTabProps> = ({ settings, onSettingsChange }) => {
  // Get context values - may be null if not within provider
  let contextVoice = settings.voice;
  let contextSetVoice = (voice: string) => onSettingsChange({ voice });
  let contextSystemPrompt = settings.systemPrompt;
  let contextSetSystemPrompt = (prompt: string) => onSettingsChange({ systemPrompt: prompt });
  let isConnected = false;

  // Try to get context if available
  try {
    const context = useOpenAIVoice();
    if (context) {
      contextVoice = context.selectedVoice;
      contextSetVoice = (voice: string) => {
        context.setVoice(voice);
        onSettingsChange({ voice });
      };
      contextSystemPrompt = context.systemPrompt;
      contextSetSystemPrompt = (prompt: string) => {
        context.setSystemPrompt(prompt);
        onSettingsChange({ systemPrompt: prompt });
      };
      isConnected = context.isConnected;
    }
  } catch {
    // Context not available, use local state
  }

  // Handle prompt change with debounce
  const handlePromptChange = (value: string) => {
    contextSetSystemPrompt(value);
  };

  return (
    <div className="space-y-6">
      {/* Voice Selection */}
      <VoiceSelector
        provider="openai"
        value={contextVoice}
        onValueChange={contextSetVoice}
        disabled={isConnected}
      />

      {/* System Prompt */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-zinc-400">System Prompt</label>
        <textarea
          value={contextSystemPrompt}
          onChange={(e) => handlePromptChange(e.target.value)}
          disabled={isConnected}
          rows={4}
          className={cn(
            'w-full px-3 py-2 rounded-lg text-sm',
            'bg-zinc-900/50 backdrop-blur-sm',
            'border border-zinc-700/50',
            'text-zinc-100 placeholder:text-zinc-500',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:ring-offset-2 focus:ring-offset-zinc-900',
            'hover:border-zinc-600',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'resize-none'
          )}
          placeholder="Enter system prompt for GPT-4o..."
        />
        {isConnected && <p className="text-xs text-zinc-500">Disconnect to change system prompt</p>}
      </div>

      {/* Provider Info */}
      <div className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/20">
        <p className="text-xs text-violet-300/80">
          OpenAI Realtime API provides low-latency voice conversations with GPT-4o. 8 voices
          available. System prompt changes apply on next connection.
        </p>
      </div>
    </div>
  );
};

export default OpenAISettingsTab;
