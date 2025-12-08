import { useState } from 'react';
import type { FC } from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX, Volume1 } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface VolumeControlProps {
  volume: number;
  onVolumeChange: (volume: number) => void;
  className?: string;
}

export const VolumeControl: FC<VolumeControlProps> = ({
  volume,
  onVolumeChange,
  className = '',
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(volume);

  const handleMuteToggle = () => {
    if (isMuted) {
      onVolumeChange(previousVolume);
      setIsMuted(false);
    } else {
      setPreviousVolume(volume);
      onVolumeChange(0);
      setIsMuted(true);
    }
  };

  const handleVolumeChange = (values: number[]) => {
    const newVolume = values[0];
    onVolumeChange(newVolume);
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    } else if (newVolume === 0) {
      setIsMuted(true);
    }
  };

  const renderVolumeIcon = (size: string) => {
    if (isMuted || volume === 0) return <VolumeX className={size} />;
    if (volume < 0.5) return <Volume1 className={size} />;
    return <Volume2 className={size} />;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className={`glass hover:bg-white/10 ${className}`}>
          {renderVolumeIcon('w-5 h-5')}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="glass-enhanced border-white/20 p-4 w-64">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white">Volume</span>
            <span className="text-sm text-white/60">{Math.round(volume * 100)}%</span>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMuteToggle}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              {renderVolumeIcon('w-4 h-4')}
            </Button>

            <Slider
              value={[isMuted ? 0 : volume]}
              onValueChange={handleVolumeChange}
              max={1}
              step={0.01}
              className="flex-1"
            />
          </div>

          {/* Visual volume indicator */}
          <div className="flex items-center gap-1">
            {[...Array(10)].map((_, i) => {
              const isActive = (i + 1) / 10 <= volume && !isMuted;
              return (
                <motion.div
                  key={i}
                  className={`h-4 flex-1 rounded-sm ${
                    isActive
                      ? i < 3
                        ? 'bg-green-500'
                        : i < 7
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      : 'bg-white/10'
                  }`}
                  animate={{
                    opacity: isActive ? 1 : 0.3,
                    scale: isActive ? [1, 1.1, 1] : 1,
                  }}
                  transition={{
                    duration: 0.3,
                    delay: i * 0.02,
                  }}
                />
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
