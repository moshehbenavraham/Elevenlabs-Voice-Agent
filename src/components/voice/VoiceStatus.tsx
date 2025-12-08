import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Clock, Wifi, WifiOff } from 'lucide-react';
import { useVoice } from '@/contexts/VoiceContext';
import { cn } from '@/lib/utils';

interface VoiceStatusProps {
  className?: string;
  showMessages?: boolean;
}

export function VoiceStatus({ className, showMessages = true }: VoiceStatusProps) {
  const { isConnected, isLoading, isSpeaking, error, messages } = useVoice();

  const getStatusIcon = () => {
    if (error) return <AlertCircle className="w-5 h-5 text-red-400" />;
    if (isLoading) return <Clock className="w-5 h-5 text-yellow-400 animate-pulse" />;
    if (isConnected) return <CheckCircle className="w-5 h-5 text-green-400" />;
    return <WifiOff className="w-5 h-5 text-gray-400" />;
  };

  const getStatusText = () => {
    if (error) return `Error: ${error}`;
    if (isLoading) return 'Connecting...';
    if (isConnected && isSpeaking) return 'AI is speaking';
    if (isConnected) return 'Connected - Ready to chat';
    return 'Not connected';
  };

  const getStatusColor = () => {
    if (error) return 'border-red-500/30 bg-red-500/10';
    if (isLoading) return 'border-yellow-500/30 bg-yellow-500/10';
    if (isConnected) return 'border-green-500/30 bg-green-500/10';
    return 'border-gray-500/30 bg-gray-500/10';
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Status Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-sm',
          'transition-all duration-200',
          getStatusColor()
        )}
      >
        {getStatusIcon()}
        <span className="text-sm text-white/90 font-medium">{getStatusText()}</span>

        {/* Connection indicator */}
        <div className="ml-auto">
          {isConnected ? (
            <Wifi className="w-4 h-4 text-green-400" />
          ) : (
            <WifiOff className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </motion.div>

      {/* Messages */}
      {showMessages && messages.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-3"
        >
          <h3 className="text-sm font-medium text-white/70 px-1">Conversation</h3>

          <div className="max-h-40 overflow-y-auto space-y-2" role="log" aria-live="polite">
            <AnimatePresence mode="popLayout">
              {messages.slice(-5).map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: message.role === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={cn(
                    'p-3 rounded-lg text-sm backdrop-blur-sm',
                    message.role === 'user'
                      ? 'bg-purple-500/20 border border-purple-500/30 ml-6'
                      : 'bg-blue-500/20 border border-blue-500/30 mr-6'
                  )}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={cn(
                        'text-xs font-medium px-2 py-1 rounded-full',
                        message.role === 'user'
                          ? 'bg-purple-500/30 text-purple-200'
                          : 'bg-blue-500/30 text-blue-200'
                      )}
                    >
                      {message.role === 'user' ? 'You' : 'AI'}
                    </span>
                    <p className="text-white/90 leading-relaxed">{message.content}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Speaking Indicator */}
      <AnimatePresence>
        {isSpeaking && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/30"
          >
            <div className="flex space-x-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-green-400 rounded-full"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
            <span className="text-sm text-green-200">AI is speaking...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
