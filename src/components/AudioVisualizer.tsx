
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface AudioVisualizerProps {
  isActive: boolean;
  isSpeaking: boolean;
  className?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ 
  isActive, 
  isSpeaking, 
  className = '' 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize audio context and microphone
  useEffect(() => {
    const initializeAudio = async () => {
      if (!isActive || isInitialized) return;

      try {
        // Get microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        // Create audio context and analyser
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);

        analyser.fftSize = 256;
        source.connect(analyser);

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize audio:', error);
      }
    };

    initializeAudio();

    return () => {
      // Cleanup
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, isInitialized]);

  // Animation loop
  useEffect(() => {
    if (!isInitialized || !analyserRef.current || !dataArrayRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      if (!analyserRef.current || !dataArrayRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArrayRef.current);

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw visualization
      const barCount = 64;
      const barWidth = canvas.width / barCount;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Create gradient
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, canvas.width / 2);
      gradient.addColorStop(0, isSpeaking ? 'rgba(236, 72, 153, 0.8)' : 'rgba(124, 58, 237, 0.8)');
      gradient.addColorStop(1, isSpeaking ? 'rgba(124, 58, 237, 0.3)' : 'rgba(236, 72, 153, 0.3)');

      ctx.fillStyle = gradient;
      ctx.strokeStyle = isSpeaking ? 'rgba(236, 72, 153, 0.6)' : 'rgba(124, 58, 237, 0.6)';
      ctx.lineWidth = 2;

      // Draw bars in circular pattern
      for (let i = 0; i < barCount; i++) {
        const angle = (i / barCount) * Math.PI * 2;
        const amplitude = dataArrayRef.current[i] / 255;
        const barHeight = amplitude * 100 + 20;
        
        const x1 = centerX + Math.cos(angle) * 60;
        const y1 = centerY + Math.sin(angle) * 60;
        const x2 = centerX + Math.cos(angle) * (60 + barHeight);
        const y2 = centerY + Math.sin(angle) * (60 + barHeight);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isInitialized, isSpeaking]);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        width={300}
        height={300}
        className="w-full h-full"
        style={{ maxWidth: '300px', maxHeight: '300px' }}
      />
      {!isActive && (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="w-24 h-24 rounded-full gradient-primary opacity-50"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      )}
    </div>
  );
};
