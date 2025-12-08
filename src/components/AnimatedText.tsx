import type { FC } from 'react';
import { motion, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedTextProps {
  children: string;
  className?: string;
  variant?: 'reveal' | 'breathing' | 'gradient';
  delay?: number;
  duration?: number;
}

const textRevealVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.6,
      ease: 'easeOut',
    },
  }),
};

const breathingVariants: Variants = {
  breathing: {
    scale: [1, 1.02, 1],
    opacity: [0.8, 1, 0.8],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

const gradientVariants: Variants = {
  animate: {
    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

export const AnimatedText: FC<AnimatedTextProps> = ({
  children,
  className = '',
  variant = 'reveal',
  delay = 0,
}) => {
  if (variant === 'reveal') {
    const words = children.split(' ');

    return (
      <motion.div
        className={cn('inline-block', className)}
        initial="hidden"
        animate="visible"
        transition={{ staggerChildren: 0.05, delayChildren: delay }}
      >
        {words.map((word, i) => (
          <motion.span
            key={i}
            className="inline-block mr-1"
            custom={i}
            variants={textRevealVariants}
          >
            {word}
          </motion.span>
        ))}
      </motion.div>
    );
  }

  if (variant === 'breathing') {
    return (
      <motion.div
        className={cn('inline-block', className)}
        variants={breathingVariants}
        animate="breathing"
        style={{ originX: 0.5, originY: 0.5 }}
      >
        {children}
      </motion.div>
    );
  }

  if (variant === 'gradient') {
    return (
      <motion.div
        className={cn(
          'inline-block bg-clip-text text-transparent',
          'bg-gradient-to-r from-primary via-secondary to-primary',
          className
        )}
        variants={gradientVariants}
        animate="animate"
        style={{
          backgroundSize: '200% 100%',
        }}
      >
        {children}
      </motion.div>
    );
  }

  return <span className={className}>{children}</span>;
};
