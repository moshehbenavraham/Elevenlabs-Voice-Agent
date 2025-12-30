import type { FC } from 'react';
import { CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error' | 'reconnecting';

interface ProviderStatus {
  name: string;
  status: ConnectionStatus;
  enabled: boolean;
}

interface ConnectionDiagnosticsProps {
  providers: ProviderStatus[];
  className?: string;
}

/**
 * Displays connection status for all voice providers
 */
export const ConnectionDiagnostics: FC<ConnectionDiagnosticsProps> = ({ providers, className }) => {
  return (
    <div className={cn('space-y-3', className)}>
      <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
        Connection Status
      </h3>
      <div className="space-y-2">
        {providers.map((provider) => (
          <ProviderStatusRow key={provider.name} {...provider} />
        ))}
      </div>
    </div>
  );
};

function ProviderStatusRow({ name, status, enabled }: ProviderStatus) {
  if (!enabled) {
    return (
      <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-zinc-800/30">
        <span className="text-sm text-zinc-500">{name}</span>
        <span className="text-xs text-zinc-600">Disabled</span>
      </div>
    );
  }

  const statusConfig = getStatusConfig(status);

  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-zinc-800/50">
      <span className="text-sm text-zinc-200">{name}</span>
      <div className="flex items-center gap-2">
        <statusConfig.icon
          className={cn('w-4 h-4', statusConfig.iconClass, statusConfig.animate && 'animate-spin')}
        />
        <span className={cn('text-xs', statusConfig.textClass)}>{statusConfig.label}</span>
      </div>
    </div>
  );
}

function getStatusConfig(status: ConnectionStatus) {
  switch (status) {
    case 'connected':
      return {
        icon: CheckCircle2,
        iconClass: 'text-emerald-400',
        textClass: 'text-emerald-400',
        label: 'Connected',
        animate: false,
      };
    case 'connecting':
      return {
        icon: Loader2,
        iconClass: 'text-amber-400',
        textClass: 'text-amber-400',
        label: 'Connecting...',
        animate: true,
      };
    case 'reconnecting':
      return {
        icon: Loader2,
        iconClass: 'text-amber-400',
        textClass: 'text-amber-400',
        label: 'Reconnecting...',
        animate: true,
      };
    case 'error':
      return {
        icon: AlertCircle,
        iconClass: 'text-red-400',
        textClass: 'text-red-400',
        label: 'Error',
        animate: false,
      };
    case 'disconnected':
    default:
      return {
        icon: XCircle,
        iconClass: 'text-zinc-500',
        textClass: 'text-zinc-500',
        label: 'Disconnected',
        animate: false,
      };
  }
}

export default ConnectionDiagnostics;
