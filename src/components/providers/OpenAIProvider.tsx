import { useRef, useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Loader2, Phone, AlertCircle, Wifi, WifiOff, Settings } from 'lucide-react';
import { OpenAIVoiceProvider } from '@/contexts/OpenAIVoiceContext';
import { useOpenAIVoice } from '@/hooks/useOpenAIVoice';
import { VoiceSelector } from '@/components/voice/VoiceSelector';
import { ReconnectionStatus } from '@/components/voice/ReconnectionStatus';
import { cn } from '@/lib/utils';
import { getApiBaseUrl } from '@/lib/apiConfig';
import type { ReactNode } from 'react';

/**
 * Check if OpenAI backend is configured
 * Returns true if the server has OpenAI API key configured
 */
// eslint-disable-next-line react-refresh/only-export-components
export async function checkOpenAIConfiguration(): Promise<boolean> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/openai/health`, {
      method: 'GET',
      credentials: 'include',
    });
    if (response.ok) {
      const data = await response.json();
      return data.configured === true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Hook to check OpenAI configuration status
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useOpenAIConfigured(): { isConfigured: boolean | null; isChecking: boolean } {
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkOpenAIConfiguration()
      .then(setIsConfigured)
      .finally(() => setIsChecking(false));
  }, []);

  return { isConfigured, isChecking };
}

interface OpenAIProviderProps {
  children?: ReactNode;
  onDisconnect?: () => void;
}

/**
 * OpenAI Voice Provider wrapper that provides the OpenAI context
 */
export function OpenAIProvider({ children, onDisconnect }: OpenAIProviderProps) {
  return <OpenAIVoiceProvider onDisconnect={onDisconnect}>{children}</OpenAIVoiceProvider>;
}

interface OpenAIVoiceButtonProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  onConnect?: () => void;
  onDisconnect?: () => void;
}

/**
 * Voice button for OpenAI provider - mirrors VoiceButton but uses OpenAI context
 */
export function OpenAIVoiceButton({
  className,
  size = 'lg',
  onConnect,
  onDisconnect,
}: OpenAIVoiceButtonProps) {
  const { isConnected, isLoading, isSpeaking, connect, disconnect, error } = useOpenAIVoice();
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
      await connect();
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
        return 'Connecting to OpenAI voice agent...';
      case 'speaking':
        return 'GPT-4o is speaking. Click to end call.';
      case 'connected':
        return 'Connected to OpenAI. Click to end call.';
      case 'error':
        return `Error: ${error}. Click to retry.`;
      default:
        return 'Start OpenAI voice conversation';
    }
  };

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
                  ? 'hsla(142, 71%, 45%, 0.15)'
                  : state === 'loading'
                    ? 'hsla(270, 80%, 60%, 0.1)'
                    : 'hsla(270, 80%, 60%, 0.08)'
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
                ? `hsla(270, 80%, 60%, ${0.15 - index * 0.03})`
                : state === 'loading'
                  ? `hsla(270, 80%, 60%, ${0.1 - index * 0.02})`
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
            'bg-zinc-900 border border-violet-500/30': state === 'loading',
            'bg-zinc-900 border border-violet-500/50 shadow-[0_0_30px_-5px_hsla(270,80%,60%,0.3)]':
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
        aria-busy={isLoading}
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
                  ? 'radial-gradient(circle at 30% 30%, hsla(270, 80%, 60%, 0.08) 0%, transparent 60%)'
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
              <Loader2 size={config.icon} className="text-violet-400 animate-spin" />
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
                  isSpeaking ? 'text-emerald-400' : 'text-violet-400'
                )}
              />
              <motion.div
                data-testid="voice-button-active-indicator"
                className={cn(
                  'absolute -top-1 -right-1 w-3 h-3 rounded-full',
                  isSpeaking ? 'bg-emerald-500' : 'bg-violet-500'
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
          data-testid="voice-button-status"
          className={cn('font-mono text-xs tracking-wide uppercase', {
            'text-zinc-500': state === 'idle',
            'text-violet-400/80': state === 'loading',
            'text-violet-400': state === 'connected',
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

interface OpenAIVoiceStatusProps {
  className?: string;
}

/**
 * Voice status display for OpenAI provider
 */
export function OpenAIVoiceStatus({ className }: OpenAIVoiceStatusProps) {
  const { isConnected, isLoading, isSpeaking, error, reconnection, manualReconnect } =
    useOpenAIVoice();

  return (
    <div className={cn('space-y-4', className)}>
      {/* Reconnection Status */}
      <ReconnectionStatus
        status={reconnection.status}
        attempt={reconnection.attempt}
        maxAttempts={5}
        countdown={reconnection.countdown}
        isOnline={reconnection.isOnline}
        onManualReconnect={manualReconnect}
      />

      {/* Connection Status Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'flex items-center justify-between px-4 py-3 rounded-lg',
          'border backdrop-blur-sm transition-all duration-300',
          {
            'border-zinc-800/50 bg-zinc-900/50': !isConnected && !error && !isLoading,
            'border-violet-500/20 bg-violet-500/5': isLoading,
            'border-violet-500/30 bg-violet-500/5': isConnected && !isSpeaking,
            'border-emerald-500/30 bg-emerald-500/5': isSpeaking,
            'border-red-500/30 bg-red-500/5': error,
          }
        )}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className={cn('w-2 h-2 rounded-full', {
                'bg-zinc-600': !isConnected && !error && !isLoading,
                'bg-violet-400': isLoading || (isConnected && !isSpeaking),
                'bg-emerald-400': isSpeaking,
                'bg-red-400': error,
              })}
            />
            {(isLoading || isSpeaking) && (
              <div
                className={cn('absolute inset-0 w-2 h-2 rounded-full animate-ping', {
                  'bg-violet-400': isLoading,
                  'bg-emerald-400': isSpeaking,
                })}
              />
            )}
          </div>

          <span
            className={cn('text-sm font-medium', {
              'text-zinc-500': !isConnected && !error && !isLoading,
              'text-violet-400/90': isLoading,
              'text-zinc-300': isConnected && !isSpeaking,
              'text-emerald-400/90': isSpeaking,
              'text-red-400/90': error,
            })}
          >
            {error
              ? 'Connection Error'
              : isLoading
                ? 'Connecting to OpenAI...'
                : isSpeaking
                  ? 'GPT-4o is responding'
                  : isConnected
                    ? 'Connected - Listening'
                    : 'Disconnected'}
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
    </div>
  );
}

interface OpenAIVoiceVisualizerProps {
  className?: string;
  width?: number;
  height?: number;
  barCount?: number;
  responsive?: boolean;
}

/**
 * Voice visualizer for OpenAI provider - uses analyser node from context
 */
export function OpenAIVoiceVisualizer({
  className,
  width = 400,
  height = 120,
  barCount = 64,
  responsive = true,
}: OpenAIVoiceVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const smoothDataRef = useRef<number[]>(new Array(barCount).fill(0));

  const { isConnected, isSpeaking, getAnalyserNode } = useOpenAIVoice();

  const smoothData = useCallback((newData: number[], smoothFactor = 0.3) => {
    return newData.map((value, i) => {
      const current = smoothDataRef.current[i] || 0;
      return current + (value - current) * smoothFactor;
    });
  }, []);

  const drawWaveform = useCallback(
    (ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number, data: number[]) => {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      const centerY = canvasHeight / 2;
      const maxAmplitude = canvasHeight * 0.4;

      const smoothedData = smoothData(data);
      smoothDataRef.current = smoothedData;

      // OpenAI uses violet/purple gradient
      const gradient = ctx.createLinearGradient(0, 0, canvasWidth, 0);
      gradient.addColorStop(0, 'hsla(270, 80%, 60%, 0.1)');
      gradient.addColorStop(
        0.5,
        isSpeaking ? 'hsla(142, 71%, 45%, 0.6)' : 'hsla(270, 80%, 60%, 0.5)'
      );
      gradient.addColorStop(1, 'hsla(270, 80%, 60%, 0.1)');

      ctx.beginPath();
      ctx.moveTo(0, centerY);

      const segmentWidth = canvasWidth / (smoothedData.length - 1);

      for (let i = 0; i < smoothedData.length; i++) {
        const x = i * segmentWidth;
        const amplitude = (smoothedData[i] / 255) * maxAmplitude;
        const y = centerY + Math.sin(i * 0.5 + Date.now() * 0.002) * amplitude;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          const prevX = (i - 1) * segmentWidth;
          const prevAmplitude = (smoothedData[i - 1] / 255) * maxAmplitude;
          const prevY = centerY + Math.sin((i - 1) * 0.5 + Date.now() * 0.002) * prevAmplitude;

          const cpX1 = prevX + segmentWidth / 3;
          const cpX2 = x - segmentWidth / 3;

          ctx.bezierCurveTo(cpX1, prevY, cpX2, y, x, y);
        }
      }

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Mirror wave
      ctx.beginPath();
      ctx.moveTo(0, centerY);

      for (let i = 0; i < smoothedData.length; i++) {
        const x = i * segmentWidth;
        const amplitude = (smoothedData[i] / 255) * maxAmplitude;
        const y = centerY - Math.sin(i * 0.5 + Date.now() * 0.002) * amplitude;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          const prevX = (i - 1) * segmentWidth;
          const prevAmplitude = (smoothedData[i - 1] / 255) * maxAmplitude;
          const prevY = centerY - Math.sin((i - 1) * 0.5 + Date.now() * 0.002) * prevAmplitude;

          const cpX1 = prevX + segmentWidth / 3;
          const cpX2 = x - segmentWidth / 3;

          ctx.bezierCurveTo(cpX1, prevY, cpX2, y, x, y);
        }
      }

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Center line
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(canvasWidth, centerY);
      ctx.strokeStyle = 'hsla(0, 0%, 100%, 0.05)';
      ctx.lineWidth = 1;
      ctx.stroke();
    },
    [smoothData, isSpeaking]
  );

  // Animation loop
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = getAnalyserNode();

    const animate = () => {
      let data: number[] = [];

      if (analyser && isConnected) {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);

        const step = Math.floor(dataArray.length / barCount);
        for (let i = 0; i < barCount; i++) {
          data.push(dataArray[i * step] || 0);
        }
      } else if (isConnected) {
        // Idle animation when connected but no analyser
        const time = Date.now() / 1000;
        for (let i = 0; i < barCount; i++) {
          const wave1 = Math.sin(time * 2 + i * 0.2) * 0.3 + 0.3;
          const wave2 = Math.sin(time * 1.5 + i * 0.15) * 0.2;
          const combined = (wave1 + wave2) * 255 * 0.3;
          data.push(Math.max(0, combined));
        }
      } else {
        data = new Array(barCount).fill(0);
      }

      drawWaveform(ctx, canvas.width, canvas.height, data);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isConnected, barCount, drawWaveform, getAnalyserNode]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn('relative overflow-hidden rounded-xl', className)}
    >
      <div
        className="absolute inset-0 rounded-xl"
        style={{
          background:
            'linear-gradient(180deg, hsla(240, 6%, 8%, 0.8) 0%, hsla(240, 6%, 8%, 0.6) 100%)',
          border: '1px solid hsla(0, 0%, 100%, 0.06)',
        }}
      />

      <canvas
        ref={canvasRef}
        width={responsive ? undefined : width}
        height={responsive ? undefined : height}
        className={cn('relative z-10 w-full', responsive ? 'h-24 sm:h-28' : '')}
        style={!responsive ? { width, height } : undefined}
        role="img"
        aria-label={
          isConnected
            ? 'Real-time OpenAI audio visualization'
            : 'OpenAI audio visualization placeholder'
        }
      />

      <div className="absolute top-3 right-3 flex items-center gap-2">
        <div
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            isConnected ? (isSpeaking ? 'bg-emerald-400' : 'bg-violet-400') : 'bg-zinc-600'
          )}
        />
        <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
          {isConnected ? (isSpeaking ? 'Active' : 'Listening') : 'Standby'}
        </span>
      </div>

      {isConnected && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            boxShadow: isSpeaking
              ? 'inset 0 0 20px hsla(142, 71%, 45%, 0.1)'
              : 'inset 0 0 20px hsla(270, 80%, 60%, 0.05)',
          }}
        />
      )}
    </motion.div>
  );
}

interface OpenAIVoiceSelectorProps {
  className?: string;
}

/**
 * Voice selector for OpenAI provider
 * Shows voice selection dropdown, disabled when connected
 */
export function OpenAIVoiceSelector({ className }: OpenAIVoiceSelectorProps) {
  const { selectedVoice, setVoice, isConnected, isLoading } = useOpenAIVoice();

  return (
    <VoiceSelector
      provider="openai"
      value={selectedVoice}
      onValueChange={setVoice}
      disabled={isConnected || isLoading}
      className={className}
    />
  );
}

interface OpenAIEmptyStateProps {
  className?: string;
  onOpenSettings?: () => void;
}

/**
 * Empty state component for unconfigured OpenAI provider
 * Displays when OPENAI_API_KEY is not set on the server
 */
export function OpenAIEmptyState({ className, onOpenSettings }: OpenAIEmptyStateProps) {
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
      <h3 className="font-display text-xl text-zinc-100 mb-2">OpenAI Setup Required</h3>

      {/* Description */}
      <p className="text-zinc-400 mb-4">OpenAI GPT-4o voice is not configured</p>

      {/* Missing config */}
      <div className="px-4 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50 mb-4">
        <code className="text-sm text-violet-400/80 font-mono">OPENAI_API_KEY</code>
      </div>

      {/* Instructions */}
      <p className="text-zinc-500 text-sm max-w-md mb-6">
        Add your OpenAI API key to the server environment variables to enable GPT-4o voice
        conversations.
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

export default OpenAIProvider;
