import { useState, useRef, useCallback, useLayoutEffect, type FC } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Settings, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SettingsFooter } from './SettingsFooter';
import { ConnectionDiagnostics } from './ConnectionDiagnostics';
import { ProviderSettingsPanel, ProviderTabContent } from './ProviderSettingsPanel';
import { OpenAISettingsTab } from './OpenAISettingsTab';
import { XAISettingsTab } from './XAISettingsTab';
import { ElevenLabsSettingsTab } from './ElevenLabsSettingsTab';
import {
  loadSettings,
  resetAllSettings,
  getDefaultSettings,
  type VoiceAgentSettings,
} from '@/lib/settingsStorage';

// Environment flags for enabled providers
const ELEVENLABS_ENABLED =
  import.meta.env.VITE_ELEVENLABS_ENABLED === 'true' ||
  import.meta.env.VITE_ELEVENLABS_SDK_ENABLED === 'true';
const OPENAI_ENABLED = import.meta.env.VITE_OPENAI_ENABLED === 'true';
const XAI_ENABLED = import.meta.env.VITE_XAI_ENABLED === 'true';

interface ConfigurationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  // Connection status from contexts
  elevenLabsStatus?: 'connected' | 'disconnected' | 'connecting' | 'error';
  openAIStatus?: 'connected' | 'disconnected' | 'connecting' | 'error' | 'reconnecting';
  xaiStatus?: 'connected' | 'disconnected' | 'connecting' | 'error' | 'reconnecting';
}

/**
 * Unified configuration dialog for all voice providers
 * Uses Radix UI Dialog with proper accessibility
 */
export const ConfigurationDialog: FC<ConfigurationDialogProps> = ({
  isOpen,
  onClose,
  elevenLabsStatus = 'disconnected',
  openAIStatus = 'disconnected',
  xaiStatus = 'disconnected',
}) => {
  // Determine initial active tab based on enabled providers
  const getInitialTab = () => {
    if (ELEVENLABS_ENABLED) return 'elevenlabs';
    if (OPENAI_ENABLED) return 'openai';
    if (XAI_ENABLED) return 'xai';
    return 'elevenlabs';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  // Track previous open state to detect when dialog opens
  const wasOpenRef = useRef(isOpen);
  // Load settings initially and reload when dialog re-opens
  const [settings, setSettings] = useState<VoiceAgentSettings>(() =>
    isOpen ? loadSettings() : getDefaultSettings()
  );
  const [hasChanges, setHasChanges] = useState(false);

  // Reload settings when dialog transitions from closed to open
  // This is intentional - we want to load fresh settings when dialog opens
  useLayoutEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      const freshSettings = loadSettings();
      setSettings(freshSettings);

      setHasChanges(false);
    }
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  // Handle reset to defaults
  const handleReset = useCallback(() => {
    const defaults = resetAllSettings();
    setSettings(defaults);
    setHasChanges(true);
  }, []);

  // Handle close
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // Provider tabs configuration
  const tabs = [
    { id: 'elevenlabs', label: 'ElevenLabs', enabled: ELEVENLABS_ENABLED, accentColor: 'amber' },
    { id: 'openai', label: 'OpenAI', enabled: OPENAI_ENABLED, accentColor: 'violet' },
    { id: 'xai', label: 'xAI', enabled: XAI_ENABLED, accentColor: 'sky' },
  ];

  // Connection status for diagnostics
  const providerStatuses = [
    { name: 'ElevenLabs', status: elevenLabsStatus, enabled: ELEVENLABS_ENABLED },
    { name: 'OpenAI', status: openAIStatus, enabled: OPENAI_ENABLED },
    { name: 'xAI (Grok)', status: xaiStatus, enabled: XAI_ENABLED },
  ];

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* Content */}
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50',
            'w-full max-w-lg mx-4',
            'bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl',
            'flex flex-col max-h-[90vh]',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
            'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
            'duration-200'
          )}
          aria-describedby={undefined}
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-zinc-800/50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <Settings className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <Dialog.Title className="font-display text-lg text-zinc-100">Settings</Dialog.Title>
                <Dialog.Description className="text-xs text-zinc-500">
                  Configure voice providers
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <button
                className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors"
                aria-label="Close settings"
              >
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Provider Settings Tabs */}
            <ProviderSettingsPanel activeTab={activeTab} onTabChange={setActiveTab} tabs={tabs}>
              <ProviderTabContent value="elevenlabs">
                <ElevenLabsSettingsTab />
              </ProviderTabContent>

              <ProviderTabContent value="openai">
                {settings && (
                  <OpenAISettingsTab
                    settings={settings.openai}
                    onSettingsChange={(updates) => {
                      setSettings((prev) =>
                        prev
                          ? {
                              ...prev,
                              openai: { ...prev.openai, ...updates },
                            }
                          : prev
                      );
                      setHasChanges(true);
                    }}
                  />
                )}
              </ProviderTabContent>

              <ProviderTabContent value="xai">
                {settings && (
                  <XAISettingsTab
                    settings={settings.xai}
                    onSettingsChange={(updates) => {
                      setSettings((prev) =>
                        prev
                          ? {
                              ...prev,
                              xai: { ...prev.xai, ...updates },
                            }
                          : prev
                      );
                      setHasChanges(true);
                    }}
                  />
                )}
              </ProviderTabContent>
            </ProviderSettingsPanel>

            {/* Connection Diagnostics */}
            <ConnectionDiagnostics providers={providerStatuses} />
          </div>

          {/* Footer */}
          <SettingsFooter onReset={handleReset} onClose={handleClose} hasChanges={hasChanges} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default ConfigurationDialog;
