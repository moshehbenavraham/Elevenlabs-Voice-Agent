import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useVoice } from '@/contexts/VoiceContext';
import { cn } from '@/lib/utils';

interface VoiceVisualizerProps {
  className?: string;
  width?: number;
  height?: number;
  barCount?: number;
  color?: string;
  responsive?: boolean;
}

export function VoiceVisualizer({ 
  className,
  width = 300,
  height = 100,
  barCount = 32,
  color = '#8b5cf6',
  responsive = true
}: VoiceVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const analyserRef = useRef<AnalyserNode>();
  const dataArrayRef = useRef<Uint8Array>();
  const [isActive, setIsActive] = useState(false);
  
  const { audioStream, isConnected, isSpeaking } = useVoice();

  // Initialize audio analysis
  useEffect(() => {
    if (!audioStream || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const canvasContext = canvas.getContext('2d');
    if (!canvasContext) return;

    try {
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(audioStream);
      const analyser = audioContext.createAnalyser();
      
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      
      analyserRef.current = analyser;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
      
      setIsActive(true);
      
      return () => {
        source.disconnect();
        audioContext.close();
        setIsActive(false);
      };
    } catch (error) {
      console.error('Failed to initialize audio visualization:', error);
      setIsActive(false);
    }
  }, [audioStream]);

  // Animation loop
  useEffect(() => {
    if (!isActive || !canvasRef.current || !analyserRef.current || !dataArrayRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const canvasContext = canvas.getContext('2d');
    if (!canvasContext) return;

    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;

    const animate = () => {
      if (!isActive) return;

      analyser.getByteFrequencyData(dataArray);
      
      // Clear canvas
      canvasContext.clearRect(0, 0, canvas.width, canvas.height);
      
      // Calculate bar dimensions
      const barWidth = canvas.width / barCount;
      const barSpacing = barWidth * 0.1;
      const effectiveBarWidth = barWidth - barSpacing;
      
      // Draw frequency bars
      for (let i = 0; i < barCount; i++) {
        // Map frequency data to bar index
        const dataIndex = Math.floor((i / barCount) * dataArray.length);
        const barHeight = (dataArray[dataIndex] / 255) * canvas.height;
        
        // Calculate position
        const x = i * barWidth + barSpacing / 2;
        const y = canvas.height - barHeight;
        
        // Create gradient
        const gradient = canvasContext.createLinearGradient(0, y, 0, canvas.height);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, color + '40'); // Add transparency
        
        canvasContext.fillStyle = gradient;
        canvasContext.fillRect(x, y, effectiveBarWidth, barHeight);
        
        // Add glow effect when speaking
        if (isSpeaking && barHeight > 10) {
          canvasContext.shadowColor = color;
          canvasContext.shadowBlur = 10;
          canvasContext.fillRect(x, y, effectiveBarWidth, barHeight);
          canvasContext.shadowBlur = 0;
        }
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, barCount, color, isSpeaking]);

  // Fallback visualization when no audio stream
  useEffect(() => {
    if (isActive || !canvasRef.current || !isConnected) return;

    const canvas = canvasRef.current;
    const canvasContext = canvas.getContext('2d');
    if (!canvasContext) return;

    const animateFallback = () => {
      if (isActive) return;

      canvasContext.clearRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = canvas.width / barCount;
      const barSpacing = barWidth * 0.1;
      const effectiveBarWidth = barWidth - barSpacing;
      
      for (let i = 0; i < barCount; i++) {
        const time = Date.now() / 1000;
        const wave = Math.sin(time * 2 + i * 0.3) * 0.5 + 0.5;
        const barHeight = wave * canvas.height * 0.3;
        
        const x = i * barWidth + barSpacing / 2;
        const y = canvas.height - barHeight;
        
        canvasContext.fillStyle = color + '60';
        canvasContext.fillRect(x, y, effectiveBarWidth, barHeight);
      }
      
      animationRef.current = requestAnimationFrame(animateFallback);
    };

    animateFallback();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, isConnected, barCount, color]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'relative overflow-hidden rounded-lg bg-black/20 backdrop-blur-sm border border-white/10',
        className
      )}
    >
      <canvas
        ref={canvasRef}
        width={responsive ? undefined : width}
        height={responsive ? undefined : height}
        className={cn(
          'w-full h-full',
          responsive ? 'aspect-[3/1]' : ''
        )}
        style={!responsive ? { width, height } : undefined}
        role="img"
        aria-label={
          isActive 
            ? 'Real-time audio visualization showing voice activity'
            : 'Audio visualization placeholder'
        }
      />
      
      {/* Overlay for better visual feedback */}
      {isSpeaking && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        />
      )}
      
      {/* Status indicator */}
      <div className="absolute top-2 right-2 flex items-center gap-1">
        <div className={cn(
          'w-2 h-2 rounded-full',
          isActive ? 'bg-green-400' : 'bg-gray-400'
        )} />
        <span className="text-xs text-white/60">
          {isActive ? 'LIVE' : 'IDLE'}
        </span>
      </div>
    </motion.div>
  );
}