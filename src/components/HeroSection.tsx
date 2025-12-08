import type { FC } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface HeroSectionProps {
  onStartConversation: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export const HeroSection: FC<HeroSectionProps> = ({ onStartConversation, isLoading, error }) => {
  return (
    <motion.div
      className="relative min-h-screen w-full flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Ambient gradient - bottom glow */}
      <div className="fixed inset-0 gradient-noir pointer-events-none" />

      {/* Main content container */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-8 lg:px-16 py-20 relative z-10">
        {/* Upper section - dramatic typography */}
        <div className="max-w-6xl mx-auto w-full">
          {/* Overline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8"
          >
            <span className="font-mono text-xs tracking-[0.3em] uppercase text-amber-400/80">
              Voice Intelligence
            </span>
          </motion.div>

          {/* Main headline - Elegant serif */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl leading-tight tracking-tight mb-8 overflow-visible"
          >
            <span className="text-gradient-subtle block">Speak with</span>
            <span className="text-gradient glow-text block mt-2 pb-2">Intelligence</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="font-body text-lg sm:text-xl text-zinc-400 max-w-xl leading-relaxed mb-12"
          >
            Experience conversations that feel alive. Advanced voice AI that listens, understands,
            and responds with remarkable natural fluency.
          </motion.p>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="flex flex-col sm:flex-row items-start gap-6"
          >
            {/* Primary CTA */}
            <button
              onClick={onStartConversation}
              disabled={isLoading}
              className="group relative overflow-hidden"
            >
              <div className="relative flex items-center gap-4 px-8 py-4 bg-amber-500 text-zinc-900 font-medium rounded-full transition-all duration-300 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed">
                {isLoading ? (
                  <>
                    <motion.div
                      className="w-5 h-5 border-2 border-zinc-900/30 border-t-zinc-900 rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <span>Begin Conversation</span>
                    <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </>
                )}
              </div>

              {/* Glow effect on hover */}
              <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 glow-amber-intense pointer-events-none" />
            </button>

            {/* Status indicator */}
            <div className="flex items-center gap-3 py-4">
              <div className="relative">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-500 animate-ping opacity-75" />
              </div>
              <span className="text-sm text-zinc-500 font-mono">
                {import.meta.env.VITE_ELEVENLABS_AGENT_ID &&
                import.meta.env.VITE_ELEVENLABS_AGENT_ID !== 'your_agent_id_here'
                  ? 'Agent ready'
                  : 'Configure agent'}
              </span>
            </div>
          </motion.div>

          {/* Error state */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm max-w-md"
            >
              {error}
            </motion.div>
          )}
        </div>
      </div>

      {/* Bottom decorative elements */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent"
      />

      {/* Floating accent orb - top right */}
      <motion.div
        className="absolute top-1/4 right-[10%] w-64 h-64 rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at center, hsla(43, 96%, 56%, 0.08) 0%, transparent 70%)',
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Floating accent orb - bottom left */}
      <motion.div
        className="absolute bottom-1/4 left-[5%] w-48 h-48 rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at center, hsla(263, 70%, 76%, 0.06) 0%, transparent 70%)',
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
      />

      {/* Decorative line element */}
      <motion.div
        className="absolute right-8 top-1/3 bottom-1/3 w-px hidden lg:block"
        style={{
          background:
            'linear-gradient(to bottom, transparent, hsla(43, 96%, 56%, 0.3), transparent)',
        }}
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 1.2, delay: 0.8 }}
      />

      {/* Sound wave decorative element */}
      <motion.div
        className="absolute bottom-20 right-16 hidden lg:flex items-center gap-1 opacity-30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ duration: 1, delay: 1.2 }}
      >
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="w-1 bg-amber-500/50 rounded-full"
            animate={{
              height: [12, 24 + i * 8, 12],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.1,
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
};
