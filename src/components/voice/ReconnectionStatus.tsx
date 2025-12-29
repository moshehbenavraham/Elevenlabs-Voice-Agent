import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, WifiOff, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReconnectionStatus as ReconnectionStatusType } from '@/hooks/useReconnection';

interface ReconnectionStatusProps {
  status: ReconnectionStatusType;
  attempt: number;
  maxAttempts: number;
  countdown: number;
  isOnline: boolean;
  onManualReconnect: () => void;
  className?: string;
}

export function ReconnectionStatus({
  status,
  attempt,
  maxAttempts,
  countdown,
  isOnline,
  onManualReconnect,
  className,
}: ReconnectionStatusProps) {
  // Only show when there's something to display
  const shouldShow =
    status === 'reconnecting' || status === 'max_retries' || status === 'disconnected' || !isOnline;

  if (!shouldShow) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        data-testid="reconnection-status"
        data-status={status}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={cn(
          'rounded-lg border backdrop-blur-sm transition-all duration-300',
          {
            'border-amber-500/30 bg-amber-500/5': status === 'reconnecting',
            'border-red-500/30 bg-red-500/5': status === 'max_retries',
            'border-zinc-700/50 bg-zinc-800/50': status === 'disconnected' && !isOnline,
          },
          className
        )}
      >
        {/* Network offline indicator */}
        {!isOnline && (
          <div className="flex items-center gap-3 px-4 py-3">
            <WifiOff className="w-4 h-4 text-zinc-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-zinc-300">No internet connection</p>
              <p className="text-xs text-zinc-500">Reconnection will resume when online</p>
            </div>
          </div>
        )}

        {/* Reconnecting state with countdown */}
        {isOnline && status === 'reconnecting' && (
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="relative">
              <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-amber-300">Reconnecting...</p>
                <span className="text-xs font-mono text-amber-400/70">
                  Attempt {attempt + 1}/{maxAttempts}
                </span>
              </div>
              {countdown > 0 && (
                <p className="text-xs text-amber-400/60">
                  Retrying in {countdown} second{countdown !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Max retries exceeded - show manual reconnect button */}
        {isOnline && status === 'max_retries' && (
          <div className="px-4 py-3 space-y-3">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-300">Connection failed</p>
                <p className="text-xs text-red-400/60">
                  Maximum reconnection attempts ({maxAttempts}) exceeded
                </p>
              </div>
            </div>
            <button
              onClick={onManualReconnect}
              data-testid="reconnection-retry-button"
              className={cn(
                'w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg',
                'bg-red-500/10 hover:bg-red-500/20 border border-red-500/30',
                'text-sm font-medium text-red-300 hover:text-red-200',
                'transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-red-500/50'
              )}
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        )}

        {/* Disconnected state (online but not reconnecting) */}
        {isOnline && status === 'disconnected' && (
          <div className="flex items-center gap-3 px-4 py-3">
            <WifiOff className="w-4 h-4 text-zinc-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-zinc-300">Disconnected</p>
              <p className="text-xs text-zinc-500">Preparing to reconnect...</p>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export default ReconnectionStatus;
