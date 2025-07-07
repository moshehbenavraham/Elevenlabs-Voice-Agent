
import React from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Square } from 'lucide-react';
import { AudioVisualizer } from './AudioVisualizer';

interface VoiceOrbProps {
  isConnected: boolean;
  isLoading: boolean;
  isSpeaking: boolean;
  onToggleConnection: () => void;
  onEndConversation: () => void;
}

export const VoiceOrb: React.FC<VoiceOrbProps> = ({
  isConnected,
  isLoading,
  isSpeaking,
  onToggleConnection,
  onEndConversation,
}) => {
  const getOrbState = () => {
    if (isLoading) return 'loading';
    if (isConnected) return 'connected';
    return 'idle';
  };

  const orbState = getOrbState();

  const orbVariants = {
    idle: {
      scale: [1, 1.02, 1.01, 1],
      boxShadow: [
        '0 0 30px rgba(124, 58, 237, 0.3)',
        '0 0 45px rgba(124, 58, 237, 0.5)',
        '0 0 35px rgba(124, 58, 237, 0.4)',
        '0 0 30px rgba(124, 58, 237, 0.3)',
      ],
      opacity: [0.9, 1, 0.95, 0.9],
    },
    loading: {
      scale: [1, 1.05, 1.02, 1],
      boxShadow: [
        '0 0 30px rgba(124, 58, 237, 0.3)',
        '0 0 50px rgba(124, 58, 237, 0.6)',
        '0 0 40px rgba(124, 58, 237, 0.5)',
        '0 0 30px rgba(124, 58, 237, 0.3)',
      ],
      opacity: [0.8, 1, 0.9, 0.8],
      rotate: [0, 2, -2, 0],
    },
    connected: {
      scale: isSpeaking 
        ? [1, 1.1, 1.05, 1, 1.08, 1] 
        : [1, 1.03, 1.01, 1],
      boxShadow: isSpeaking 
        ? [
            '0 0 40px rgba(236, 72, 153, 0.6)',
            '0 0 70px rgba(236, 72, 153, 0.9)',
            '0 0 50px rgba(236, 72, 153, 0.7)',
            '0 0 40px rgba(236, 72, 153, 0.6)',
            '0 0 65px rgba(236, 72, 153, 0.8)',
            '0 0 40px rgba(236, 72, 153, 0.6)',
          ]
        : [
            '0 0 40px rgba(124, 58, 237, 0.6)',
            '0 0 50px rgba(124, 58, 237, 0.7)',
            '0 0 45px rgba(124, 58, 237, 0.65)',
            '0 0 40px rgba(124, 58, 237, 0.6)',
          ],
      opacity: isSpeaking ? [0.9, 1, 0.95, 0.9, 1, 0.9] : [0.9, 1, 0.95, 0.9],
    },
  };

  return (
    <div className="relative flex flex-col items-center space-y-8">
      {/* Main Voice Orb */}
      <motion.div
        className="relative"
        initial="idle"
        animate={orbState}
        variants={orbVariants}
        transition={{
          duration: orbState === 'idle' ? 3 : orbState === 'loading' ? 1.5 : 2,
          repeat: orbState === 'idle' || orbState === 'loading' || (orbState === 'connected' && isSpeaking) ? Infinity : 0,
          ease: orbState === 'idle' ? 'easeInOut' : 'easeInOut',
        }}
      >
        <div className="relative w-80 h-80 max-w-[300px] max-h-[300px] rounded-full glass gradient-primary p-1 animate-pulse-glow">
          <div className="w-full h-full rounded-full bg-background/20 backdrop-blur-xl flex items-center justify-center relative overflow-hidden">
            {/* Audio Visualizer */}
            <AudioVisualizer
              isActive={isConnected}
              isSpeaking={isSpeaking}
              className="absolute inset-0"
            />
            
            {/* Center Icon */}
            <motion.div
              className="relative z-10 p-6 rounded-full glass"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isLoading ? (
                <motion.div
                  className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              ) : isConnected ? (
                <Mic className="w-8 h-8 text-white" />
              ) : (
                <MicOff className="w-8 h-8 text-white/70" />
              )}
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Control Buttons */}
      <div className="flex space-x-4">
        <motion.button
          onClick={onToggleConnection}
          disabled={isLoading}
          className="px-8 py-3 rounded-full gradient-primary text-white font-medium hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isLoading ? 'Connecting...' : isConnected ? 'Disconnect' : 'Start Chat'}
        </motion.button>

        {isConnected && (
          <motion.button
            onClick={onEndConversation}
            className="px-6 py-3 rounded-full glass text-white hover:bg-red-500/20 transition-all duration-300"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <Square className="w-5 h-5" />
          </motion.button>
        )}
      </div>

      {/* Status Text */}
      <motion.div
        className="text-center text-white/70"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <p className="text-sm">
          {isLoading && 'Connecting to AI agent...'}
          {isConnected && !isSpeaking && 'Listening... Start speaking'}
          {isConnected && isSpeaking && 'AI is responding...'}
          {!isConnected && !isLoading && 'Click to start your voice conversation'}
        </p>
      </motion.div>
    </div>
  );
};
