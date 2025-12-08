import type { FC } from 'react';
import { motion } from 'framer-motion';

export const BackgroundEffects: FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Base gradient - warm noir */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 120% 80% at 50% 100%, hsla(43, 96%, 56%, 0.04) 0%, transparent 50%),
            radial-gradient(ellipse 80% 60% at 0% 0%, hsla(263, 70%, 76%, 0.03) 0%, transparent 40%),
            radial-gradient(ellipse 60% 50% at 100% 50%, hsla(43, 96%, 56%, 0.02) 0%, transparent 40%)
          `,
        }}
      />

      {/* Film grain texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.015] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise' x='0' y='0'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Slow rotating ambient orb - center */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-30"
        animate={{ rotate: 360 }}
        transition={{
          duration: 120,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <div
          className="w-full h-full"
          style={{
            background: `
              radial-gradient(ellipse 50% 30% at 30% 30%, hsla(43, 96%, 56%, 0.08) 0%, transparent 50%),
              radial-gradient(ellipse 40% 50% at 70% 60%, hsla(263, 70%, 76%, 0.06) 0%, transparent 50%)
            `,
          }}
        />
      </motion.div>

      {/* Floating amber particle - top */}
      <motion.div
        className="absolute top-[15%] left-[20%] w-2 h-2 rounded-full bg-amber-500/30"
        animate={{
          y: [0, -20, 0],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Floating violet particle - right */}
      <motion.div
        className="absolute top-[40%] right-[15%] w-1.5 h-1.5 rounded-full bg-violet-400/20"
        animate={{
          y: [0, 15, 0],
          x: [0, -10, 0],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
      />

      {/* Floating amber particle - bottom left */}
      <motion.div
        className="absolute bottom-[25%] left-[10%] w-1 h-1 rounded-full bg-amber-400/40"
        animate={{
          y: [0, -12, 0],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 4,
        }}
      />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(hsla(0, 0%, 100%, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, hsla(0, 0%, 100%, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px',
        }}
      />

      {/* Vignette effect */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 0%, hsla(240, 10%, 4%, 0.4) 100%)',
        }}
      />

      {/* Top edge gradient */}
      <div
        className="absolute top-0 left-0 right-0 h-32"
        style={{
          background: 'linear-gradient(to bottom, hsla(240, 10%, 4%, 0.8), transparent)',
        }}
      />

      {/* Subtle scan line effect - very subtle */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, hsla(0, 0%, 0%, 0.1) 2px, hsla(0, 0%, 0%, 0.1) 4px)',
        }}
      />
    </div>
  );
};
