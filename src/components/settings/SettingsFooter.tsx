import type { FC } from 'react';
import { RotateCcw } from 'lucide-react';

interface SettingsFooterProps {
  onReset: () => void;
  onClose: () => void;
  hasChanges?: boolean;
}

/**
 * Footer component for the settings dialog
 * Contains reset and close actions
 */
export const SettingsFooter: FC<SettingsFooterProps> = ({
  onReset,
  onClose,
  hasChanges = false,
}) => {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800/50 bg-zinc-900/50">
      <button
        onClick={onReset}
        className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors rounded-lg hover:bg-zinc-800/50"
        type="button"
      >
        <RotateCcw className="w-4 h-4" />
        <span>Reset to defaults</span>
      </button>

      <button
        onClick={onClose}
        className="px-6 py-2.5 rounded-lg bg-amber-500 text-zinc-900 font-medium hover:bg-amber-400 transition-colors text-sm"
        type="button"
      >
        {hasChanges ? 'Save & Close' : 'Close'}
      </button>
    </div>
  );
};

export default SettingsFooter;
