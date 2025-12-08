import type { FC, ReactNode } from 'react';
import { motion, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

interface EnhancedButtonProps {
  children: ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  anticipation?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

const buttonVariants: Variants = {
  idle: {
    scale: 1,
    y: 0,
    boxShadow: '0 4px 14px 0 rgba(124, 58, 237, 0.25)',
  },
  hover: {
    scale: 1.02,
    y: -2,
    boxShadow: '0 8px 24px 0 rgba(124, 58, 237, 0.4)',
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 17,
    },
  },
  tap: {
    scale: 0.98,
    y: 0,
    boxShadow: '0 2px 8px 0 rgba(124, 58, 237, 0.3)',
    transition: {
      type: 'spring',
      stiffness: 600,
      damping: 20,
    },
  },
  anticipation: {
    scale: [1, 1.01, 1],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

const rippleVariants: Variants = {
  idle: { scale: 0, opacity: 0 },
  tap: {
    scale: 4,
    opacity: [0.5, 0],
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
};

export const EnhancedButton: FC<EnhancedButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  anticipation = false,
  disabled = false,
  onClick,
}) => {
  const baseClasses = cn(
    'relative inline-flex items-center justify-center rounded-full font-medium',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
    'transition-colors duration-200 overflow-hidden',
    {
      'px-6 py-3 text-sm': size === 'sm',
      'px-8 py-3 text-base': size === 'md',
      'px-10 py-4 text-lg': size === 'lg',
      'gradient-primary text-white': variant === 'primary',
      'glass-enhanced text-white': variant === 'secondary',
      'bg-transparent text-white hover:bg-white/10': variant === 'ghost',
      'opacity-50 cursor-not-allowed': disabled || isLoading,
    },
    className
  );

  return (
    <motion.button
      className={baseClasses}
      variants={buttonVariants}
      initial="idle"
      whileHover={!disabled && !isLoading ? 'hover' : 'idle'}
      whileTap={!disabled && !isLoading ? 'tap' : 'idle'}
      animate={anticipation && !disabled && !isLoading ? 'anticipation' : 'idle'}
      disabled={disabled || isLoading}
      onClick={onClick}
    >
      {/* Ripple Effect */}
      <motion.div
        className="absolute inset-0 rounded-full bg-white/20"
        variants={rippleVariants}
        initial="idle"
        whileTap="tap"
      />

      {/* Loading Spinner */}
      {isLoading && (
        <motion.div
          className="mr-2 w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      )}

      {/* Button Content */}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
};
