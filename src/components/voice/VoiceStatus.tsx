import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { useVoice } from '@/contexts/VoiceContext';
import { cn } from '@/lib/utils';

interface VoiceStatusProps {
  className?: string;
  showMessages?: boolean;
}

export function VoiceStatus({ className, showMessages = true }: VoiceStatusProps) {
  const { isConnected, isLoading, isSpeaking, error, messages } = useVoice();

  return (
    <div className={cn('space-y-4', className)}>
      {/* Connection Status Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'flex items-center justify-between px-4 py-3 rounded-lg',
          'border backdrop-blur-sm transition-all duration-300',
          {
            'border-zinc-800/50 bg-zinc-900/50': !isConnected && !error && !isLoading,
            'border-amber-500/20 bg-amber-500/5': isLoading,
            'border-amber-500/30 bg-amber-500/5': isConnected && !isSpeaking,
            'border-emerald-500/30 bg-emerald-500/5': isSpeaking,
            'border-red-500/30 bg-red-500/5': error,
          }
        )}
      >
        <div className="flex items-center gap-3">
          {/* Status indicator */}
          <div className="relative">
            <div
              className={cn('w-2 h-2 rounded-full', {
                'bg-zinc-600': !isConnected && !error && !isLoading,
                'bg-amber-400': isLoading || (isConnected && !isSpeaking),
                'bg-emerald-400': isSpeaking,
                'bg-red-400': error,
              })}
            />
            {(isLoading || isSpeaking) && (
              <div
                className={cn('absolute inset-0 w-2 h-2 rounded-full animate-ping', {
                  'bg-amber-400': isLoading,
                  'bg-emerald-400': isSpeaking,
                })}
              />
            )}
          </div>

          {/* Status text */}
          <span
            className={cn('text-sm font-medium', {
              'text-zinc-500': !isConnected && !error && !isLoading,
              'text-amber-400/90': isLoading,
              'text-zinc-300': isConnected && !isSpeaking,
              'text-emerald-400/90': isSpeaking,
              'text-red-400/90': error,
            })}
          >
            {error
              ? 'Connection Error'
              : isLoading
                ? 'Establishing connection...'
                : isSpeaking
                  ? 'AI is responding'
                  : isConnected
                    ? 'Connected - Listening'
                    : 'Disconnected'}
          </span>
        </div>

        {/* Connection icon */}
        <div className="flex items-center gap-2">
          {error ? (
            <AlertCircle className="w-4 h-4 text-red-400" />
          ) : isConnected ? (
            <Wifi className="w-4 h-4 text-amber-400/70" />
          ) : (
            <WifiOff className="w-4 h-4 text-zinc-600" />
          )}
        </div>
      </motion.div>

      {/* Error details */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-3 rounded-lg bg-red-500/5 border border-red-500/20 text-sm text-red-300/80"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Conversation messages */}
      {showMessages && messages.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between px-1">
            <span className="font-mono text-xs text-zinc-600 uppercase tracking-wider">
              Conversation
            </span>
            <span className="font-mono text-xs text-zinc-700">
              {messages.length} {messages.length === 1 ? 'message' : 'messages'}
            </span>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-2 pr-2" role="log" aria-live="polite">
            <AnimatePresence mode="popLayout">
              {messages.slice(-6).map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: message.role === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={cn('flex', {
                    'justify-end': message.role === 'user',
                    'justify-start': message.role !== 'user',
                  })}
                >
                  <div
                    className={cn('max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed', {
                      'bg-amber-500/10 border border-amber-500/20 text-zinc-200 rounded-br-md':
                        message.role === 'user',
                      'bg-zinc-800/50 border border-zinc-700/50 text-zinc-300 rounded-bl-md':
                        message.role !== 'user',
                    })}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={cn('font-mono text-[10px] uppercase tracking-wider', {
                          'text-amber-400/70': message.role === 'user',
                          'text-zinc-500': message.role !== 'user',
                        })}
                      >
                        {message.role === 'user' ? 'You' : 'AI'}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Speaking animation indicator */}
      <AnimatePresence>
        {isSpeaking && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20"
          >
            {/* Sound wave animation */}
            <div className="flex items-center gap-0.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="w-0.5 bg-emerald-400/60 rounded-full"
                  animate={{
                    height: [8, 16 + i * 4, 8],
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: i * 0.1,
                  }}
                />
              ))}
            </div>
            <span className="text-sm text-emerald-400/80 font-medium">Speaking...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
