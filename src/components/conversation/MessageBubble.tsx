import { useState, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Copy, Check, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FunctionCallIndicator } from '@/components/voice/FunctionCallIndicator';
import type { VoiceMessage } from '@/types';

interface MessageBubbleProps {
  message: VoiceMessage;
  className?: string;
}

/**
 * Individual message display with role-based styling and copy functionality
 */
export function MessageBubble({ message, className }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const isUser = message.role === 'user';
  const isFunction = message.role === 'function';

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  }, [message.content]);

  const variants = {
    hidden: { opacity: 0, y: 10, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1 },
  };

  // Function call message styling
  if (isFunction && message.functionCall) {
    return (
      <motion.div
        data-testid="message-bubble-function"
        className={cn('group flex w-full justify-center', className)}
        initial={shouldReduceMotion ? 'visible' : 'hidden'}
        animate="visible"
        variants={variants}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <div
          className={cn(
            'relative max-w-[90%] rounded-xl px-4 py-3',
            'bg-purple-500/10 backdrop-blur-lg shadow-lg',
            'border border-purple-500/20'
          )}
        >
          {/* Function indicator */}
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-purple-400" aria-hidden="true" />
            <span className="text-xs font-medium text-purple-300">Function Call</span>
          </div>

          {/* Function status indicator */}
          <FunctionCallIndicator functionCall={message.functionCall} className="mb-2" />

          {/* Result content */}
          {message.content && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words text-white/80">
              {message.content}
            </p>
          )}

          <button
            onClick={handleCopy}
            className={cn(
              'absolute -right-2 -top-2 p-1.5 rounded-full',
              'bg-white/10 backdrop-blur-sm',
              'opacity-0 group-hover:opacity-100 transition-opacity',
              'hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30',
              'touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center'
            )}
            aria-label={copied ? 'Copied!' : 'Copy message'}
            type="button"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-400" aria-hidden="true" />
            ) : (
              <Copy className="w-4 h-4 text-white/70" aria-hidden="true" />
            )}
          </button>
        </div>
      </motion.div>
    );
  }

  // Regular user/assistant message styling
  return (
    <motion.div
      data-testid={`message-bubble-${message.role}`}
      className={cn('group flex w-full', isUser ? 'justify-end' : 'justify-start', className)}
      initial={shouldReduceMotion ? 'visible' : 'hidden'}
      animate="visible"
      variants={variants}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <div
        className={cn(
          'relative max-w-[85%] rounded-2xl px-4 py-3',
          'backdrop-blur-lg shadow-lg',
          isUser ? 'bg-blue-500/20 text-white ml-4' : 'bg-white/10 text-white/90 mr-4'
        )}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>

        <button
          onClick={handleCopy}
          className={cn(
            'absolute -right-2 -top-2 p-1.5 rounded-full',
            'bg-white/10 backdrop-blur-sm',
            'opacity-0 group-hover:opacity-100 transition-opacity',
            'hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30',
            'touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center'
          )}
          aria-label={copied ? 'Copied!' : 'Copy message'}
          type="button"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-400" aria-hidden="true" />
          ) : (
            <Copy className="w-4 h-4 text-white/70" aria-hidden="true" />
          )}
        </button>
      </div>
    </motion.div>
  );
}
