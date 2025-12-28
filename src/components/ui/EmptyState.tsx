import { motion } from 'framer-motion';
import { AlertCircle, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  /** Provider name to display */
  provider: string;
  /** Configuration item that is missing */
  missingConfig: string;
  /** Instructions for how to fix */
  instructions?: string;
  /** Callback when settings button is clicked */
  onOpenSettings?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Empty state component for unconfigured providers
 * Displays a "Setup Required" message with glassmorphism styling
 */
export function EmptyState({
  provider,
  missingConfig,
  instructions = 'Please configure the required settings to use this provider.',
  onOpenSettings,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'flex flex-col items-center justify-center p-8 rounded-xl',
        'bg-zinc-900/50 backdrop-blur-lg border border-zinc-800/50',
        'text-center min-h-[300px]',
        className
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'flex items-center justify-center w-16 h-16 rounded-full mb-6',
          'bg-amber-500/10 border border-amber-500/20'
        )}
      >
        <AlertCircle className="w-8 h-8 text-amber-400" />
      </div>

      {/* Title */}
      <h3 className="font-display text-xl text-zinc-100 mb-2">Setup Required</h3>

      {/* Provider name */}
      <p className="text-zinc-400 mb-4">{provider} is not configured</p>

      {/* Missing config */}
      <div className="px-4 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50 mb-4">
        <code className="text-sm text-amber-400/80 font-mono">{missingConfig}</code>
      </div>

      {/* Instructions */}
      <p className="text-zinc-500 text-sm max-w-md mb-6">{instructions}</p>

      {/* Settings button */}
      {onOpenSettings && (
        <button
          onClick={onOpenSettings}
          className={cn(
            'flex items-center gap-2 px-6 py-3 rounded-lg',
            'bg-amber-500/10 border border-amber-500/30',
            'text-amber-400 hover:text-amber-300 hover:bg-amber-500/20',
            'transition-all duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50'
          )}
        >
          <Settings className="w-4 h-4" />
          <span className="text-sm font-medium">Open Settings</span>
        </button>
      )}
    </motion.div>
  );
}

export default EmptyState;
