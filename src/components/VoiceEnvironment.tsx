import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface VoiceEnvironmentProps {
  isSpeaking: boolean;
  isConnected: boolean;
  audioIntensity?: number;
  className?: string;
}

export const VoiceEnvironment: React.FC<VoiceEnvironmentProps> = ({
  isSpeaking,
  isConnected,
  audioIntensity = 0,
  className = '',
}) => {
  const [dominantFrequency, setDominantFrequency] = useState(262);
  
  // Simulate voice tone analysis (in real app, this would come from audio analysis)
  useEffect(() => {
    if (isSpeaking) {
      const interval = setInterval(() => {
        // Simulate varying voice tones
        const baseFreq = 262; // Base hue for primary color
        const variation = Math.sin(Date.now() / 1000) * 30; // ±30 hue variation
        setDominantFrequency(baseFreq + variation);
      }, 100);
      
      return () => clearInterval(interval);
    }
  }, [isSpeaking]);

  // Dynamic color calculation based on voice tone
  const getVoiceToneColors = () => {
    const intensity = Math.max(0.1, audioIntensity);
    const baseHue = isSpeaking ? dominantFrequency : 262;
    const saturation = isSpeaking ? 73 + (intensity * 27) : 83;
    const lightness = isSpeaking ? 52 + (intensity * 20) : 58;
    
    return {
      primary: `hsl(${baseHue}, ${saturation}%, ${lightness}%)`,
      secondary: `hsl(${baseHue + 40}, ${saturation}%, ${lightness}%)`,
      ambient: `hsl(${baseHue}, ${saturation * 0.6}%, ${lightness * 0.3}%)`,
    };
  };

  const colors = getVoiceToneColors();


  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {/* Dynamic atmospheric lighting */}
      <motion.div
        className="absolute inset-0"
        animate={{
          opacity: isSpeaking ? [0.6, 1, 0.6] : isConnected ? [0.4, 0.6, 0.4] : [0.3, 0.5, 0.3],
          scale: isSpeaking ? [1.2, 1.5, 1.2] : isConnected ? [1, 1.2, 1] : [1, 1.1, 1],
        }}
        transition={{
          duration: isSpeaking ? 1.5 : isConnected ? 3 : 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          background: `radial-gradient(circle at 50% 50%, ${colors.ambient} 0%, transparent 70%)`,
        }}
      />

      {/* Voice-reactive gradient overlay */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            `radial-gradient(circle at 30% 70%, ${colors.primary}15, transparent 50%)`,
            `radial-gradient(circle at 70% 30%, ${colors.secondary}15, transparent 50%)`,
            `radial-gradient(circle at 30% 70%, ${colors.primary}15, transparent 50%)`,
          ],
        }}
        transition={{
          duration: isSpeaking ? 2 : 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Immersive atmosphere particles */}
      {isSpeaking && (
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                background: colors.primary,
                left: `${20 + i * 15}%`,
                top: `${30 + (i % 2) * 40}%`,
              }}
              animate={{
                y: [-20, -40, -20],
                opacity: [0, 0.8, 0],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2 + Math.random(),
                repeat: Infinity,
                delay: i * 0.3,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      )}

      {/* Spatial audio visualization rings */}
      {isConnected && (
        <div className="absolute inset-0 flex items-center justify-center">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border"
              style={{
                width: 200 + i * 100,
                height: 200 + i * 100,
                borderColor: colors.primary,
                borderWidth: 1,
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{
                duration: 3 + i,
                repeat: Infinity,
                delay: i * 0.5,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};