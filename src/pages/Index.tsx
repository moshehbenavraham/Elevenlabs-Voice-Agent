import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, AlertCircle, X } from 'lucide-react';
import { HeroSection } from '@/components/HeroSection';
import { VoiceButton } from '@/components/voice/VoiceButton';
import { VoiceStatus } from '@/components/voice/VoiceStatus';
import { VoiceVisualizer } from '@/components/voice/VoiceVisualizer';
import { VoiceWidget } from '@/components/voice/VoiceWidget';
import { BackgroundEffects } from '@/components/BackgroundEffects';
import { ConfigurationModal } from '@/components/ConfigurationModal';
import { ProviderTabs } from '@/components/tabs';
import { useVoice } from '@/contexts/VoiceContext';
import { useProvider } from '@/contexts/ProviderContext';
import { useConnectionMode } from '@/hooks/useConnectionMode';
import { toast } from '@/hooks/use-toast';
import { trackError } from '@/lib/errorTracking';
import type { ProviderType } from '@/types';

const DEBUG = import.meta.env.DEV;

function debugLog(context: string, message: string, data?: unknown) {
  if (DEBUG) {
    console.log(`[Index:${context}]`, message, data ?? '');
  }
}

export const Index = () => {
  const connectionMode = useConnectionMode();
  const { error, clearError, isLoading, connect, disconnect, isConnected } = useVoice();
  const { activeProvider } = useProvider();
  const [showConfig, setShowConfig] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  // Handle provider change - disconnect active connection before switching
  const handleProviderChange = useCallback(
    async (newProvider: ProviderType) => {
      debugLog('handleProviderChange', 'Switching provider', {
        from: activeProvider,
        to: newProvider,
      });

      // Disconnect active connection before switching providers
      if (isConnected) {
        debugLog('handleProviderChange', 'Disconnecting active connection before switch');
        await disconnect();
        setHasStarted(false);
        toast({
          title: 'Provider Changed',
          description: `Switched to ${newProvider}`,
        });
      }
    },
    [activeProvider, isConnected, disconnect]
  );

  // Check if agent ID is configured on mount
  useEffect(() => {
    const agentId = import.meta.env.VITE_ELEVENLABS_AGENT_ID;
    debugLog('mount', 'Checking configuration', {
      hasAgentId: !!agentId,
      isPlaceholder: agentId === 'your_agent_id_here',
      agentIdPreview: agentId ? agentId.substring(0, 8) + '...' : 'not set',
    });

    if (!agentId || agentId === 'your_agent_id_here') {
      debugLog('mount', 'Agent ID not configured, will show config modal');
      setTimeout(() => setShowConfig(true), 1000);
    }
  }, []);

  // Handle connection success
  const handleConnect = () => {
    setHasStarted(true);
    toast({
      title: 'Connected',
      description: 'Voice conversation is now active',
    });
  };

  // Handle disconnection
  const handleDisconnect = () => {
    toast({
      title: 'Disconnected',
      description: 'Voice conversation ended',
    });
  };

  // Handle configuration errors
  const handleConfigError = () => {
    toast({
      title: 'Configuration Required',
      description: 'Please set your ElevenLabs Agent ID',
      variant: 'destructive',
    });
    setShowConfig(true);
  };

  // Handle HeroSection start conversation
  const handleStartConversation = async () => {
    debugLog('handleStartConversation', 'Starting conversation...', { isConfigured });

    if (!isConfigured) {
      debugLog('handleStartConversation', 'Not configured, showing config modal');
      handleConfigError();
      return;
    }

    try {
      const agentId = import.meta.env.VITE_ELEVENLABS_AGENT_ID;
      debugLog('handleStartConversation', 'Connecting with agent', {
        agentId: agentId?.substring(0, 8) + '...',
      });

      await connect(agentId);
      debugLog('handleStartConversation', 'Connection successful');
      handleConnect();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      debugLog('handleStartConversation', 'Connection failed', { error: err });
      trackError('Index', 'Failed to start conversation', err);

      toast({
        title: 'Connection Failed',
        description: errorMessage || 'Please check your configuration',
        variant: 'destructive',
      });
    }
  };

  // Handle end call
  const handleEndCall = async () => {
    await disconnect();
    setHasStarted(false);
    handleDisconnect();
  };

  // Check for missing configuration
  const agentId = import.meta.env.VITE_ELEVENLABS_AGENT_ID;
  const isConfigured = agentId && agentId !== 'your_agent_id_here';

  // Widget mode - simplified UI with ElevenLabs widget
  if (connectionMode === 'widget') {
    return (
      <div className="min-h-screen bg-[#09090b] relative overflow-hidden film-grain">
        <BackgroundEffects />

        {/* Header - same as SDK mode */}
        <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            {/* Logo / Brand */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              {/* Logo mark */}
              <div className="relative w-8 h-8 flex items-center justify-center">
                <div className="absolute inset-0 rounded-lg bg-amber-500/10 border border-amber-500/20" />
                <motion.div
                  className="w-2 h-2 rounded-full bg-amber-400"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.8, 1, 0.8],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              </div>
              <span className="font-display text-lg text-zinc-200 tracking-tight">
                Voice<span className="text-amber-400">AI</span>
              </span>
            </motion.div>

            {/* Right side - Settings */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4"
            >
              {!isConfigured && (
                <div className="flex items-center gap-2 text-amber-400/70 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Setup required</span>
                </div>
              )}
              <button
                onClick={() => setShowConfig(true)}
                className="p-2 rounded-lg bg-zinc-900/50 border border-zinc-800/50 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-all duration-200"
                aria-label="Open settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        </header>

        {/* Provider Tabs - Below header */}
        <div className="fixed top-20 left-0 right-0 z-40 px-6">
          <div className="max-w-md mx-auto">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <ProviderTabs onProviderChange={handleProviderChange} />
            </motion.div>
          </div>
        </div>

        {/* Main Content - Widget Mode */}
        <main className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 pt-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="font-display text-5xl sm:text-6xl text-zinc-100 mb-4">
              Voice<span className="text-gradient">AI</span>
            </h1>
            <p className="text-zinc-400 text-lg max-w-md mx-auto">
              Click the orb below to start a conversation
            </p>
          </motion.div>

          {/* ElevenLabs Widget - positioned center */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          >
            <VoiceWidget className="relative z-20" />
          </motion.div>
        </main>

        {/* Configuration Modal */}
        <ConfigurationModal isOpen={showConfig} onClose={() => setShowConfig(false)} />

        {/* Footer accent */}
        <div className="fixed bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-800/50 to-transparent" />
      </div>
    );
  }

  // SDK mode - existing implementation
  return (
    <div className="min-h-screen bg-[#09090b] relative overflow-hidden film-grain">
      {/* Background Effects */}
      <BackgroundEffects />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Logo / Brand */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            {/* Logo mark */}
            <div className="relative w-8 h-8 flex items-center justify-center">
              <div className="absolute inset-0 rounded-lg bg-amber-500/10 border border-amber-500/20" />
              <motion.div
                className="w-2 h-2 rounded-full bg-amber-400"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.8, 1, 0.8],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </div>
            <span className="font-display text-lg text-zinc-200 tracking-tight">
              Voice<span className="text-amber-400">AI</span>
            </span>
          </motion.div>

          {/* Right side */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            {/* Config status */}
            {!isConfigured && (
              <div className="flex items-center gap-2 text-amber-400/70 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Setup required</span>
              </div>
            )}

            {/* Settings button */}
            <button
              onClick={() => setShowConfig(true)}
              className="p-2 rounded-lg bg-zinc-900/50 border border-zinc-800/50 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-all duration-200"
              aria-label="Open settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </header>

      {/* Provider Tabs - Below header */}
      <div className="fixed top-20 left-0 right-0 z-40 px-6">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <ProviderTabs onProviderChange={handleProviderChange} />
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 min-h-screen pt-12">
        <AnimatePresence mode="wait">
          {!hasStarted ? (
            // Hero Section - Landing state
            <HeroSection
              key="hero"
              onStartConversation={handleStartConversation}
              isLoading={isLoading}
              error={error}
            />
          ) : (
            // Voice Interface - Active call state
            <motion.div
              key="interface"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="min-h-screen flex flex-col"
            >
              {/* Voice interface content */}
              <div className="flex-1 flex flex-col items-center justify-center px-6 py-24">
                <div className="w-full max-w-lg space-y-12">
                  {/* Header text */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-center"
                  >
                    <h2 className="font-display text-3xl sm:text-4xl text-zinc-100 mb-2">
                      Conversation Active
                    </h2>
                    <p className="text-zinc-500 text-sm">Speak naturally - AI is listening</p>
                  </motion.div>

                  {/* Voice Button - Central element */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                    className="flex justify-center py-8"
                  >
                    <VoiceButton size="lg" onDisconnect={handleEndCall} />
                  </motion.div>

                  {/* Audio Visualizer */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <VoiceVisualizer className="w-full" />
                  </motion.div>

                  {/* Status and Messages */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <VoiceStatus />
                  </motion.div>

                  {/* End call button */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="flex justify-center pt-4"
                  >
                    <button
                      onClick={handleEndCall}
                      className="flex items-center gap-2 px-6 py-3 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-red-400 hover:border-red-500/30 transition-all duration-200"
                    >
                      <X className="w-4 h-4" />
                      <span className="text-sm">End conversation</span>
                    </button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Configuration Modal */}
      <ConfigurationModal isOpen={showConfig} onClose={() => setShowConfig(false)} />

      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 20, x: 20 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm"
          >
            <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-red-300 font-medium text-sm">Connection Error</p>
                  <p className="text-red-300/70 text-sm mt-1 break-words">{error}</p>
                  <button
                    onClick={clearError}
                    className="text-red-400 hover:text-red-300 text-xs mt-2 underline"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer accent line */}
      <div className="fixed bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-800/50 to-transparent" />
    </div>
  );
};
