import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Settings, Download, Share2, RotateCcw } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Slider } from './ui/slider';

interface ThemeConfig {
  primaryHue: number;
  secondaryHue: number;
  saturation: number;
  lightness: number;
  animationSpeed: number;
  particleCount: number;
  glassIntensity: number;
  motionPreset: 'minimal' | 'balanced' | 'dramatic';
}

interface ThemeCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
  onThemeChange: (theme: ThemeConfig) => void;
}

const presetThemes = {
  cosmic: { primaryHue: 262, secondaryHue: 316, saturation: 83, lightness: 58 },
  ocean: { primaryHue: 200, secondaryHue: 240, saturation: 75, lightness: 55 },
  sunset: { primaryHue: 20, secondaryHue: 60, saturation: 80, lightness: 60 },
  forest: { primaryHue: 120, secondaryHue: 160, saturation: 70, lightness: 50 },
  aurora: { primaryHue: 280, secondaryHue: 320, saturation: 85, lightness: 65 },
};

const getInitialTheme = (): ThemeConfig => {
  const defaultTheme: ThemeConfig = {
    primaryHue: 262,
    secondaryHue: 316,
    saturation: 83,
    lightness: 58,
    animationSpeed: 1,
    particleCount: 100,
    glassIntensity: 0.8,
    motionPreset: 'balanced',
  };

  if (typeof window === 'undefined') return defaultTheme;

  try {
    const savedTheme = localStorage.getItem('voiceTheme');
    if (savedTheme) {
      return JSON.parse(savedTheme);
    }
  } catch {
    // Ignore errors and use default
  }
  return defaultTheme;
};

export const ThemeCustomizer: FC<ThemeCustomizerProps> = ({ isOpen, onClose, onThemeChange }) => {
  const [theme, setTheme] = useState<ThemeConfig>(getInitialTheme);

  const [activeTab, setActiveTab] = useState<'colors' | 'effects' | 'presets'>('colors');

  // Apply theme changes
  useEffect(() => {
    if (isOpen) {
      onThemeChange(theme);

      // Update CSS custom properties
      const root = document.documentElement;
      root.style.setProperty(
        '--voice-primary',
        `${theme.primaryHue} ${theme.saturation}% ${theme.lightness}%`
      );
      root.style.setProperty(
        '--voice-secondary',
        `${theme.secondaryHue} ${theme.saturation}% ${theme.lightness}%`
      );
    }
  }, [theme, isOpen, onThemeChange]);

  // Save theme
  const saveTheme = () => {
    localStorage.setItem('voiceTheme', JSON.stringify(theme));
  };

  // Reset to default
  const resetTheme = () => {
    const defaultTheme: ThemeConfig = {
      primaryHue: 262,
      secondaryHue: 316,
      saturation: 83,
      lightness: 58,
      animationSpeed: 1,
      particleCount: 100,
      glassIntensity: 0.8,
      motionPreset: 'balanced',
    };
    setTheme(defaultTheme);
  };

  // Export theme
  const exportTheme = () => {
    const dataStr = JSON.stringify(theme, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = 'voice-theme.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Share theme
  const shareTheme = async () => {
    const shareData = {
      title: 'Voice Chat Theme',
      text: 'Check out this custom voice chat theme!',
      url: window.location.href + `?theme=${btoa(JSON.stringify(theme))}`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // Fallback to clipboard
        navigator.clipboard.writeText(shareData.url);
      }
    } else {
      navigator.clipboard.writeText(shareData.url);
    }
  };

  // Apply preset
  const applyPreset = (presetName: keyof typeof presetThemes) => {
    const preset = presetThemes[presetName];
    setTheme((prev) => ({ ...prev, ...preset }));
  };

  type TabId = 'colors' | 'effects' | 'presets';

  const tabs: Array<{ id: TabId; label: string; icon: typeof Palette }> = [
    { id: 'colors', label: 'Colors', icon: Palette },
    { id: 'effects', label: 'Effects', icon: Settings },
    { id: 'presets', label: 'Presets', icon: RotateCcw },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Customizer Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md max-h-[80vh] mx-4"
          >
            <Card className="glass-enhanced p-6 overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Theme Customizer</h2>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm" onClick={exportTheme}>
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={shareTheme}>
                    <Share2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={onClose}>
                    ×
                  </Button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex space-x-1 mb-6 glass p-1 rounded-lg">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-primary text-white'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="space-y-6 max-h-[400px] overflow-y-auto">
                {activeTab === 'colors' && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    {/* Primary Hue */}
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Primary Hue: {theme.primaryHue}°
                      </label>
                      <Slider
                        value={[theme.primaryHue]}
                        onValueChange={(value) =>
                          setTheme((prev) => ({ ...prev, primaryHue: value[0] }))
                        }
                        min={0}
                        max={360}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    {/* Secondary Hue */}
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Secondary Hue: {theme.secondaryHue}°
                      </label>
                      <Slider
                        value={[theme.secondaryHue]}
                        onValueChange={(value) =>
                          setTheme((prev) => ({ ...prev, secondaryHue: value[0] }))
                        }
                        min={0}
                        max={360}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    {/* Saturation */}
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Saturation: {theme.saturation}%
                      </label>
                      <Slider
                        value={[theme.saturation]}
                        onValueChange={(value) =>
                          setTheme((prev) => ({ ...prev, saturation: value[0] }))
                        }
                        min={0}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    {/* Lightness */}
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Lightness: {theme.lightness}%
                      </label>
                      <Slider
                        value={[theme.lightness]}
                        onValueChange={(value) =>
                          setTheme((prev) => ({ ...prev, lightness: value[0] }))
                        }
                        min={20}
                        max={80}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  </motion.div>
                )}

                {activeTab === 'effects' && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    {/* Animation Speed */}
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Animation Speed: {theme.animationSpeed}x
                      </label>
                      <Slider
                        value={[theme.animationSpeed]}
                        onValueChange={(value) =>
                          setTheme((prev) => ({ ...prev, animationSpeed: value[0] }))
                        }
                        min={0.5}
                        max={2}
                        step={0.1}
                        className="w-full"
                      />
                    </div>

                    {/* Particle Count */}
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Particle Count: {theme.particleCount}
                      </label>
                      <Slider
                        value={[theme.particleCount]}
                        onValueChange={(value) =>
                          setTheme((prev) => ({ ...prev, particleCount: value[0] }))
                        }
                        min={0}
                        max={200}
                        step={10}
                        className="w-full"
                      />
                    </div>

                    {/* Glass Intensity */}
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Glass Effect: {Math.round(theme.glassIntensity * 100)}%
                      </label>
                      <Slider
                        value={[theme.glassIntensity]}
                        onValueChange={(value) =>
                          setTheme((prev) => ({ ...prev, glassIntensity: value[0] }))
                        }
                        min={0}
                        max={1}
                        step={0.1}
                        className="w-full"
                      />
                    </div>

                    {/* Motion Preset */}
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Motion Preset
                      </label>
                      <div className="flex space-x-2">
                        {(['minimal', 'balanced', 'dramatic'] as const).map((preset) => (
                          <button
                            key={preset}
                            onClick={() => setTheme((prev) => ({ ...prev, motionPreset: preset }))}
                            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                              theme.motionPreset === preset
                                ? 'bg-primary text-white'
                                : 'bg-white/10 text-white/70 hover:bg-white/20'
                            }`}
                          >
                            {preset.charAt(0).toUpperCase() + preset.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'presets' && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    {Object.entries(presetThemes).map(([name, preset]) => (
                      <button
                        key={name}
                        onClick={() => applyPreset(name as keyof typeof presetThemes)}
                        className="w-full p-4 rounded-lg glass hover:glass-enhanced transition-all text-left"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-white capitalize">{name}</h3>
                            <p className="text-sm text-white/70">
                              H: {preset.primaryHue}° | S: {preset.saturation}% | L:{' '}
                              {preset.lightness}%
                            </p>
                          </div>
                          <div className="flex space-x-1">
                            <div
                              className="w-6 h-6 rounded-full"
                              style={{
                                backgroundColor: `hsl(${preset.primaryHue}, ${preset.saturation}%, ${preset.lightness}%)`,
                              }}
                            />
                            <div
                              className="w-6 h-6 rounded-full"
                              style={{
                                backgroundColor: `hsl(${preset.secondaryHue}, ${preset.saturation}%, ${preset.lightness}%)`,
                              }}
                            />
                          </div>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>

              {/* Actions */}
              <div className="flex space-x-3 mt-6 pt-6 border-t border-white/10">
                <Button onClick={saveTheme} className="flex-1">
                  Save Theme
                </Button>
                <Button onClick={resetTheme} variant="outline" className="flex-1">
                  Reset
                </Button>
              </div>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
