
import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  const [averageVolume, setAverageVolume] = useState(0);

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

        analyser.fftSize = 512; // Increased for more frequency bands
        analyser.smoothingTimeConstant = 0.8;
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

  // Draw multiple visualization layers
  const drawVisualization = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, dataArray: Uint8Array) => {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const baseRadius = 60;
    const maxRadius = 140;
    
    // Calculate average volume for color shifting
    const avgVolume = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
    setAverageVolume(avgVolume);
    
    // Dynamic color based on volume and speaking state
    const intensity = avgVolume / 255;
    const hue = isSpeaking ? 316 + (intensity * 20) : 262 + (intensity * 15);
    const saturation = isSpeaking ? 73 + (intensity * 27) : 83 + (intensity * 17);
    const lightness = isSpeaking ? 52 + (intensity * 20) : 58 + (intensity * 15);
    
    // Create dynamic gradients
    const primaryGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius);
    primaryGradient.addColorStop(0, `hsla(${hue}, ${saturation}%, ${lightness}%, ${0.8 + intensity * 0.2})`);
    primaryGradient.addColorStop(0.6, `hsla(${hue}, ${saturation}%, ${lightness}%, ${0.4 + intensity * 0.3})`);
    primaryGradient.addColorStop(1, `hsla(${hue}, ${saturation}%, ${lightness}%, ${0.1 + intensity * 0.1})`);
    
    const secondaryGradient = ctx.createRadialGradient(centerX, centerY, baseRadius, centerX, centerY, maxRadius);
    secondaryGradient.addColorStop(0, `hsla(${hue + 40}, ${saturation}%, ${lightness}%, 0.3)`);
    secondaryGradient.addColorStop(1, `hsla(${hue + 40}, ${saturation}%, ${lightness}%, 0.1)`);
    
    // Draw outer ripple effects
    for (let i = 0; i < 3; i++) {
      const rippleRadius = baseRadius + (avgVolume * 0.3) + (i * 20);
      const rippleOpacity = Math.max(0, 0.3 - (i * 0.1)) * intensity;
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, rippleRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${rippleOpacity})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    // Draw frequency bars in circular pattern
    const barCount = 128;
    ctx.fillStyle = primaryGradient;
    ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.8)`;
    ctx.lineWidth = 2;
    
    for (let i = 0; i < barCount; i++) {
      const angle = (i / barCount) * Math.PI * 2;
      const dataIndex = Math.floor((i / barCount) * dataArray.length);
      const amplitude = dataArray[dataIndex] / 255;
      
      // Calculate bar dimensions with 3D depth effect
      const baseBarHeight = 15;
      const barHeight = baseBarHeight + (amplitude * 60);
      const barWidth = 3;
      
      // Calculate positions for 3D effect
      const innerRadius = baseRadius - 5;
      const outerRadius = baseRadius + barHeight;
      
      const x1 = centerX + Math.cos(angle) * innerRadius;
      const y1 = centerY + Math.sin(angle) * innerRadius;
      const x2 = centerX + Math.cos(angle) * outerRadius;
      const y2 = centerY + Math.sin(angle) * outerRadius;
      
      // Draw bar with gradient
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineWidth = barWidth;
      ctx.lineCap = 'round';
      ctx.stroke();
      
      // Add depth with secondary bars
      if (amplitude > 0.3) {
        const depthX = x2 + Math.cos(angle + 0.1) * 3;
        const depthY = y2 + Math.sin(angle + 0.1) * 3;
        
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(depthX, depthY);
        ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness - 20}%, ${amplitude * 0.5})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
    
    // Draw central pulse
    const pulseRadius = 20 + (avgVolume * 0.2);
    ctx.beginPath();
    ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
    ctx.fillStyle = secondaryGradient;
    ctx.fill();
    
    // Draw frequency spectrum particles
    if (intensity > 0.1) {
      const particleCount = Math.floor(intensity * 20);
      for (let i = 0; i < particleCount; i++) {
        const particleAngle = (Date.now() / 1000 + i) % (Math.PI * 2);
        const particleRadius = baseRadius + Math.random() * 40;
        const particleX = centerX + Math.cos(particleAngle) * particleRadius;
        const particleY = centerY + Math.sin(particleAngle) * particleRadius;
        
        ctx.beginPath();
        ctx.arc(particleX, particleY, 1 + Math.random() * 2, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue + Math.random() * 60}, ${saturation}%, ${lightness}%, ${0.3 + Math.random() * 0.4})`;
        ctx.fill();
      }
    }
  }, [isSpeaking]);

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

      // Clear canvas with subtle fade effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw visualization
      drawVisualization(ctx, canvas, dataArrayRef.current);

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isInitialized, drawVisualization]);

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
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              ease: 'easeInOut' 
            }}
          />
        </div>
      )}
    </div>
  );
};
