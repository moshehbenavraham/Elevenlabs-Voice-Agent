import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, WifiOff, Mic, Settings, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorDisplayProps {
  error: string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  onOpenSettings?: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ 
  error, 
  onRetry, 
  onDismiss,
  onOpenSettings 
}) => {
  if (!error) return null;

  // Determine error type and provide specific guidance
  const getErrorDetails = () => {
    if (error.includes('agent') || error.includes('configuration')) {
      return {
        icon: Settings,
        title: 'Configuration Error',
        description: 'Your ElevenLabs Agent ID is not properly configured.',
        action: 'Open Settings',
        onAction: onOpenSettings,
        color: 'yellow',
      };
    } else if (error.includes('network') || error.includes('connection')) {
      return {
        icon: WifiOff,
        title: 'Connection Error',
        description: 'Unable to connect to ElevenLabs. Please check your internet connection.',
        action: 'Retry',
        onAction: onRetry,
        color: 'red',
      };
    } else if (error.includes('microphone') || error.includes('permission')) {
      return {
        icon: Mic,
        title: 'Microphone Access',
        description: 'Please allow microphone access to use voice chat.',
        action: 'Request Access',
        onAction: onRetry,
        color: 'orange',
      };
    } else {
      return {
        icon: AlertCircle,
        title: 'Error',
        description: error,
        action: 'Retry',
        onAction: onRetry,
        color: 'red',
      };
    }
  };

  const errorDetails = getErrorDetails();
  const Icon = errorDetails.icon;
  const colorClasses = {
    red: 'border-red-500/50 bg-red-500/10 text-red-400',
    yellow: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400',
    orange: 'border-orange-500/50 bg-orange-500/10 text-orange-400',
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:max-w-md z-50"
      >
        <div className={`glass-enhanced p-4 rounded-xl border ${colorClasses[errorDetails.color]}`}>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <Icon className="w-5 h-5 mt-0.5" />
            </div>
            
            <div className="flex-1 space-y-1">
              <h3 className="font-medium text-white">{errorDetails.title}</h3>
              <p className="text-sm text-white/70">{errorDetails.description}</p>
              
              <div className="flex items-center gap-2 mt-3">
                {errorDetails.onAction && (
                  <Button
                    size="sm"
                    onClick={errorDetails.onAction}
                    className="glass hover:bg-white/10 text-white border-white/20"
                  >
                    {errorDetails.action}
                  </Button>
                )}
                
                {onDismiss && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onDismiss}
                    className="text-white/60 hover:text-white hover:bg-white/10"
                  >
                    Dismiss
                  </Button>
                )}
              </div>
            </div>
            
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="flex-shrink-0 text-white/40 hover:text-white/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};