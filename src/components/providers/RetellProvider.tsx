import { useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MicOff, Loader2, Phone, AlertCircle, Wifi, WifiOff, Settings, Square } from 'lucide-react';
import { useRetellVoice } from '@/hooks/useRetellVoice';
import { RetellVoiceProvider } from '@/contexts/RetellVoiceContext';
import { RetellCallStatus } from '@/types/retell';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

/**
 * Check if Retell is configured (frontend-only check)
 * Returns true if VITE_RETELL_AGENT_ID is set
 */
// eslint-disable-next-line react-refresh/only-export-components
export function checkRetellConfiguration(): boolean {
  const agentId = import.meta.env.VITE_RETELL_AGENT_ID;
  return !!agentId && agentId !== 'your-retell-agent-id';
}

/**
 * Hook to check Retell configuration status
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useRetellConfigured(): { isConfigured: boolean; isChecking: boolean } {
  // Synchronous frontend-only check - initialize directly
  const isConfigured = checkRetellConfiguration();
  return { isConfigured, isChecking: false };
}

interface RetellProviderProps {
  children?: ReactNode;
  onDisconnect?: () => void;
}

/**
 * Inner component that handles disconnect callback
 * Must be inside RetellVoiceProvider to use the hook
 */
function RetellProviderInner({ children, onDisconnect }: RetellProviderProps) {
  const { stopCall, callStatus } = useRetellVoice();
  const wasConnectedRef = useRef(false);

  // Handle disconnect callback when call ends
  useEffect(() => {
    if (callStatus === RetellCallStatus.CONNECTED) {
      wasConnectedRef.current = true;
    } else if (wasConnectedRef.current && callStatus === RetellCallStatus.IDLE) {
      wasConnectedRef.current = false;
      onDisconnect?.();
    }
  }, [callStatus, onDisconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCall();
    };
  }, [stopCall]);

  return <>{children}</>;
}

/**
 * Retell Voice Provider wrapper component
 * Wraps children with RetellVoiceProvider context to ensure single SDK instance
 */
export function RetellProvider({ children, onDisconnect }: RetellProviderProps) {
  return (
    <RetellVoiceProvider>
      <RetellProviderInner onDisconnect={onDisconnect}>{children}</RetellProviderInner>
    </RetellVoiceProvider>
  );
}

interface RetellButtonProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  onConnect?: () => void;
  onDisconnect?: () => void;
}

/**
 * Voice button for Retell provider
 * Features color state transitions and audio-level glow visualization
 * Uses teal/cyan color scheme to distinguish from Vapi's purple/violet
 */
export function RetellButton({
  className,
  size = 'lg',
  onConnect,
  onDisconnect,
}: RetellButtonProps) {
  const { callStatus, isAgentSpeaking, startCall, stopCall, error } = useRetellVoice();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const wasConnectedRef = useRef(false);

  const isConnected = callStatus === RetellCallStatus.CONNECTED;
  const isLoading = callStatus === RetellCallStatus.CONNECTING;

  const sizeConfig = {
    sm: { button: 'w-16 h-16', icon: 18, rings: [24, 32] },
    md: { button: 'w-24 h-24', icon: 24, rings: [36, 48] },
    lg: { button: 'w-32 h-32', icon: 32, rings: [48, 64, 80] },
  };

  const config = sizeConfig[size];

  const handleClick = async () => {
    if (isLoading) return;

    if (isConnected) {
      stopCall();
      onDisconnect?.();
    } else {
      await startCall();
      onConnect?.();
    }
  };

  // Track connection state for disconnect callback
  useEffect(() => {
    if (isConnected) {
      wasConnectedRef.current = true;
    } else if (wasConnectedRef.current && !isConnected && !isLoading) {
      wasConnectedRef.current = false;
      onDisconnect?.();
    }
  }, [isConnected, isLoading, onDisconnect]);

  useEffect(() => {
    if (error && buttonRef.current) {
      buttonRef.current.focus();
    }
  }, [error]);

  const getState = () => {
    if (isLoading) return 'loading';
    if (isConnected && isAgentSpeaking) return 'speaking';
    if (isConnected) return 'connected';
    if (error) return 'error';
    return 'idle';
  };

  const state = getState();

  const getAriaLabel = () => {
    switch (state) {
      case 'loading':
        return 'Connecting to Retell...';
      case 'speaking':
        return 'Retell agent is speaking. Click to end call.';
      case 'connected':
        return 'Connected to Retell. Click to end call.';
      case 'error':
        return `Error: ${error}. Click to retry.`;
      default:
        return 'Start Retell voice conversation';
    }
  };

  // Calculate glow intensity based on speaking state
  const glowIntensity = useMemo(() => {
    if (!isConnected) return 0;
    // Use speaking state for glow animation
    return isAgentSpeaking ? 0.8 : 0.4;
  }, [isConnected, isAgentSpeaking]);

  // Retell uses teal/cyan color scheme (hsl 180)
  const glowColor = isAgentSpeaking
    ? `hsla(180, 70%, 50%, ${0.2 + glowIntensity * 0.4})`
    : `hsla(175, 60%, 45%, ${0.15 + glowIntensity * 0.3})`;

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
                  ? 'hsla(180, 70%, 50%, 0.15)'
                  : state === 'loading'
                    ? 'hsla(175, 60%, 45%, 0.1)'
                    : 'hsla(175, 60%, 45%, 0.08)'
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
                ? `hsla(180, 70%, 50%, ${0.15 - index * 0.03})`
                : state === 'loading'
                  ? `hsla(175, 60%, 45%, ${0.1 - index * 0.02})`
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
        {isAgentSpeaking && (
          <>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={`pulse-${i}`}
                className="absolute rounded-full border-2 border-teal-400/40"
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
        data-testid="voice-button"
        data-state={state}
        className={cn(
          config.button,
          'relative z-10 rounded-full',
          'flex items-center justify-center',
          'transition-all duration-300',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 focus-visible:ring-offset-4 focus-visible:ring-offset-zinc-900',
          'disabled:cursor-not-allowed',
          {
            'bg-zinc-900 border border-zinc-700/50 hover:border-zinc-600': state === 'idle',
            'bg-zinc-900 border border-amber-500/30': state === 'loading',
            'bg-zinc-900 border border-teal-500/50': state === 'connected' || state === 'speaking',
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
        aria-busy={isLoading}
        role="button"
      >
        {/* Inner gradient */}
        <div
          className="absolute inset-1 rounded-full"
          style={{
            background:
              state === 'speaking'
                ? 'radial-gradient(circle at 30% 30%, hsla(180, 70%, 50%, 0.1) 0%, transparent 60%)'
                : state === 'connected'
                  ? 'radial-gradient(circle at 30% 30%, hsla(175, 60%, 45%, 0.08) 0%, transparent 60%)'
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
                className={cn(
                  'transition-colors duration-300',
                  isAgentSpeaking ? 'text-teal-400' : 'text-teal-400'
                )}
                fill="currentColor"
              />
              <motion.div
                data-testid="voice-button-active-indicator"
                className={cn(
                  'absolute -top-1 -right-1 w-3 h-3 rounded-full',
                  isAgentSpeaking ? 'bg-teal-500' : 'bg-teal-500'
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
                <Phone size={config.icon} className="text-zinc-400" />
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
          data-testid="voice-button-status"
          className={cn('font-mono text-xs tracking-wide uppercase', {
            'text-zinc-500': state === 'idle',
            'text-amber-400/80': state === 'loading',
            'text-teal-400': state === 'connected' || state === 'speaking',
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

interface RetellVoiceStatusProps {
  className?: string;
}

/**
 * Voice status display for Retell provider
 */
export function RetellVoiceStatus({ className }: RetellVoiceStatusProps) {
  const { callStatus, isAgentSpeaking, error } = useRetellVoice();

  const isConnected = callStatus === RetellCallStatus.CONNECTED;
  const isLoading = callStatus === RetellCallStatus.CONNECTING;

  const getStatusText = () => {
    if (error) return 'Connection Error';
    if (isLoading) return 'Connecting to Retell...';
    if (isAgentSpeaking) return 'Retell agent is responding';
    if (isConnected) return 'Connected - Ready';
    return 'Disconnected';
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
            'border-amber-500/20 bg-amber-500/5': isLoading,
            'border-teal-500/30 bg-teal-500/5': isConnected,
            'border-red-500/30 bg-red-500/5': error,
          }
        )}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className={cn('w-2 h-2 rounded-full', {
                'bg-zinc-600': !isConnected && !error && !isLoading,
                'bg-amber-400': isLoading,
                'bg-teal-400': isConnected,
                'bg-red-400': error,
              })}
            />
            {(isLoading || isAgentSpeaking) && (
              <div
                className={cn('absolute inset-0 w-2 h-2 rounded-full animate-ping', {
                  'bg-amber-400': isLoading,
                  'bg-teal-400': isAgentSpeaking,
                })}
              />
            )}
          </div>

          <span
            className={cn('text-sm font-medium', {
              'text-zinc-500': !isConnected && !error && !isLoading,
              'text-amber-400/90': isLoading,
              'text-zinc-300': isConnected && !isAgentSpeaking,
              'text-teal-400/90': isAgentSpeaking,
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
            <Wifi className="w-4 h-4 text-teal-400/70" />
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

      {/* Speaking animation */}
      <AnimatePresence>
        {isAgentSpeaking && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-teal-500/5 border border-teal-500/20"
          >
            <div className="flex items-center gap-0.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="w-0.5 bg-teal-400/60 rounded-full"
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
            <span className="text-sm text-teal-400/80 font-medium">Speaking...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface RetellEmptyStateProps {
  className?: string;
  onOpenSettings?: () => void;
}

/**
 * Empty state component for unconfigured Retell provider
 * Displays when VITE_RETELL_AGENT_ID is not set
 */
export function RetellEmptyState({ className, onOpenSettings }: RetellEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'flex flex-col items-center justify-center p-8 rounded-xl',
        'bg-zinc-900/50 backdrop-blur-lg border border-zinc-800/50',
        'text-center min-h-[300px]',
        className
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'flex items-center justify-center w-16 h-16 rounded-full mb-6',
          'bg-teal-500/10 border border-teal-500/20'
        )}
      >
        <AlertCircle className="w-8 h-8 text-teal-400" />
      </div>

      {/* Title */}
      <h3 className="font-display text-xl text-zinc-100 mb-2">Retell Setup Required</h3>

      {/* Description */}
      <p className="text-zinc-400 mb-4">Retell voice is not configured</p>

      {/* Missing config */}
      <div className="px-4 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50 mb-4">
        <code className="text-sm text-teal-400/80 font-mono">VITE_RETELL_AGENT_ID</code>
      </div>

      {/* Instructions */}
      <p className="text-zinc-500 text-sm max-w-md mb-6">
        Add your Retell Agent ID to the environment variables to enable Retell voice conversations.
        Get your agent ID from the Retell dashboard.
      </p>

      {/* Settings button */}
      {onOpenSettings && (
        <button
          onClick={onOpenSettings}
          className={cn(
            'flex items-center gap-2 px-6 py-3 rounded-lg',
            'bg-teal-500/10 border border-teal-500/30',
            'text-teal-400 hover:text-teal-300 hover:bg-teal-500/20',
            'transition-all duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50'
          )}
        >
          <Settings className="w-4 h-4" />
          <span className="text-sm font-medium">Open Settings</span>
        </button>
      )}
    </motion.div>
  );
}

export default RetellProvider;
