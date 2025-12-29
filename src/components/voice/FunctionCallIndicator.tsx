import { motion, useReducedMotion } from 'framer-motion';
import { Loader2, CheckCircle, XCircle, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FunctionCall, FunctionCallStatus } from '@/types';

interface FunctionCallIndicatorProps {
  functionCall: FunctionCall;
  className?: string;
}

/**
 * Visual indicator for function call execution status
 */
export function FunctionCallIndicator({ functionCall, className }: FunctionCallIndicatorProps) {
  const shouldReduceMotion = useReducedMotion();

  const statusConfig: Record<
    FunctionCallStatus,
    { icon: React.ReactNode; color: string; label: string }
  > = {
    pending: {
      icon: <Zap className="w-4 h-4" />,
      color: 'text-yellow-400',
      label: 'Preparing function...',
    },
    executing: {
      icon: <Loader2 className="w-4 h-4 animate-spin" />,
      color: 'text-blue-400',
      label: `Executing ${functionCall.name}...`,
    },
    completed: {
      icon: <CheckCircle className="w-4 h-4" />,
      color: 'text-green-400',
      label: 'Completed',
    },
    error: {
      icon: <XCircle className="w-4 h-4" />,
      color: 'text-red-400',
      label: 'Failed',
    },
  };

  const config = statusConfig[functionCall.status];

  const variants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
  };

  return (
    <motion.div
      data-testid="function-call-indicator"
      data-status={functionCall.status}
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full',
        'bg-white/10 backdrop-blur-sm',
        'text-xs font-medium',
        className
      )}
      initial={shouldReduceMotion ? 'visible' : 'hidden'}
      animate="visible"
      variants={variants}
      transition={{ duration: 0.15 }}
      role="status"
      aria-live="polite"
    >
      <span className={cn('flex-shrink-0', config.color)} aria-hidden="true">
        {config.icon}
      </span>
      <span className="text-white/80">{config.label}</span>
    </motion.div>
  );
}
