import type { FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, ExternalLink, X, Check, AlertTriangle } from 'lucide-react';

interface ConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConfigurationModal: FC<ConfigurationModalProps> = ({ isOpen, onClose }) => {
  const agentId = import.meta.env.VITE_ELEVENLABS_AGENT_ID;
  const isConfigured = agentId && agentId !== 'your_agent_id_here';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4"
          >
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="px-6 py-5 border-b border-zinc-800/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <Settings className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="font-display text-lg text-zinc-100">Configuration</h2>
                    <p className="text-xs text-zinc-500">Voice agent settings</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Status */}
                <div
                  className={`flex items-start gap-3 p-4 rounded-xl ${
                    isConfigured
                      ? 'bg-emerald-500/5 border border-emerald-500/20'
                      : 'bg-amber-500/5 border border-amber-500/20'
                  }`}
                >
                  {isConfigured ? (
                    <Check className="w-5 h-5 text-emerald-400 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
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
                      className={`text-sm mt-1 ${
                        isConfigured ? 'text-emerald-300/70' : 'text-amber-300/70'
                      }`}
                    >
                      {isConfigured
                        ? 'Your ElevenLabs agent is ready for voice conversations.'
                        : 'Configure your ElevenLabs Agent ID to enable voice chat.'}
                    </p>
                  </div>
                </div>

                {/* Instructions */}
                <div className="space-y-4">
                  <h3 className="font-mono text-xs text-zinc-500 uppercase tracking-wider">
                    Setup Instructions
                  </h3>
                  <ol className="space-y-3">
                    {[
                      {
                        step: '01',
                        text: 'Create a .env file in your project root',
                      },
                      {
                        step: '02',
                        text: 'Copy contents from .env.example',
                      },
                      {
                        step: '03',
                        text: 'Replace your_agent_id_here with your Agent ID',
                      },
                      {
                        step: '04',
                        text: 'Restart the development server',
                      },
                    ].map((item) => (
                      <li key={item.step} className="flex items-start gap-3">
                        <span className="font-mono text-xs text-amber-400/60 mt-0.5">
                          {item.step}
                        </span>
                        <span className="text-sm text-zinc-400">{item.text}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Links */}
                <div className="pt-2 space-y-2">
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
                    href="https://github.com/moshehbenavraham/Elevenlabs-Voice-Agent"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-zinc-300 hover:text-amber-400 hover:border-amber-500/30 transition-all duration-200 group"
                  >
                    <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-amber-400 transition-colors" />
                    <span className="text-sm">View on GitHub</span>
                  </a>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-zinc-900/50 border-t border-zinc-800/50">
                <button
                  onClick={onClose}
                  className="w-full py-3 rounded-lg bg-amber-500 text-zinc-900 font-medium hover:bg-amber-400 transition-colors"
                >
                  {isConfigured ? 'Done' : 'Close'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
