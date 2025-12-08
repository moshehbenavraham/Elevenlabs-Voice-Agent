import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, AlertCircle } from 'lucide-react';
import { HeroSection } from '@/components/HeroSection';
import { VoiceButton } from '@/components/voice/VoiceButton';
import { VoiceStatus } from '@/components/voice/VoiceStatus';
import { VoiceVisualizer } from '@/components/voice/VoiceVisualizer';
import { BackgroundEffects } from '@/components/BackgroundEffects';
import { ParticleSystem } from '@/components/ParticleSystem';
import { VoiceEnvironment } from '@/components/VoiceEnvironment';
import { ConfigurationModal } from '@/components/ConfigurationModal';
import { useVoice } from '@/contexts/VoiceContext';
import { toast } from '@/hooks/use-toast';

/** Number of animated particles in the background effect */
const BACKGROUND_PARTICLE_COUNT = 60;

/** Number of frequency bars in the audio visualizer */
const VISUALIZER_BAR_COUNT = 40;

/** Primary accent color for the visualizer (purple) */
const VISUALIZER_COLOR = '#8b5cf6';

/** Voice environment intensity when connected (0-1 scale) */
const VOICE_ENVIRONMENT_INTENSITY = 0.7;

export const Index = () => {
  const { error, clearError, isLoading, connect, isConnected } = useVoice();
  const [showConfig, setShowConfig] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  // Check if agent ID is configured on mount
  useEffect(() => {
    const agentId = import.meta.env.VITE_ELEVENLABS_AGENT_ID;
    if (!agentId || agentId === 'your_agent_id_here') {
      setTimeout(() => setShowConfig(true), 1000);
    }
  }, []);

  // Handle connection success
  const handleConnect = () => {
    setHasStarted(true);
    toast({
      title: 'Voice Chat Connected',
      description: 'You can now speak with the AI agent',
    });
  };

  // Handle disconnection
  const handleDisconnect = () => {
    setHasStarted(false);
    toast({
      title: 'Voice Chat Disconnected',
      description: 'Connection has been closed',
    });
  };

  // Handle configuration errors
  const handleConfigError = () => {
    toast({
      title: 'Configuration Required',
      description: 'Please set your ElevenLabs Agent ID in the settings',
      variant: 'destructive',
    });
    setShowConfig(true);
  };

  // Handle HeroSection start conversation
  const handleStartConversation = async () => {
    if (!isConfigured) {
      handleConfigError();
      return;
    }

    try {
      const agentId = import.meta.env.VITE_ELEVENLABS_AGENT_ID;
      await connect(agentId);
      handleConnect();
    } catch {
      toast({
        title: 'Connection Failed',
        description: 'Please check your ElevenLabs configuration and internet connection',
        variant: 'destructive',
      });
    }
  };

  // Check for missing configuration
  const agentId = import.meta.env.VITE_ELEVENLABS_AGENT_ID;
  const isConfigured = agentId && agentId !== 'your_agent_id_here';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Visual Effects */}
      <BackgroundEffects />
      <ParticleSystem isActive={true} particleCount={BACKGROUND_PARTICLE_COUNT} />
      <VoiceEnvironment isActive={isConnected} intensity={VOICE_ENVIRONMENT_INTENSITY} />

      {/* Header */}
      <div className="fixed top-4 left-4 right-4 z-50 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h1 className="text-lg sm:text-xl font-bold text-white/90">Voice Agent</h1>
          {!isConfigured && <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />}
        </div>
        <button
          onClick={() => setShowConfig(true)}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          aria-label="Open settings"
        >
          <Settings className="w-5 h-5 text-white/70" />
        </button>
      </div>

      {/* Background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(124,58,237,0.05),transparent_50%)]" />

      {/* Main Content */}
      <div className="min-h-screen flex flex-col items-center justify-center px-4 pt-20">
        <AnimatePresence mode="wait">
          {!hasStarted ? (
            // Hero Section with rich content
            <HeroSection
              key="hero"
              onStartConversation={handleStartConversation}
              isLoading={isLoading}
              error={error}
            />
          ) : (
            // Voice Interface
            <motion.div
              key="interface"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-2xl space-y-6"
            >
              {/* Voice Control */}
              <div className="flex flex-col items-center space-y-6">
                <VoiceButton size="lg" onDisconnect={handleDisconnect} />

                {/* Audio Visualizer */}
                <VoiceVisualizer
                  className="w-full max-w-md"
                  barCount={VISUALIZER_BAR_COUNT}
                  color={VISUALIZER_COLOR}
                />
              </div>

              {/* Status and Messages */}
              <VoiceStatus />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Configuration Modal */}
      <ConfigurationModal isOpen={showConfig} onClose={() => setShowConfig(false)} />

      {/* Error Toast Handler */}
      {error && (
        <div className="fixed bottom-4 right-4 z-50">
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 max-w-sm"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-200 font-medium">Connection Error</p>
                <p className="text-red-200/80 text-sm mt-1">{error}</p>
                <button
                  onClick={clearError}
                  className="text-red-300 hover:text-red-200 text-sm mt-2 underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
