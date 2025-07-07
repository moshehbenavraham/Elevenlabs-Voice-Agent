import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
}

interface ParticleSystemProps {
  isActive: boolean;
  isSpeaking: boolean;
  intensity?: number;
  className?: string;
}

export const ParticleSystem: React.FC<ParticleSystemProps> = ({
  isActive,
  isSpeaking,
  intensity = 0.5,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const orbRadius = 140;

    // Create particles around orb perimeter
    const createParticle = (): Particle => {
      const angle = Math.random() * Math.PI * 2;
      const radius = orbRadius + (Math.random() - 0.5) * 20;
      
      return {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        life: 1,
        maxLife: 60 + Math.random() * 120,
        size: 1 + Math.random() * 3,
        hue: isSpeaking ? 316 + Math.random() * 40 : 262 + Math.random() * 30
      };
    };

    const updateParticles = () => {
      // Add new particles based on activity
      const particleCount = isActive ? (isSpeaking ? 8 : 4) : 1;
      const currentIntensity = Math.max(0.1, intensity);
      
      for (let i = 0; i < particleCount * currentIntensity; i++) {
        if (particlesRef.current.length < 100) {
          particlesRef.current.push(createParticle());
        }
      }

      // Update existing particles
      particlesRef.current = particlesRef.current.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life--;
        
        // Add slight attraction to orb center
        const dx = centerX - particle.x;
        const dy = centerY - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > orbRadius + 50) {
          particle.vx += dx * 0.001;
          particle.vy += dy * 0.001;
        }

        return particle.life > 0;
      });
    };

    const drawParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particlesRef.current.forEach(particle => {
        const alpha = particle.life / particle.maxLife;
        const size = particle.size * alpha;
        
        // Draw particle with glow effect
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
        
        // Inner glow
        ctx.fillStyle = `hsla(${particle.hue}, 80%, 60%, ${alpha * 0.8})`;
        ctx.fill();
        
        // Outer glow
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, size * 2, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${particle.hue}, 70%, 50%, ${alpha * 0.3})`;
        ctx.fill();
      });
    };

    const animate = () => {
      updateParticles();
      drawParticles();
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, isSpeaking, intensity]);

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={300}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ maxWidth: '300px', maxHeight: '300px' }}
    />
  );
};