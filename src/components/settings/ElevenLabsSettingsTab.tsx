import type { FC } from 'react';
import { ExternalLink, Check, AlertTriangle } from 'lucide-react';
import { hasConfiguredValue } from '@/lib/configPlaceholders';

/**
 * ElevenLabs settings tab
 * Info-only display - voice selection is managed via ElevenLabs dashboard
 */
export const ElevenLabsSettingsTab: FC = () => {
  const agentId = import.meta.env.VITE_ELEVENLABS_AGENT_ID;
  const isConfigured = hasConfiguredValue(agentId);

  return (
    <div className="space-y-6">
      {/* Configuration Status */}
      <div
        className={`flex items-start gap-3 p-4 rounded-xl ${
          isConfigured
            ? 'bg-emerald-500/5 border border-emerald-500/20'
            : 'bg-amber-500/5 border border-amber-500/20'
        }`}
      >
        {isConfigured ? (
          <Check className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
        )}
        <div>
          <p
            className={`font-medium text-sm ${
              isConfigured ? 'text-emerald-300' : 'text-amber-300'
            }`}
          >
            {isConfigured ? 'Agent Configured' : 'Setup Required'}
          </p>
          <p
            className={`text-sm mt-1 ${isConfigured ? 'text-emerald-300/70' : 'text-amber-300/70'}`}
          >
            {isConfigured
              ? 'Your ElevenLabs agent is ready for voice conversations.'
              : 'Configure your ElevenLabs Agent ID in the .env file.'}
          </p>
        </div>
      </div>

      {/* Voice Selection Info */}
      <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
        <p className="text-xs text-amber-300/80">
          ElevenLabs voices are configured via the{' '}
          <a
            href="https://elevenlabs.io/app/conversational-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-amber-300"
          >
            ElevenLabs dashboard
          </a>
          . Voice selection, system prompts, and other settings are managed directly in your agent
          configuration.
        </p>
      </div>

      {/* Setup Instructions (when not configured) */}
      {!isConfigured && (
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Setup Instructions
          </h4>
          <ol className="space-y-2 text-sm text-zinc-400">
            <li className="flex gap-2">
              <span className="text-amber-400/60 font-mono text-xs">01</span>
              <span>Create a .env file in your project root</span>
            </li>
            <li className="flex gap-2">
              <span className="text-amber-400/60 font-mono text-xs">02</span>
              <span>Copy contents from .env.example</span>
            </li>
            <li className="flex gap-2">
              <span className="text-amber-400/60 font-mono text-xs">03</span>
              <span>Replace your_agent_id_here with your Agent ID</span>
            </li>
            <li className="flex gap-2">
              <span className="text-amber-400/60 font-mono text-xs">04</span>
              <span>Restart the development server</span>
            </li>
          </ol>
        </div>
      )}

      {/* External Links */}
      <div className="space-y-2">
        <a
          href="https://elevenlabs.io/docs/conversational-ai/quickstart"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-zinc-300 hover:text-amber-400 hover:border-amber-500/30 transition-all duration-200 group"
        >
          <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-amber-400 transition-colors" />
          <span className="text-sm">ElevenLabs Documentation</span>
        </a>
        <a
          href="https://elevenlabs.io/app/conversational-ai"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-zinc-300 hover:text-amber-400 hover:border-amber-500/30 transition-all duration-200 group"
        >
          <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-amber-400 transition-colors" />
          <span className="text-sm">Open Agent Dashboard</span>
        </a>
      </div>
    </div>
  );
};

export default ElevenLabsSettingsTab;
