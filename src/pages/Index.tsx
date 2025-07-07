
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { HeroSection } from '@/components/HeroSection';
import { VoiceOrb } from '@/components/VoiceOrb';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useElevenLabsConversation } from '@/hooks/useElevenLabsConversation';
import { toast } from '@/hooks/use-toast';

const Index = () => {
  const {
    isConnected,
    isLoading,
    isSpeaking,
    error,
    messages,
    startConversation,
    endConversation,
  } = useElevenLabsConversation();

  const [hasStarted, setHasStarted] = useState(false);

  const handleToggleConnection = async () => {
    if (isConnected) {
      await endConversation();
      setHasStarted(false);
    } else {
      try {
        // Your ElevenLabs Agent ID
        const agentId = 'agent_01jvvymdfgf6pa6ks0435a9xr3';
        await startConversation(agentId);
        setHasStarted(true);
        
        toast({
          title: "Voice Chat Started",
          description: "You can now speak with the AI agent",
        });
      } catch (err) {
        toast({
          title: "Connection Failed",
          description: "Please check your ElevenLabs configuration",
          variant: "destructive",
        });
      }
    }
  };

  const handleEndConversation = async () => {
    await endConversation();
    setHasStarted(false);
    toast({
      title: "Conversation Ended",
      description: "Voice chat has been disconnected",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <ThemeToggle />
      
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(124,58,237,0.05),transparent_50%)]" />
      
      {!hasStarted ? (
        <HeroSection 
          onStartConversation={handleToggleConnection}
          isLoading={isLoading}
          error={error}
        />
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="min-h-screen flex flex-col items-center justify-center px-4"
        >
          <VoiceOrb
            isConnected={isConnected}
            isLoading={isLoading}
            isSpeaking={isSpeaking}
            onToggleConnection={handleToggleConnection}
            onEndConversation={handleEndConversation}
          />
          
          {/* Conversation Transcript */}
          {messages.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 max-w-2xl w-full"
            >
              <div className="glass p-6 rounded-2xl max-h-60 overflow-y-auto">
                <h3 className="text-white font-semibold mb-4">Conversation</h3>
                <div className="space-y-3" aria-live="polite">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-purple-500/20 ml-4'
                          : 'bg-pink-500/20 mr-4'
                      }`}
                    >
                      <p className="text-white/90 text-sm">{message.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:max-w-md"
        >
          <div className="glass p-4 rounded-lg border-red-500/50 bg-red-500/10">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Index;
