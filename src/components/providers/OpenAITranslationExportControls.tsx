import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OpenAITranslationExportControlsProps {
  readonly hasEntries: boolean;
  readonly onExportMarkdown: () => void | Promise<void>;
  readonly className?: string;
}

export function OpenAITranslationExportControls({
  hasEntries,
  onExportMarkdown,
  className,
}: OpenAITranslationExportControlsProps) {
  const mountedRef = useRef(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleExport = useCallback((): void => {
    if (!hasEntries || isExporting) {
      return;
    }

    const exportOperation = async (): Promise<void> => {
      setIsExporting(true);
      setExportError(null);
      setExportSuccess(false);

      try {
        await onExportMarkdown();
        if (mountedRef.current) {
          setExportSuccess(true);
        }
      } catch (error) {
        console.error('[OpenAITranslationExportControls] Markdown export failed', error);
        if (mountedRef.current) {
          setExportError('Transcript export failed.');
        }
      } finally {
        if (mountedRef.current) {
          setIsExporting(false);
        }
      }
    };

    void exportOperation();
  }, [hasEntries, isExporting, onExportMarkdown]);

  return (
    <section
      className={cn(
        'rounded-lg border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl sm:p-5',
        className
      )}
      aria-labelledby="openai-translation-export-heading"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <Download className="mt-1 h-5 w-5 flex-shrink-0 text-emerald-300" aria-hidden="true" />
          <div className="min-w-0">
            <h2
              id="openai-translation-export-heading"
              className="font-display text-xl text-zinc-100"
            >
              Export
            </h2>
            <p className="text-xs leading-5 text-zinc-500">
              {hasEntries ? 'Markdown transcript ready.' : 'No transcript lines to export.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleExport}
          disabled={!hasEntries || isExporting}
          aria-busy={isExporting}
          className={cn(
            'inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg px-3 py-2',
            'border border-emerald-500/25 bg-emerald-500/10 text-sm font-medium text-emerald-100',
            'transition-colors hover:bg-emerald-500/15',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-emerald-500/10'
          )}
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          {isExporting ? 'Exporting' : 'Export Markdown'}
        </button>
      </div>

      {hasEntries && exportError && (
        <p className="mt-3 flex items-center gap-2 text-sm text-red-300" role="alert">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          {exportError}
        </p>
      )}

      {hasEntries && exportSuccess && (
        <p className="mt-3 flex items-center gap-2 text-sm text-emerald-300" role="status">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          Transcript exported.
        </p>
      )}
    </section>
  );
}
