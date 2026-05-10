import { useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MicOff,
  Loader2,
  Mic,
  AlertCircle,
  Wifi,
  WifiOff,
  Clock,
  AlertTriangle,
  ChevronDown,
  Check,
  Square,
} from 'lucide-react';
import { useGeminiVoice } from '@/hooks/useGeminiVoice';
import { GeminiVoiceProvider } from '@/contexts/GeminiVoiceContext';
import { GEMINI_VOICES, type GeminiVoice } from '@/lib/gemini/config';
import { GEMINI_SESSION_TIMERS } from '@/types/gemini';
import { cn } from '@/lib/utils';
import * as SelectPrimitive from '@radix-ui/react-select';
import type { ReactNode } from 'react';

/**
 * Check if Gemini is configured (frontend-only check)
 * Returns true if VITE_GEMINI_ENABLED is set to 'true'
 */
// eslint-disable-next-line react-refresh/only-export-components
export function checkGeminiConfiguration(): boolean {
  const enabled = import.meta.env.VITE_GEMINI_ENABLED;
  return enabled === 'true' || enabled === true;
}

/**
 * Hook to check Gemini configuration status
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useGeminiConfigured(): { isConfigured: boolean; isChecking: boolean } {
  const isConfigured = checkGeminiConfiguration();
  return { isConfigured, isChecking: false };
}

interface GeminiProviderProps {
  children?: ReactNode;
  onDisconnect?: () => void;
  /** Ref to expose disconnect function for external control (e.g., provider switching) */
  disconnectRef?: React.MutableRefObject<(() => Promise<void>) | null>;
}

/**
 * Inner component that handles disconnect callback
 * Must be inside GeminiVoiceProvider to use the hook
 */
function GeminiProviderInner({
  children,
  onDisconnect,
  disconnectRef: externalDisconnectRef,
}: GeminiProviderProps) {
  const { disconnect, status } = useGeminiVoice();
  const wasConnectedRef = useRef(false);
  const internalDisconnectRef = useRef(disconnect);

  // Keep internal ref in sync (for stable cleanup reference)
  useEffect(() => {
    internalDisconnectRef.current = disconnect;
  }, [disconnect]);

  // Expose disconnect to parent via external ref (for provider switching)
  useEffect(() => {
    if (externalDisconnectRef) {
      externalDisconnectRef.current = disconnect;
    }
    return () => {
      if (externalDisconnectRef) {
        externalDisconnectRef.current = null;
      }
    };
  }, [disconnect, externalDisconnectRef]);

  // Handle disconnect callback when connection ends
  useEffect(() => {
    const isConnected =
      status === 'connected' ||
      status === 'listening' ||
      status === 'speaking' ||
      status === 'thinking';

    if (isConnected) {
      wasConnectedRef.current = true;
    } else if (wasConnectedRef.current && status === 'idle') {
      wasConnectedRef.current = false;
      onDisconnect?.();
    }
  }, [status, onDisconnect]);

  // Cleanup on unmount - use ref to avoid dependency on disconnect
  useEffect(() => {
    return () => {
      internalDisconnectRef.current();
    };
  }, []);

  return <>{children}</>;
}

/**
 * Gemini Voice Provider wrapper component
 * Wraps children with GeminiVoiceProvider context to ensure single client instance
 */
export function GeminiProvider({ children, onDisconnect, disconnectRef }: GeminiProviderProps) {
  return (
    <GeminiVoiceProvider onDisconnect={onDisconnect}>
      <GeminiProviderInner onDisconnect={onDisconnect} disconnectRef={disconnectRef}>
        {children}
      </GeminiProviderInner>
    </GeminiVoiceProvider>
  );
}

interface GeminiButtonProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  onConnect?: () => void;
  onDisconnect?: () => void;
}

/**
 * Voice button for Gemini provider
 * Features color state transitions and audio-level glow visualization
 * Uses emerald/green color scheme (HSL 160) to distinguish from other providers
 */
export function GeminiButton({
  className,
  size = 'lg',
  onConnect,
  // onDisconnect is handled by GeminiProviderInner to avoid duplicate callbacks
}: GeminiButtonProps) {
  const { status, isSpeaking, isListening, isThinking, connect, disconnect, error } =
    useGeminiVoice();
  const buttonRef = useRef<HTMLButtonElement>(null);

  const isConnected =
    status === 'connected' ||
    status === 'listening' ||
    status === 'speaking' ||
    status === 'thinking';
  const isLoading = status === 'connecting';

  const sizeConfig = {
    sm: { button: 'w-16 h-16', icon: 18, rings: [24, 32] },
    md: { button: 'w-24 h-24', icon: 24, rings: [36, 48] },
    lg: { button: 'w-32 h-32', icon: 32, rings: [48, 64, 80] },
  };

  const config = sizeConfig[size];

  const handleClick = useCallback(async () => {
    if (isLoading) return;

    if (isConnected) {
      await disconnect();
      // Note: onDisconnect is handled by GeminiProviderInner to avoid duplicate callbacks
    } else {
      await connect();
      onConnect?.();
    }
  }, [isLoading, isConnected, connect, disconnect, onConnect]);

  useEffect(() => {
    if (error && buttonRef.current) {
      buttonRef.current.focus();
    }
  }, [error]);

  const getState = () => {
    if (isLoading) return 'loading';
    if (isSpeaking) return 'speaking';
    if (isThinking) return 'thinking';
    if (isListening) return 'listening';
    if (isConnected) return 'connected';
    if (error) return 'error';
    return 'idle';
  };

  const state = getState();

  const getAriaLabel = () => {
    switch (state) {
      case 'loading':
        return 'Connecting to Gemini...';
      case 'speaking':
        return 'Gemini is speaking. Click to end call.';
      case 'thinking':
        return 'Gemini is thinking. Click to end call.';
      case 'listening':
        return 'Gemini is listening. Click to end call.';
      case 'connected':
        return 'Connected to Gemini. Click to end call.';
      case 'error':
        return `Error: ${error}. Click to retry.`;
      default:
        return 'Start Gemini voice conversation';
    }
  };

  // Calculate glow intensity based on speaking/listening state
  const glowIntensity = useMemo(() => {
    if (!isConnected) return 0;
    if (isSpeaking) return 0.9;
    if (isThinking) return 0.6;
    if (isListening) return 0.5;
    return 0.3;
  }, [isConnected, isSpeaking, isThinking, isListening]);

  // Emerald color scheme (HSL 160)
  const glowColor = isSpeaking
    ? `hsla(160, 70%, 45%, ${0.2 + glowIntensity * 0.4})`
    : isThinking
      ? `hsla(160, 60%, 40%, ${0.15 + glowIntensity * 0.3})`
      : `hsla(160, 50%, 35%, ${0.1 + glowIntensity * 0.2})`;

  const glowSpread = 10 + glowIntensity * 30;

  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      {/* Outer glow ring */}
      <AnimatePresence>
        {(isConnected || isLoading) && (
          <motion.div
            className="absolute rounded-full"
            style={{
              width: config.rings[config.rings.length - 1] * 3,
              height: config.rings[config.rings.length - 1] * 3,
              background: `radial-gradient(circle at center, ${
                state === 'speaking'
                  ? 'hsla(160, 70%, 45%, 0.15)'
                  : state === 'thinking'
                    ? 'hsla(160, 60%, 40%, 0.12)'
                    : state === 'listening'
                      ? 'hsla(160, 50%, 38%, 0.1)'
                      : state === 'loading'
                        ? 'hsla(45, 80%, 50%, 0.1)'
                        : 'hsla(160, 50%, 35%, 0.08)'
              } 0%, transparent 70%)`,
            }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: state === 'speaking' ? [0.6, 1, 0.6] : [0.4, 0.6, 0.4],
            }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{
              duration: state === 'speaking' ? 1.5 : state === 'thinking' ? 2 : 3,
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
            borderColor: isConnected
              ? `hsla(160, 70%, 45%, ${0.15 - index * 0.03})`
              : state === 'loading'
                ? `hsla(45, 80%, 50%, ${0.1 - index * 0.02})`
                : `hsla(0, 0%, 100%, ${0.06 - index * 0.01})`,
          }}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{
            scale: state === 'speaking' || state === 'thinking' ? [1, 1.05, 1] : 1,
            opacity: 1,
          }}
          transition={{
            scale: {
              duration: state === 'speaking' ? 1.5 : 2,
              repeat: state === 'speaking' || state === 'thinking' ? Infinity : 0,
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

      {/* Thinking indicator rings */}
      <AnimatePresence>
        {isThinking && (
          <>
            {[0, 1].map((i) => (
              <motion.div
                key={`think-${i}`}
                className="absolute rounded-full border border-emerald-400/30"
                style={{
                  width: config.rings[config.rings.length - 1] * 1.8,
                  height: config.rings[config.rings.length - 1] * 1.8,
                }}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{
                  scale: [0.9, 1.1, 0.9],
                  opacity: [0.3, 0.6, 0.3],
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 1.2,
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
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-4 focus-visible:ring-offset-zinc-900',
          'disabled:cursor-not-allowed',
          {
            'bg-zinc-900 border border-zinc-700/50 hover:border-zinc-600': state === 'idle',
            'bg-zinc-900 border border-amber-500/30': state === 'loading',
            'bg-zinc-900 border border-emerald-500/50':
              state === 'connected' ||
              state === 'speaking' ||
              state === 'listening' ||
              state === 'thinking',
            'bg-zinc-900 border border-red-500/50': state === 'error',
          }
        )}
        style={{
          boxShadow: isConnected ? `0 0 ${glowSpread}px -5px ${glowColor}` : undefined,
        }}
        whileHover={{ scale: isLoading ? 1 : 1.02 }}
        whileTap={{ scale: isLoading ? 1 : 0.98 }}
        aria-label={getAriaLabel()}
        aria-pressed={isConnected}
        role="button"
        data-testid="voice-button"
        data-state={state}
      >
        {/* Inner gradient */}
        <div
          className="absolute inset-1 rounded-full"
          style={{
            background:
              state === 'speaking'
                ? 'radial-gradient(circle at 30% 30%, hsla(160, 70%, 45%, 0.1) 0%, transparent 60%)'
                : state === 'thinking'
                  ? 'radial-gradient(circle at 30% 30%, hsla(160, 60%, 40%, 0.08) 0%, transparent 60%)'
                  : isConnected
                    ? 'radial-gradient(circle at 30% 30%, hsla(160, 50%, 35%, 0.06) 0%, transparent 60%)'
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
              <Square
                size={config.icon}
                className="text-emerald-400 transition-colors duration-300"
                fill="currentColor"
              />
              <motion.div
                data-testid="voice-button-active-indicator"
                className={cn(
                  'absolute -top-1 -right-1 w-3 h-3 rounded-full',
                  isSpeaking ? 'bg-emerald-400' : isThinking ? 'bg-amber-400' : 'bg-emerald-500'
                )}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.8, 1, 0.8],
                }}
                transition={{
                  duration: isThinking ? 1 : 1.5,
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
        data-testid="voice-button-status"
      >
        <span
          className={cn('font-mono text-xs tracking-wide uppercase', {
            'text-zinc-500': state === 'idle',
            'text-amber-400/80': state === 'loading' || state === 'thinking',
            'text-emerald-400':
              state === 'connected' || state === 'speaking' || state === 'listening',
            'text-red-400': state === 'error',
          })}
        >
          {state === 'idle' && 'Ready'}
          {state === 'loading' && 'Connecting'}
          {state === 'connected' && 'Live'}
          {state === 'listening' && 'Listening'}
          {state === 'thinking' && 'Thinking'}
          {state === 'speaking' && 'Speaking'}
          {state === 'error' && 'Error'}
        </span>
      </motion.div>
    </div>
  );
}

interface GeminiVoiceStatusProps {
  className?: string;
}

/**
 * Format seconds as MM:SS
 */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Voice status display for Gemini provider
 * Includes connection status bar and session timer with warnings
 */
export function GeminiVoiceStatus({ className }: GeminiVoiceStatusProps) {
  const { status, isSpeaking, isListening, isThinking, error, sessionDuration, sessionWarning } =
    useGeminiVoice();

  const isConnected =
    status === 'connected' ||
    status === 'listening' ||
    status === 'speaking' ||
    status === 'thinking';
  const isLoading = status === 'connecting';

  const getStatusText = () => {
    if (error) return 'Connection Error';
    if (isLoading) return 'Connecting to Gemini...';
    if (isSpeaking) return 'Gemini is speaking';
    if (isThinking) return 'Gemini is thinking...';
    if (isListening) return 'Listening - speak now';
    if (isConnected) return 'Connected - Ready';
    return 'Disconnected';
  };

  // Determine session timer color based on warning level
  const getTimerColor = () => {
    if (sessionWarning === 'urgent') return 'text-red-400';
    if (sessionWarning === 'warning') return 'text-amber-400';
    return 'text-zinc-400';
  };

  const getTimerBgColor = () => {
    if (sessionWarning === 'urgent') return 'bg-red-500/10 border-red-500/30';
    if (sessionWarning === 'warning') return 'bg-amber-500/10 border-amber-500/30';
    return 'bg-zinc-800/50 border-zinc-700/50';
  };

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
            'border-amber-500/20 bg-amber-500/5': isLoading || isThinking,
            'border-emerald-500/30 bg-emerald-500/5': isConnected && !isThinking,
            'border-red-500/30 bg-red-500/5': error,
          }
        )}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className={cn('w-2 h-2 rounded-full', {
                'bg-zinc-600': !isConnected && !error && !isLoading,
                'bg-amber-400': isLoading || isThinking,
                'bg-emerald-400': isConnected && !isThinking,
                'bg-red-400': error,
              })}
            />
            {(isLoading || isSpeaking || isThinking) && (
              <div
                className={cn('absolute inset-0 w-2 h-2 rounded-full animate-ping', {
                  'bg-amber-400': isLoading || isThinking,
                  'bg-emerald-400': isSpeaking,
                })}
              />
            )}
          </div>

          <span
            className={cn('text-sm font-medium', {
              'text-zinc-500': !isConnected && !error && !isLoading,
              'text-amber-400/90': isLoading || isThinking,
              'text-zinc-300': isConnected && !isThinking && !isSpeaking,
              'text-emerald-400/90': isSpeaking || isListening,
              'text-red-400/90': error,
            })}
          >
            {getStatusText()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {error ? (
            <AlertCircle className="w-4 h-4 text-red-400" />
          ) : isConnected ? (
            <Wifi className="w-4 h-4 text-emerald-400/70" />
          ) : (
            <WifiOff className="w-4 h-4 text-zinc-600" />
          )}
        </div>
      </motion.div>

      {/* Session Timer */}
      <AnimatePresence>
        {isConnected && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={cn(
              'flex items-center justify-between px-4 py-3 rounded-lg border',
              getTimerBgColor()
            )}
          >
            <div className="flex items-center gap-2">
              {sessionWarning === 'urgent' ? (
                <AlertTriangle className="w-4 h-4 text-red-400" />
              ) : sessionWarning === 'warning' ? (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              ) : (
                <Clock className="w-4 h-4 text-zinc-500" />
              )}
              <span className="text-sm text-zinc-400">Session Duration</span>
            </div>

            <div className="flex items-center gap-2">
              <span className={cn('font-mono text-sm', getTimerColor())}>
                {formatDuration(sessionDuration)}
              </span>
              <span className="text-xs text-zinc-600">
                / {formatDuration(GEMINI_SESSION_TIMERS.DISCONNECT_SECONDS)}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session Warning Messages */}
      <AnimatePresence>
        {sessionWarning === 'urgent' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30"
            role="alert"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span className="text-sm text-red-300">
                Session ending soon. Conversation will disconnect at 15 minutes.
              </span>
            </div>
          </motion.div>
        )}
        {sessionWarning === 'warning' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/30"
            role="alert"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span className="text-sm text-amber-300">
                Session has been active for over 12 minutes.
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error details */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-3 rounded-lg bg-red-500/5 border border-red-500/20 text-sm text-red-300/80"
            role="alert"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Speaking animation */}
      <AnimatePresence>
        {isSpeaking && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20"
          >
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

      {/* Thinking animation */}
      <AnimatePresence>
        {isThinking && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-amber-500/5 border border-amber-500/20"
          >
            <div className="flex items-center gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-amber-400/60 rounded-full"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: i * 0.3,
                  }}
                />
              ))}
            </div>
            <span className="text-sm text-amber-400/80 font-medium">Thinking...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface GeminiVoiceSelectorProps {
  className?: string;
}

/**
 * Group voices by style for better UX with 30 options
 */
function groupVoicesByStyle(voices: GeminiVoice[]): Record<string, GeminiVoice[]> {
  return voices.reduce(
    (acc, voice) => {
      const style = voice.style;
      if (!acc[style]) {
        acc[style] = [];
      }
      acc[style].push(voice);
      return acc;
    },
    {} as Record<string, GeminiVoice[]>
  );
}

const styleLabels: Record<string, string> = {
  calm: 'Calm',
  warm: 'Warm',
  bright: 'Bright',
  neutral: 'Neutral',
  energetic: 'Energetic',
};

const styleOrder = ['neutral', 'warm', 'calm', 'bright', 'energetic'];

/**
 * Voice selector dropdown with all 30 Gemini HD voices
 * Groups voices by style for easier navigation
 */
export function GeminiVoiceSelector({ className }: GeminiVoiceSelectorProps) {
  const { selectedVoice, setVoice, isConnected } = useGeminiVoice();

  const groupedVoices = useMemo(() => groupVoicesByStyle(GEMINI_VOICES), []);

  const currentVoice = GEMINI_VOICES.find((v) => v.id === selectedVoice);

  return (
    <div className={cn('w-full', className)}>
      <label className="block text-sm text-zinc-400 mb-2">Voice</label>
      <SelectPrimitive.Root value={selectedVoice} onValueChange={setVoice} disabled={isConnected}>
        <SelectPrimitive.Trigger
          className={cn(
            'flex items-center justify-between w-full px-4 py-3 rounded-lg',
            'bg-zinc-900/50 border border-zinc-700/50',
            'text-sm text-zinc-200',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-all duration-200',
            'hover:border-zinc-600'
          )}
          aria-label="Select voice"
          data-testid="voice-selector"
        >
          <div className="flex items-center gap-2">
            <span>{currentVoice?.name || 'Select voice'}</span>
            {currentVoice && (
              <span className="text-xs text-zinc-500 capitalize">({currentVoice.style})</span>
            )}
          </div>
          <SelectPrimitive.Icon>
            <ChevronDown className="w-4 h-4 text-zinc-500" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            className={cn(
              'z-50 min-w-[280px] max-h-[400px] overflow-hidden',
              'bg-zinc-900 border border-zinc-700/50 rounded-lg shadow-xl',
              'backdrop-blur-xl'
            )}
            position="popper"
            sideOffset={5}
          >
            <SelectPrimitive.Viewport className="p-2">
              {styleOrder.map((style) => {
                const voices = groupedVoices[style];
                if (!voices || voices.length === 0) return null;

                return (
                  <SelectPrimitive.Group key={style}>
                    <SelectPrimitive.Label className="px-3 py-2 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                      {styleLabels[style]}
                    </SelectPrimitive.Label>
                    {voices.map((voice) => (
                      <SelectPrimitive.Item
                        key={voice.id}
                        value={voice.id}
                        className={cn(
                          'relative flex items-center justify-between px-3 py-2 rounded-md',
                          'text-sm text-zinc-300 cursor-pointer',
                          'outline-none',
                          'data-[highlighted]:bg-emerald-500/10 data-[highlighted]:text-emerald-400',
                          'data-[state=checked]:text-emerald-400',
                          'transition-colors duration-150'
                        )}
                      >
                        <SelectPrimitive.ItemText>{voice.name}</SelectPrimitive.ItemText>
                        <SelectPrimitive.ItemIndicator>
                          <Check className="w-4 h-4 text-emerald-400" />
                        </SelectPrimitive.ItemIndicator>
                      </SelectPrimitive.Item>
                    ))}
                  </SelectPrimitive.Group>
                );
              })}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>

      {isConnected && (
        <p className="mt-2 text-xs text-zinc-500">
          Voice selection is disabled during active conversation
        </p>
      )}
    </div>
  );
}

export default GeminiProvider;
