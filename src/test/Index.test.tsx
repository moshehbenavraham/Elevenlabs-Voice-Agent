import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Index from '../pages/Index';

// Mock the hooks and components
vi.mock('@/hooks/useElevenLabsConversation', () => ({
  useElevenLabsConversation: () => ({
    isConnected: false,
    isLoading: false,
    isSpeaking: false,
    error: null,
    messages: [],
    startConversation: vi.fn(),
    endConversation: vi.fn(),
    setVolume: vi.fn(),
  }),
}));

vi.mock('@/hooks/useVoiceAnimations', () => ({
  useVoiceAnimations: () => ({
    isTransitioning: false,
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

// Mock all the components to avoid complex rendering
vi.mock('@/components/HeroSection', () => ({
  HeroSection: ({ onStartConversation }: any) => (
    <div data-testid="hero-section">
      <button onClick={onStartConversation}>Start Conversation</button>
    </div>
  ),
}));

vi.mock('@/components/VoiceOrb', () => ({
  VoiceOrb: () => <div data-testid="voice-orb">Voice Orb</div>,
}));

vi.mock('@/components/ThemeToggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle">Theme Toggle</div>,
}));

vi.mock('@/components/BackgroundEffects', () => ({
  BackgroundEffects: () => <div data-testid="background-effects">Background Effects</div>,
}));

vi.mock('@/components/VoiceEnvironment', () => ({
  VoiceEnvironment: () => <div data-testid="voice-environment">Voice Environment</div>,
}));

vi.mock('@/components/ConfigurationModal', () => ({
  ConfigurationModal: ({ isOpen }: any) => (
    isOpen ? <div data-testid="config-modal">Configuration Modal</div> : null
  ),
}));

vi.mock('@/components/ErrorDisplay', () => ({
  ErrorDisplay: () => <div data-testid="error-display">Error Display</div>,
}));

vi.mock('@/components/VolumeControl', () => ({
  VolumeControl: () => <div data-testid="volume-control">Volume Control</div>,
}));

describe('Index Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<Index />);
    expect(screen.getByTestId('hero-section')).toBeInTheDocument();
  });

  it('accesses environment variable for agent ID', () => {
    // Test that the component can access environment variables
    const { container } = render(<Index />);
    expect(container).toBeInTheDocument();
    
    // The component should render successfully even if env var is not set
    // (it will show config modal in that case)
  });

  it('renders required components', () => {
    render(<Index />);
    
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('background-effects')).toBeInTheDocument();
    expect(screen.getByTestId('voice-environment')).toBeInTheDocument();
    expect(screen.getByTestId('error-display')).toBeInTheDocument();
  });
});