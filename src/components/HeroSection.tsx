
import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Zap, MessageCircle, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeroSectionProps {
  onStartConversation: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ 
  onStartConversation, 
  isLoading, 
  error 
}) => {
  const features = [
    {
      icon: MessageCircle,
      title: 'Natural Conversation',
      description: 'Talk naturally with advanced AI that understands context and nuance',
    },
    {
      icon: Zap,
      title: 'Real-time Response',
      description: 'Experience lightning-fast AI responses with minimal latency',
    },
    {
      icon: Sparkles,
      title: 'Voice Intelligence',
      description: 'Powered by ElevenLabs for the most natural voice interactions',
    },
  ];

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 grid-bg">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-pink-900/20" />
      
      {/* Hero Content */}
      <motion.div
        className="relative z-10 text-center max-w-4xl mx-auto"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        {/* Main Heading */}
        <motion.h1
          className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <span className="gradient-text">Voice AI</span>
          <br />
          <span className="text-white">Conversation</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-xl md:text-2xl text-white/80 mb-12 max-w-2xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          Experience the future of AI interaction with real-time voice conversations 
          that feel natural and intelligent.
        </motion.p>

        {/* Feature Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="glass p-6 rounded-2xl hover:scale-105 transition-all duration-300 hover:shadow-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 + index * 0.2 }}
              whileHover={{ scale: 1.02 }}
            >
              <feature.icon className="w-8 h-8 gradient-text mb-4 mx-auto" />
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-white/70 text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Section */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <p className="text-white/60 text-sm mb-6">
            Start your voice conversation now
          </p>
          
          <Button
            onClick={onStartConversation}
            disabled={isLoading}
            className="glass hover:bg-white/10 text-white border-white/20 px-8 py-4 h-auto text-lg font-semibold rounded-full transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            size="lg"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Connecting...
              </>
            ) : (
              <>
                <Mic className="w-5 h-5 mr-2" />
                Start Voice Chat
              </>
            )}
          </Button>
          
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}
          
          {!isLoading && !error && (
            <motion.div 
              className="flex flex-col items-center gap-2 mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4 }}
            >
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-green-400 text-sm font-medium">Ready to connect</span>
              </div>
              <p className="text-white/40 text-xs">
                {import.meta.env.VITE_ELEVENLABS_AGENT_ID && import.meta.env.VITE_ELEVENLABS_AGENT_ID !== 'your_agent_id_here' 
                  ? 'Agent configured' 
                  : 'Configure agent in settings'}
              </p>
            </motion.div>
          )}
        </motion.div>
      </motion.div>

      {/* Floating Elements */}
      <motion.div
        className="absolute top-20 left-10 w-20 h-20 bg-purple-500/10 rounded-full blur-xl"
        animate={{
          y: [0, -20, 0],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute bottom-32 right-16 w-32 h-32 bg-pink-500/10 rounded-full blur-xl"
        animate={{
          y: [0, 20, 0],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
      />
    </div>
  );
};
