import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Loader2 } from 'lucide-react';
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

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
  };

  const iconSizes = {
    sm: 20,
    md: 24,
    lg: 28,
  };

  const handleClick = async () => {
    if (isLoading) return;

    if (isConnected) {
      await disconnect();
      onDisconnect?.();
    } else {
      const agentId = import.meta.env.VITE_ELEVENLABS_AGENT_ID;
      if (!agentId || agentId === 'your_agent_id_here') {
        // This will be handled by the parent component
        return;
      }
      await connect(agentId);
      onConnect?.();
    }
  };

  // Focus management for accessibility
  useEffect(() => {
    if (error && buttonRef.current) {
      buttonRef.current.focus();
    }
  }, [error]);

  const buttonVariants = {
    idle: { scale: 1 },
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
    speaking: { scale: [1, 1.1, 1], transition: { repeat: Infinity, duration: 1.5 } },
  };

  const getButtonState = () => {
    if (isLoading) return 'loading';
    if (isConnected && isSpeaking) return 'speaking';
    if (isConnected) return 'connected';
    if (error) return 'error';
    return 'idle';
  };

  const getButtonColor = () => {
    const state = getButtonState();
    switch (state) {
      case 'loading':
        return 'bg-yellow-500/20 border-yellow-500/50 hover:bg-yellow-500/30';
      case 'speaking':
        return 'bg-green-500/20 border-green-500/50 hover:bg-green-500/30';
      case 'connected':
        return 'bg-blue-500/20 border-blue-500/50 hover:bg-blue-500/30';
      case 'error':
        return 'bg-red-500/20 border-red-500/50 hover:bg-red-500/30';
      default:
        return 'bg-purple-500/20 border-purple-500/50 hover:bg-purple-500/30';
    }
  };

  const getIcon = () => {
    if (isLoading) {
      return <Loader2 size={iconSizes[size]} className="animate-spin text-yellow-400" />;
    }
    if (isConnected) {
      return <Mic size={iconSizes[size]} className="text-blue-400" />;
    }
    return <MicOff size={iconSizes[size]} className="text-purple-400" />;
  };

  const getAriaLabel = () => {
    const state = getButtonState();
    switch (state) {
      case 'loading':
        return 'Connecting to voice agent...';
      case 'speaking':
        return 'Voice agent is speaking';
      case 'connected':
        return 'Disconnect from voice agent';
      case 'error':
        return `Error: ${error}. Click to retry.`;
      default:
        return 'Connect to voice agent';
    }
  };

  return (
    <motion.button
      ref={buttonRef}
      onClick={handleClick}
      disabled={isLoading}
      variants={buttonVariants}
      initial="idle"
      animate={isSpeaking ? 'speaking' : 'idle'}
      whileHover="hover"
      whileTap="tap"
      className={cn(
        sizeClasses[size],
        'relative rounded-full border-2 backdrop-blur-sm',
        'transition-all duration-200 ease-in-out',
        'focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent',
        'disabled:cursor-not-allowed disabled:opacity-50',
        getButtonColor(),
        className
      )}
      aria-label={getAriaLabel()}
      aria-pressed={isConnected}
      role="button"
    >
      {/* Pulse effect for speaking state */}
      {isSpeaking && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-green-500"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.7, 0, 0.7],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Icon */}
      <div className="flex items-center justify-center">{getIcon()}</div>

      {/* Status indicator */}
      <div
        className={cn('absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white/20', {
          'bg-green-500': isConnected && !error,
          'bg-red-500': error,
          'bg-yellow-500': isLoading,
          'bg-gray-500': !isConnected && !error && !isLoading,
        })}
      />
    </motion.button>
  );
}
