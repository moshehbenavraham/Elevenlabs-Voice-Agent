import { useRef, useEffect, useState, useCallback } from 'react';
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
  width = 400,
  height = 120,
  barCount = 64,
  responsive = true,
}: VoiceVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const [isActive, setIsActive] = useState(false);
  const isActiveRef = useRef(false);
  const smoothDataRef = useRef<number[]>(new Array(barCount).fill(0));

  const { isConnected, isSpeaking, getInputByteFrequencyData, getOutputByteFrequencyData } =
    useVoice();

  // Smooth the audio data for more organic movement
  const smoothData = useCallback((newData: number[], smoothFactor = 0.3) => {
    return newData.map((value, i) => {
      const current = smoothDataRef.current[i] || 0;
      return current + (value - current) * smoothFactor;
    });
  }, []);

  const updateIsActive = useCallback((value: boolean) => {
    if (isActiveRef.current !== value) {
      isActiveRef.current = value;
      setIsActive(value);
    }
  }, []);

  const sampleFrequencyData = useCallback(
    (frequencyData: Uint8Array) => {
      if (frequencyData.length === 0) {
        return [];
      }

      const data: number[] = [];
      const step = Math.max(1, Math.floor(frequencyData.length / barCount));

      for (let i = 0; i < barCount; i++) {
        data.push(frequencyData[i * step] || 0);
      }

      return data;
    },
    [barCount]
  );

  // Draw organic waveform
  const drawWaveform = useCallback(
    (ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number, data: number[]) => {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      const centerY = canvasHeight / 2;
      const maxAmplitude = canvasHeight * 0.4;

      // Smooth the data
      const smoothedData = smoothData(data);
      smoothDataRef.current = smoothedData;

      // Colors - warm amber gradient
      const gradient = ctx.createLinearGradient(0, 0, canvasWidth, 0);
      gradient.addColorStop(0, 'hsla(43, 96%, 56%, 0.1)');
      gradient.addColorStop(
        0.5,
        isSpeaking ? 'hsla(142, 71%, 45%, 0.6)' : 'hsla(43, 96%, 56%, 0.5)'
      );
      gradient.addColorStop(1, 'hsla(43, 96%, 56%, 0.1)');

      // Draw smooth waveform using bezier curves
      ctx.beginPath();
      ctx.moveTo(0, centerY);

      const segmentWidth = canvasWidth / (smoothedData.length - 1);

      for (let i = 0; i < smoothedData.length; i++) {
        const x = i * segmentWidth;
        const amplitude = (smoothedData[i] / 255) * maxAmplitude;
        const y = centerY + Math.sin(i * 0.5 + Date.now() * 0.002) * amplitude;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          const prevX = (i - 1) * segmentWidth;
          const prevAmplitude = (smoothedData[i - 1] / 255) * maxAmplitude;
          const prevY = centerY + Math.sin((i - 1) * 0.5 + Date.now() * 0.002) * prevAmplitude;

          const cpX1 = prevX + segmentWidth / 3;
          const cpX2 = x - segmentWidth / 3;

          ctx.bezierCurveTo(cpX1, prevY, cpX2, y, x, y);
        }
      }

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Draw mirrored wave (bottom half)
      ctx.beginPath();
      ctx.moveTo(0, centerY);

      for (let i = 0; i < smoothedData.length; i++) {
        const x = i * segmentWidth;
        const amplitude = (smoothedData[i] / 255) * maxAmplitude;
        const y = centerY - Math.sin(i * 0.5 + Date.now() * 0.002) * amplitude;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          const prevX = (i - 1) * segmentWidth;
          const prevAmplitude = (smoothedData[i - 1] / 255) * maxAmplitude;
          const prevY = centerY - Math.sin((i - 1) * 0.5 + Date.now() * 0.002) * prevAmplitude;

          const cpX1 = prevX + segmentWidth / 3;
          const cpX2 = x - segmentWidth / 3;

          ctx.bezierCurveTo(cpX1, prevY, cpX2, y, x, y);
        }
      }

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Center line
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(canvasWidth, centerY);
      ctx.strokeStyle = 'hsla(0, 0%, 100%, 0.05)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Glow effect when speaking
      if (isSpeaking) {
        ctx.shadowColor = 'hsla(142, 71%, 45%, 0.5)';
        ctx.shadowBlur = 15;
      }
    },
    [smoothData, isSpeaking]
  );

  // Animation loop driven by ElevenLabs v1 frequency helpers.
  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      if (!isConnected) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        updateIsActive(false);
        return;
      }

      const frequencyData = isSpeaking ? getOutputByteFrequencyData() : getInputByteFrequencyData();
      const sampledData = sampleFrequencyData(frequencyData);
      const hasFrequencyData = sampledData.some((value) => value > 0);
      updateIsActive(hasFrequencyData);

      const data =
        sampledData.length > 0
          ? sampledData
          : Array.from({ length: barCount }, (_, i) => {
              const time = Date.now() / 1000;
              const wave1 = Math.sin(time * 2 + i * 0.2) * 0.3 + 0.3;
              const wave2 = Math.sin(time * 1.5 + i * 0.15) * 0.2;
              return Math.max(0, (wave1 + wave2) * 255 * 0.3);
            });

      drawWaveform(ctx, canvas.width, canvas.height, data);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [
    barCount,
    drawWaveform,
    getInputByteFrequencyData,
    getOutputByteFrequencyData,
    isConnected,
    isSpeaking,
    sampleFrequencyData,
    updateIsActive,
  ]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn('relative overflow-hidden rounded-xl', className)}
    >
      {/* Background with subtle gradient */}
      <div
        className="absolute inset-0 rounded-xl"
        style={{
          background:
            'linear-gradient(180deg, hsla(240, 6%, 8%, 0.8) 0%, hsla(240, 6%, 8%, 0.6) 100%)',
          border: '1px solid hsla(0, 0%, 100%, 0.06)',
        }}
      />

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={responsive ? undefined : width}
        height={responsive ? undefined : height}
        className={cn('relative z-10 w-full', responsive ? 'h-24 sm:h-28' : '')}
        style={!responsive ? { width, height } : undefined}
        role="img"
        aria-label={
          isActive
            ? 'Real-time audio visualization showing voice waveform'
            : 'Audio visualization placeholder'
        }
      />

      {/* Status badge */}
      <div className="absolute top-3 right-3 flex items-center gap-2">
        <div
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            isActive ? (isSpeaking ? 'bg-emerald-400' : 'bg-amber-400') : 'bg-zinc-600'
          )}
        />
        <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
          {isActive ? (isSpeaking ? 'Active' : 'Listening') : 'Standby'}
        </span>
      </div>

      {/* Edge glow when active */}
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            boxShadow: isSpeaking
              ? 'inset 0 0 20px hsla(142, 71%, 45%, 0.1)'
              : 'inset 0 0 20px hsla(43, 96%, 56%, 0.05)',
          }}
        />
      )}
    </motion.div>
  );
}
