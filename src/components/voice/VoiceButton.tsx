import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Loader2, Phone } from 'lucide-react';
import { useVoice } from '@/contexts/VoiceContext';
import { cn } from '@/lib/utils';

interface VoiceButtonProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function VoiceButton({ className, size = 'lg', onConnect, onDisconnect }: VoiceButtonProps) {
  const { isConnected, isLoading, isSpeaking, connect, disconnect, error } = useVoice();
  const buttonRef = useRef<HTMLButtonElement>(null);

  const sizeConfig = {
    sm: { button: 'w-16 h-16', icon: 18, rings: [24, 32] },
    md: { button: 'w-24 h-24', icon: 24, rings: [36, 48] },
    lg: { button: 'w-32 h-32', icon: 32, rings: [48, 64, 80] },
  };

  const config = sizeConfig[size];

  const handleClick = async () => {
    if (isLoading) return;

    if (isConnected) {
      await disconnect();
      onDisconnect?.();
    } else {
      const agentId = import.meta.env.VITE_ELEVENLABS_AGENT_ID;
      if (!agentId || agentId === 'your_agent_id_here') {
        return;
      }
      await connect(agentId);
      onConnect?.();
    }
  };

  useEffect(() => {
    if (error && buttonRef.current) {
      buttonRef.current.focus();
    }
  }, [error]);

  const getState = () => {
    if (isLoading) return 'loading';
    if (isConnected && isSpeaking) return 'speaking';
    if (isConnected) return 'connected';
    if (error) return 'error';
    return 'idle';
  };

  const state = getState();

  const getAriaLabel = () => {
    switch (state) {
      case 'loading':
        return 'Connecting to voice agent...';
      case 'speaking':
        return 'Voice agent is speaking. Click to end call.';
      case 'connected':
        return 'Connected to voice agent. Click to end call.';
      case 'error':
        return `Error: ${error}. Click to retry.`;
      default:
        return 'Start voice conversation';
    }
  };

  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      {/* Outer glow ring - breathing animation when active */}
      <AnimatePresence>
        {(isConnected || isLoading) && (
          <motion.div
            className="absolute rounded-full"
            style={{
              width: config.rings[config.rings.length - 1] * 3,
              height: config.rings[config.rings.length - 1] * 3,
              background: `radial-gradient(circle at center, ${
                state === 'speaking'
                  ? 'hsla(142, 71%, 45%, 0.15)'
                  : state === 'loading'
                    ? 'hsla(43, 96%, 56%, 0.1)'
                    : 'hsla(43, 96%, 56%, 0.08)'
              } 0%, transparent 70%)`,
            }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: state === 'speaking' ? [0.6, 1, 0.6] : [0.4, 0.6, 0.4],
            }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{
              duration: state === 'speaking' ? 1.5 : 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
      </AnimatePresence>

      {/* Concentric rings */}
      {config.rings.map((ringSize, index) => (
        <motion.div
          key={ringSize}
          className="absolute rounded-full border"
          style={{
            width: ringSize * 2,
            height: ringSize * 2,
            borderColor:
              state === 'connected' || state === 'speaking'
                ? `hsla(43, 96%, 56%, ${0.15 - index * 0.03})`
                : state === 'loading'
                  ? `hsla(43, 96%, 56%, ${0.1 - index * 0.02})`
                  : `hsla(0, 0%, 100%, ${0.06 - index * 0.01})`,
          }}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{
            scale: state === 'speaking' ? [1, 1.05, 1] : 1,
            opacity: 1,
          }}
          transition={{
            scale: {
              duration: 1.5,
              repeat: state === 'speaking' ? Infinity : 0,
              ease: 'easeInOut',
              delay: index * 0.1,
            },
            opacity: { duration: 0.4, delay: index * 0.1 },
          }}
        />
      ))}

      {/* Pulse rings when speaking */}
      <AnimatePresence>
        {isSpeaking && (
          <>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={`pulse-${i}`}
                className="absolute rounded-full border-2 border-emerald-400/40"
                style={{
                  width: config.rings[config.rings.length - 1] * 2,
                  height: config.rings[config.rings.length - 1] * 2,
                }}
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: 2, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeOut',
                  delay: i * 0.6,
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Main button */}
      <motion.button
        ref={buttonRef}
        onClick={handleClick}
        disabled={isLoading}
        className={cn(
          config.button,
          'relative z-10 rounded-full',
          'flex items-center justify-center',
          'transition-all duration-300',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:ring-offset-4 focus-visible:ring-offset-zinc-900',
          'disabled:cursor-not-allowed',
          {
            'bg-zinc-900 border border-zinc-700/50 hover:border-zinc-600': state === 'idle',
            'bg-zinc-900 border border-amber-500/30': state === 'loading',
            'bg-zinc-900 border border-amber-500/50 shadow-[0_0_30px_-5px_hsla(43,96%,56%,0.3)]':
              state === 'connected',
            'bg-zinc-900 border border-emerald-500/50 shadow-[0_0_30px_-5px_hsla(142,71%,45%,0.4)]':
              state === 'speaking',
            'bg-zinc-900 border border-red-500/50': state === 'error',
          }
        )}
        whileHover={{ scale: isLoading ? 1 : 1.02 }}
        whileTap={{ scale: isLoading ? 1 : 0.98 }}
        aria-label={getAriaLabel()}
        aria-pressed={isConnected}
        role="button"
      >
        {/* Inner gradient */}
        <div
          className="absolute inset-1 rounded-full"
          style={{
            background:
              state === 'speaking'
                ? 'radial-gradient(circle at 30% 30%, hsla(142, 71%, 45%, 0.1) 0%, transparent 60%)'
                : state === 'connected'
                  ? 'radial-gradient(circle at 30% 30%, hsla(43, 96%, 56%, 0.08) 0%, transparent 60%)'
                  : 'radial-gradient(circle at 30% 30%, hsla(0, 0%, 100%, 0.04) 0%, transparent 60%)',
          }}
        />

        {/* Icon */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Loader2 size={config.icon} className="text-amber-400 animate-spin" />
            </motion.div>
          ) : isConnected ? (
            <motion.div
              key="connected"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative"
            >
              <Phone
                size={config.icon}
                className={cn(
                  'transition-colors duration-300',
                  isSpeaking ? 'text-emerald-400' : 'text-amber-400'
                )}
              />
              {/* Active indicator dot */}
              <motion.div
                className={cn(
                  'absolute -top-1 -right-1 w-3 h-3 rounded-full',
                  isSpeaking ? 'bg-emerald-500' : 'bg-amber-500'
                )}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.8, 1, 0.8],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              {error ? (
                <MicOff size={config.icon} className="text-red-400" />
              ) : (
                <Mic size={config.icon} className="text-zinc-400" />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Status label */}
      <motion.div
        className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap"
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <span
          className={cn('font-mono text-xs tracking-wide uppercase', {
            'text-zinc-500': state === 'idle',
            'text-amber-400/80': state === 'loading',
            'text-amber-400': state === 'connected',
            'text-emerald-400': state === 'speaking',
            'text-red-400': state === 'error',
          })}
        >
          {state === 'idle' && 'Ready'}
          {state === 'loading' && 'Connecting'}
          {state === 'connected' && 'Live'}
          {state === 'speaking' && 'Speaking'}
          {state === 'error' && 'Error'}
        </span>
      </motion.div>
    </div>
  );
}
