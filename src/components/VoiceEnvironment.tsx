import React from 'react';
import { motion } from 'framer-motion';

interface VoiceEnvironmentProps {
  isActive?: boolean;
  intensity?: number; // 0-1 scale for visual intensity
}

export const VoiceEnvironment: React.FC<VoiceEnvironmentProps> = ({
  isActive = false,
  intensity = 0.5,
}) => {
  // Calculate visual properties based on intensity
  const baseOpacity = intensity * 0.6;
  const pulseScale = 1 + intensity * 0.3;
  const animationSpeed = Math.max(0.5, 2 - intensity);

  return (
    <div className="fixed inset-0 pointer-events-none z-10">
      {/* Central Ambient Glow */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        initial={{ opacity: 0, scale: 0 }}
        animate={{
          opacity: isActive ? baseOpacity : 0,
          scale: isActive ? pulseScale : 0,
        }}
        transition={{
          duration: animationSpeed,
          ease: 'easeInOut',
        }}
      >
        <motion.div
          className="w-96 h-96 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl"
          animate={isActive ? {
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          } : {}}
          transition={{
            duration: animationSpeed * 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </motion.div>

      {/* Surrounding Energy Rings */}
      {[...Array(3)].map((_, index) => (
        <motion.div
          key={index}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: isActive ? baseOpacity * (0.8 - index * 0.2) : 0,
            scale: isActive ? 1 + index * 0.5 : 0,
          }}
          transition={{
            duration: animationSpeed,
            delay: index * 0.2,
            ease: 'easeOut',
          }}
        >
          <motion.div
            className={`w-${120 + index * 60} h-${120 + index * 60} border border-white/10 rounded-full`}
            animate={isActive ? {
              scale: [1, 1.1, 1],
              opacity: [0.1, 0.3, 0.1],
            } : {}}
            transition={{
              duration: animationSpeed * 3,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: index * 0.5,
            }}
            style={{
              width: `${120 + index * 60}px`,
              height: `${120 + index * 60}px`,
            }}
          />
        </motion.div>
      ))}

      {/* Corner Accent Lights */}
      <motion.div
        className="absolute top-10 left-10 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl"
        animate={isActive ? {
          opacity: [baseOpacity * 0.5, baseOpacity, baseOpacity * 0.5],
          scale: [1, 1.2, 1],
        } : { opacity: 0, scale: 0 }}
        transition={{
          duration: animationSpeed * 2.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="absolute top-10 right-10 w-24 h-24 bg-pink-500/10 rounded-full blur-2xl"
        animate={isActive ? {
          opacity: [baseOpacity * 0.3, baseOpacity * 0.8, baseOpacity * 0.3],
          scale: [1, 1.3, 1],
        } : { opacity: 0, scale: 0 }}
        transition={{
          duration: animationSpeed * 3,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.8,
        }}
      />

      <motion.div
        className="absolute bottom-10 left-10 w-28 h-28 bg-blue-500/10 rounded-full blur-2xl"
        animate={isActive ? {
          opacity: [baseOpacity * 0.4, baseOpacity * 0.7, baseOpacity * 0.4],
          scale: [1, 1.1, 1],
        } : { opacity: 0, scale: 0 }}
        transition={{
          duration: animationSpeed * 2.2,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1.2,
        }}
      />

      <motion.div
        className="absolute bottom-10 right-10 w-20 h-20 bg-purple-500/10 rounded-full blur-2xl"
        animate={isActive ? {
          opacity: [baseOpacity * 0.2, baseOpacity * 0.6, baseOpacity * 0.2],
          scale: [1, 1.4, 1],
        } : { opacity: 0, scale: 0 }}
        transition={{
          duration: animationSpeed * 2.8,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1.6,
        }}
      />

      {/* Ambient Grid Enhancement */}
      {isActive && (
        <motion.div
          className="absolute inset-0 grid-bg"
          initial={{ opacity: 0 }}
          animate={{ opacity: baseOpacity * 0.3 }}
          transition={{ duration: animationSpeed }}
        />
      )}
    </div>
  );
};