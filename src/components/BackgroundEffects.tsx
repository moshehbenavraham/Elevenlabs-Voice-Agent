import React from 'react';
import { motion } from 'framer-motion';

interface BackgroundEffectsProps {
  isSpeaking?: boolean;
  className?: string;
}

export const BackgroundEffects: React.FC<BackgroundEffectsProps> = ({ 
  isSpeaking = false, 
  className = '' 
}) => {
  const FloatingElement = ({ 
    size, 
    delay, 
    duration, 
    x, 
    y, 
    shape = 'circle' 
  }: {
    size: number;
    delay: number;
    duration: number;
    x: number;
    y: number;
    shape?: 'circle' | 'square' | 'triangle';
  }) => (
    <motion.div
      className={`absolute ${shape === 'circle' ? 'rounded-full' : shape === 'square' ? 'rounded-lg' : ''}`}
      style={{
        width: size,
        height: size,
        left: x,
        top: y,
        background: isSpeaking 
          ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(124, 58, 237, 0.1))'
          : 'linear-gradient(135deg, rgba(124, 58, 237, 0.1), rgba(236, 72, 153, 0.1))',
        filter: 'blur(1px)',
      }}
      animate={{
        y: [0, -20, 0],
        x: [0, 10, 0],
        rotate: shape === 'square' ? [0, 180, 360] : [0, 360],
        scale: [1, 1.1, 1],
        opacity: [0.3, 0.7, 0.3],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Dynamic gradient overlay */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: isSpeaking
            ? 'radial-gradient(circle at 30% 70%, rgba(236, 72, 153, 0.15), transparent 50%), radial-gradient(circle at 70% 30%, rgba(124, 58, 237, 0.15), transparent 50%)'
            : 'radial-gradient(circle at 50% 50%, rgba(124, 58, 237, 0.1), transparent 50%)',
        }}
        animate={{
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Floating geometric elements */}
      <FloatingElement size={60} delay={0} duration={8} x={100} y={150} shape="circle" />
      <FloatingElement size={40} delay={1} duration={12} x={250} y={100} shape="square" />
      <FloatingElement size={30} delay={2} duration={10} x={80} y={300} shape="circle" />
      <FloatingElement size={50} delay={3} duration={15} x={350} y={250} shape="circle" />
      <FloatingElement size={35} delay={4} duration={9} x={200} y={350} shape="square" />
      <FloatingElement size={45} delay={5} duration={11} x={400} y={180} shape="circle" />

      {/* Subtle noise texture */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          mixBlendMode: 'overlay',
        }}
      />

      {/* Animated grid pattern */}
      <motion.div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
        animate={{
          backgroundPosition: ['0px 0px', '40px 40px'],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  );
};