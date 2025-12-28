import { useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Loader2, Phone, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { XAIVoiceProvider } from '@/contexts/XAIVoiceContext';
import { useXAIVoice } from '@/hooks/useXAIVoice';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface XAIProviderProps {
  children?: ReactNode;
  onDisconnect?: () => void;
}

/**
 * XAI Voice Provider wrapper that provides the xAI context
 */
export function XAIProvider({ children, onDisconnect }: XAIProviderProps) {
  return (
    <XAIVoiceProvider onDisconnect={onDisconnect}>
      {children}
    </XAIVoiceProvider>
  );
}

interface XAIVoiceButtonProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  onConnect?: () => void;
  onDisconnect?: () => void;
}

/**
 * Voice button for xAI provider - mirrors VoiceButton but uses XAI context
 */
export function XAIVoiceButton({
  className,
  size = 'lg',
  onConnect,
  onDisconnect,
}: XAIVoiceButtonProps) {
  const { isConnected, isLoading, isSpeaking, connect, disconnect, error } = useXAIVoice();
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
        return 'Connecting to xAI voice agent...';
      case 'speaking':
        return 'xAI is speaking. Click to end call.';
      case 'connected':
        return 'Connected to xAI. Click to end call.';
      case 'error':
        return `Error: ${error}. Click to retry.`;
      default:
        return 'Start xAI voice conversation';
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
                    ? 'hsla(200, 80%, 50%, 0.1)'
                    : 'hsla(200, 80%, 50%, 0.08)'
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
                ? `hsla(200, 80%, 50%, ${0.15 - index * 0.03})`
                : state === 'loading'
                  ? `hsla(200, 80%, 50%, ${0.1 - index * 0.02})`
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
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50 focus-visible:ring-offset-4 focus-visible:ring-offset-zinc-900',
          'disabled:cursor-not-allowed',
          {
            'bg-zinc-900 border border-zinc-700/50 hover:border-zinc-600': state === 'idle',
            'bg-zinc-900 border border-sky-500/30': state === 'loading',
            'bg-zinc-900 border border-sky-500/50 shadow-[0_0_30px_-5px_hsla(200,80%,50%,0.3)]':
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
                  ? 'radial-gradient(circle at 30% 30%, hsla(200, 80%, 50%, 0.08) 0%, transparent 60%)'
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
              <Loader2 size={config.icon} className="text-sky-400 animate-spin" />
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
                  isSpeaking ? 'text-emerald-400' : 'text-sky-400'
                )}
              />
              <motion.div
                className={cn(
                  'absolute -top-1 -right-1 w-3 h-3 rounded-full',
                  isSpeaking ? 'bg-emerald-500' : 'bg-sky-500'
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
            'text-sky-400/80': state === 'loading',
            'text-sky-400': state === 'connected',
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

interface XAIVoiceStatusProps {
  className?: string;
}

/**
 * Voice status display for xAI provider
 */
export function XAIVoiceStatus({ className }: XAIVoiceStatusProps) {
  const { isConnected, isLoading, isSpeaking, error } = useXAIVoice();

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
            'border-sky-500/20 bg-sky-500/5': isLoading,
            'border-sky-500/30 bg-sky-500/5': isConnected && !isSpeaking,
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
                'bg-sky-400': isLoading || (isConnected && !isSpeaking),
                'bg-emerald-400': isSpeaking,
                'bg-red-400': error,
              })}
            />
            {(isLoading || isSpeaking) && (
              <div
                className={cn('absolute inset-0 w-2 h-2 rounded-full animate-ping', {
                  'bg-sky-400': isLoading,
                  'bg-emerald-400': isSpeaking,
                })}
              />
            )}
          </div>

          <span
            className={cn('text-sm font-medium', {
              'text-zinc-500': !isConnected && !error && !isLoading,
              'text-sky-400/90': isLoading,
              'text-zinc-300': isConnected && !isSpeaking,
              'text-emerald-400/90': isSpeaking,
              'text-red-400/90': error,
            })}
          >
            {error
              ? 'Connection Error'
              : isLoading
                ? 'Connecting to xAI...'
                : isSpeaking
                  ? 'Grok is responding'
                  : isConnected
                    ? 'Connected - Listening'
                    : 'Disconnected'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {error ? (
            <AlertCircle className="w-4 h-4 text-red-400" />
          ) : isConnected ? (
            <Wifi className="w-4 h-4 text-sky-400/70" />
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

interface XAIVoiceVisualizerProps {
  className?: string;
  width?: number;
  height?: number;
  barCount?: number;
  responsive?: boolean;
}

/**
 * Voice visualizer for xAI provider - uses analyser node from context
 */
export function XAIVoiceVisualizer({
  className,
  width = 400,
  height = 120,
  barCount = 64,
  responsive = true,
}: XAIVoiceVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const smoothDataRef = useRef<number[]>(new Array(barCount).fill(0));

  const { isConnected, isSpeaking, getAnalyserNode } = useXAIVoice();

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

      // xAI uses blue/cyan gradient
      const gradient = ctx.createLinearGradient(0, 0, canvasWidth, 0);
      gradient.addColorStop(0, 'hsla(200, 80%, 50%, 0.1)');
      gradient.addColorStop(
        0.5,
        isSpeaking ? 'hsla(142, 71%, 45%, 0.6)' : 'hsla(200, 80%, 50%, 0.5)'
      );
      gradient.addColorStop(1, 'hsla(200, 80%, 50%, 0.1)');

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
            ? 'Real-time xAI audio visualization'
            : 'xAI audio visualization placeholder'
        }
      />

      <div className="absolute top-3 right-3 flex items-center gap-2">
        <div
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            isConnected ? (isSpeaking ? 'bg-emerald-400' : 'bg-sky-400') : 'bg-zinc-600'
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
              : 'inset 0 0 20px hsla(200, 80%, 50%, 0.05)',
          }}
        />
      )}
    </motion.div>
  );
}

export default XAIProvider;
