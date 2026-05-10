import { useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MicOff,
  Loader2,
  PhoneCall,
  AlertCircle,
  Wifi,
  WifiOff,
  Settings,
  Square,
} from 'lucide-react';
import { VapiVoiceProvider, useVapiVoiceContext } from '@/contexts/VapiVoiceContext';
import { VapiCallStatus } from '@/types/vapi';
import { prepareAudioContext, getVapiDebugInfo } from '@/lib/vapi';
import { hasConfiguredValue } from '@/lib/configPlaceholders';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

// Logging prefix for easy console filtering
const LOG_PREFIX = '[Vapi:UI]';

/**
 * Check if Vapi is configured (frontend-only check)
 * Returns true if VITE_VAPI_WEB_TOKEN is set
 */
// eslint-disable-next-line react-refresh/only-export-components
export function checkVapiConfiguration(): boolean {
  const webToken = import.meta.env.VITE_VAPI_WEB_TOKEN;
  const isConfigured = hasConfiguredValue(webToken);
  console.log(`${LOG_PREFIX} checkVapiConfiguration():`, isConfigured);
  return isConfigured;
}

/**
 * Hook to check Vapi configuration status
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useVapiConfigured(): { isConfigured: boolean; isChecking: boolean } {
  // Synchronous frontend-only check - initialize directly
  const isConfigured = checkVapiConfiguration();
  return { isConfigured, isChecking: false };
}

interface VapiProviderProps {
  children?: ReactNode;
  onDisconnect?: () => void;
}

/**
 * Inner component that handles disconnect logic
 * Must be inside VapiVoiceProvider to use the context
 *
 * IMPORTANT: The cleanup effect uses a ref to store the stop function.
 * This prevents the cleanup from running on every re-render when state changes.
 * Without this fix, state changes during call initialization would trigger
 * cleanup → stop() → kill the call immediately after it connects.
 */
function VapiProviderInner({ children, onDisconnect }: VapiProviderProps) {
  const { stop, callStatus } = useVapiVoiceContext();

  // Use a ref to track the current stop function
  // This allows cleanup to access the latest stop without re-running the effect
  const stopRef = useRef(stop);

  // Keep the ref in sync with the latest stop function
  useEffect(() => {
    stopRef.current = stop;
  }, [stop]);

  // Handle disconnect callback when call ends
  useEffect(() => {
    if (callStatus === VapiCallStatus.INACTIVE && onDisconnect) {
      // Only call onDisconnect if we were previously connected
    }
  }, [callStatus, onDisconnect]);

  // Cleanup on unmount ONLY (empty deps array)
  // Uses ref to get the latest stop function without being a dependency
  useEffect(() => {
    return () => {
      console.log('[Vapi:UI] VapiProviderInner unmounting, calling stop()');
      stopRef.current();
    };
  }, []);

  return <>{children}</>;
}

/**
 * Vapi Voice Provider wrapper component
 * Provides Vapi voice functionality to children via React Context
 *
 * This wraps children with VapiVoiceProvider to ensure event listeners
 * are registered only once, preventing the multiple-instantiation bug.
 */
export function VapiProvider({ children, onDisconnect }: VapiProviderProps) {
  return (
    <VapiVoiceProvider>
      <VapiProviderInner onDisconnect={onDisconnect}>{children}</VapiProviderInner>
    </VapiVoiceProvider>
  );
}

interface VapiButtonProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  onConnect?: () => void;
  onDisconnect?: () => void;
}

/**
 * Voice button for Vapi provider
 * Features color state transitions and audio-level glow visualization
 */
export function VapiButton({ className, size = 'lg', onConnect, onDisconnect }: VapiButtonProps) {
  const { callStatus, isSpeechActive, audioLevel, start, stop, error } = useVapiVoiceContext();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const wasConnectedRef = useRef(false);

  const isConnected = callStatus === VapiCallStatus.ACTIVE;
  const isLoading = callStatus === VapiCallStatus.LOADING;

  const sizeConfig = {
    sm: { button: 'w-16 h-16', icon: 18, rings: [24, 32] },
    md: { button: 'w-24 h-24', icon: 24, rings: [36, 48] },
    lg: { button: 'w-32 h-32', icon: 32, rings: [48, 64, 80] },
  };

  const config = sizeConfig[size];

  const handleClick = async () => {
    console.log(`${LOG_PREFIX} ══════════════════════════════════════════`);
    console.log(`${LOG_PREFIX} 🖱️ BUTTON CLICKED`);
    console.log(`${LOG_PREFIX}   isLoading: ${isLoading}`);
    console.log(`${LOG_PREFIX}   isConnected: ${isConnected}`);
    console.log(`${LOG_PREFIX}   callStatus: ${callStatus}`);
    console.log(`${LOG_PREFIX} ══════════════════════════════════════════`);

    if (isLoading) {
      console.log(`${LOG_PREFIX} ⏳ Ignoring click - still loading`);
      return;
    }

    if (isConnected) {
      console.log(`${LOG_PREFIX} 🛑 Stopping call...`);
      stop();
      onDisconnect?.();
    } else {
      console.log(`${LOG_PREFIX} 🚀 Starting call...`);

      // Pre-initialize AudioContext BEFORE vapi.start()
      // This ensures execution context exists for Daily.co's Krisp AudioWorklet
      console.log(`${LOG_PREFIX} 🎤 Step 1: Pre-initializing AudioContext...`);
      const audioCtx = prepareAudioContext();
      console.log(
        `${LOG_PREFIX}   AudioContext result:`,
        audioCtx ? `state=${audioCtx.state}` : 'null'
      );

      console.log(`${LOG_PREFIX} 📊 Step 2: Debug info before start:`);
      console.log(`${LOG_PREFIX}  `, getVapiDebugInfo());

      console.log(`${LOG_PREFIX} 📞 Step 3: Calling start()...`);
      try {
        await start();
        console.log(`${LOG_PREFIX} ✅ start() completed without throwing`);
        onConnect?.();
      } catch (e) {
        console.error(`${LOG_PREFIX} ❌ start() threw an error:`, e);
      }
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
    if (isConnected && isSpeechActive) return 'speaking';
    if (isConnected) return 'connected';
    if (error) return 'error';
    return 'idle';
  };

  const state = getState();

  const getAriaLabel = () => {
    switch (state) {
      case 'loading':
        return 'Connecting to Vapi...';
      case 'speaking':
        return 'Vapi is speaking. Click to end call.';
      case 'connected':
        return 'Connected to Vapi. Click to end call.';
      case 'error':
        return `Error: ${error}. Click to retry.`;
      default:
        return 'Start Vapi voice conversation';
    }
  };

  // Calculate glow intensity based on audio level (0-1)
  const glowIntensity = useMemo(() => {
    if (!isConnected) return 0;
    // Map audioLevel to glow spread (10-40px) and opacity (0.2-0.6)
    return Math.min(1, audioLevel * 1.5);
  }, [isConnected, audioLevel]);

  // Vapi uses purple/violet color scheme
  const glowColor = isSpeechActive
    ? `hsla(271, 91%, 65%, ${0.2 + glowIntensity * 0.4})`
    : `hsla(258, 90%, 66%, ${0.15 + glowIntensity * 0.3})`;

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
                  ? 'hsla(271, 91%, 65%, 0.15)'
                  : state === 'loading'
                    ? 'hsla(258, 90%, 66%, 0.1)'
                    : 'hsla(258, 90%, 66%, 0.08)'
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
                ? `hsla(258, 90%, 66%, ${0.15 - index * 0.03})`
                : state === 'loading'
                  ? `hsla(258, 90%, 66%, ${0.1 - index * 0.02})`
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
        {isSpeechActive && (
          <>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={`pulse-${i}`}
                className="absolute rounded-full border-2 border-violet-400/40"
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
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 focus-visible:ring-offset-4 focus-visible:ring-offset-zinc-900',
          'disabled:cursor-not-allowed',
          {
            'bg-zinc-900 border border-zinc-700/50 hover:border-zinc-600': state === 'idle',
            'bg-zinc-900 border border-amber-500/30': state === 'loading',
            'bg-zinc-900 border border-violet-500/50':
              state === 'connected' || state === 'speaking',
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
                ? 'radial-gradient(circle at 30% 30%, hsla(271, 91%, 65%, 0.1) 0%, transparent 60%)'
                : state === 'connected'
                  ? 'radial-gradient(circle at 30% 30%, hsla(258, 90%, 66%, 0.08) 0%, transparent 60%)'
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
                  isSpeechActive ? 'text-violet-400' : 'text-violet-400'
                )}
                fill="currentColor"
              />
              <motion.div
                data-testid="voice-button-active-indicator"
                className={cn(
                  'absolute -top-1 -right-1 w-3 h-3 rounded-full',
                  isSpeechActive ? 'bg-violet-500' : 'bg-violet-500'
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
                <PhoneCall size={config.icon} className="text-zinc-400" />
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
            'text-violet-400': state === 'connected' || state === 'speaking',
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

interface VapiVoiceStatusProps {
  className?: string;
}

/**
 * Voice status display for Vapi provider
 */
export function VapiVoiceStatus({ className }: VapiVoiceStatusProps) {
  const { callStatus, isSpeechActive, error } = useVapiVoiceContext();

  const isConnected = callStatus === VapiCallStatus.ACTIVE;
  const isLoading = callStatus === VapiCallStatus.LOADING;

  const getStatusText = () => {
    if (error) return 'Connection Error';
    if (isLoading) return 'Connecting to Vapi...';
    if (isSpeechActive) return 'Vapi is responding';
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
            'border-violet-500/30 bg-violet-500/5': isConnected,
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
                'bg-violet-400': isConnected,
                'bg-red-400': error,
              })}
            />
            {(isLoading || isSpeechActive) && (
              <div
                className={cn('absolute inset-0 w-2 h-2 rounded-full animate-ping', {
                  'bg-amber-400': isLoading,
                  'bg-violet-400': isSpeechActive,
                })}
              />
            )}
          </div>

          <span
            className={cn('text-sm font-medium', {
              'text-zinc-500': !isConnected && !error && !isLoading,
              'text-amber-400/90': isLoading,
              'text-zinc-300': isConnected && !isSpeechActive,
              'text-violet-400/90': isSpeechActive,
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
            <Wifi className="w-4 h-4 text-violet-400/70" />
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
        {isSpeechActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-violet-500/5 border border-violet-500/20"
          >
            <div className="flex items-center gap-0.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="w-0.5 bg-violet-400/60 rounded-full"
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
            <span className="text-sm text-violet-400/80 font-medium">Speaking...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface VapiEmptyStateProps {
  className?: string;
  onOpenSettings?: () => void;
}

/**
 * Empty state component for unconfigured Vapi provider
 * Displays when VITE_VAPI_WEB_TOKEN is not set
 */
export function VapiEmptyState({ className, onOpenSettings }: VapiEmptyStateProps) {
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
          'bg-violet-500/10 border border-violet-500/20'
        )}
      >
        <AlertCircle className="w-8 h-8 text-violet-400" />
      </div>

      {/* Title */}
      <h3 className="font-display text-xl text-zinc-100 mb-2">Vapi Setup Required</h3>

      {/* Description */}
      <p className="text-zinc-400 mb-4">Vapi voice is not configured</p>

      {/* Missing config */}
      <div className="px-4 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50 mb-4">
        <code className="text-sm text-violet-400/80 font-mono">VITE_VAPI_WEB_TOKEN</code>
      </div>

      {/* Instructions */}
      <p className="text-zinc-500 text-sm max-w-md mb-6">
        Add your Vapi Web Token to the environment variables to enable Vapi voice conversations. Get
        your token from the Vapi dashboard.
      </p>

      {/* Settings button */}
      {onOpenSettings && (
        <button
          onClick={onOpenSettings}
          className={cn(
            'flex items-center gap-2 px-6 py-3 rounded-lg',
            'bg-violet-500/10 border border-violet-500/30',
            'text-violet-400 hover:text-violet-300 hover:bg-violet-500/20',
            'transition-all duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50'
          )}
        >
          <Settings className="w-4 h-4" />
          <span className="text-sm font-medium">Open Settings</span>
        </button>
      )}
    </motion.div>
  );
}

export default VapiProvider;
