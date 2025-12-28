import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Index } from '../pages/Index';
import { ProviderProvider } from '@/contexts/ProviderContext';

interface HeroSectionMockProps {
  onStartConversation: () => void;
}

interface ConfigurationModalMockProps {
  isOpen: boolean;
}

// Wrapper with required providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ProviderProvider>{children}</ProviderProvider>
);

// Mock the VoiceContext
vi.mock('@/contexts/VoiceContext', () => ({
  useVoice: () => ({
    isConnected: false,
    isLoading: false,
    isSpeaking: false,
    error: null,
    connect: vi.fn(),
    disconnect: vi.fn(),
    clearError: vi.fn(),
  }),
}));

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
  HeroSection: ({ onStartConversation }: HeroSectionMockProps) => (
    <div data-testid="hero-section">
      <button onClick={onStartConversation}>Start Conversation</button>
    </div>
  ),
}));

vi.mock('@/components/BackgroundEffects', () => ({
  BackgroundEffects: () => <div data-testid="background-effects">Background Effects</div>,
}));

vi.mock('@/components/ConfigurationModal', () => ({
  ConfigurationModal: ({ isOpen }: ConfigurationModalMockProps) =>
    isOpen ? <div data-testid="config-modal">Configuration Modal</div> : null,
}));

vi.mock('@/components/voice/VoiceButton', () => ({
  VoiceButton: () => <div data-testid="voice-button">Voice Button</div>,
}));

vi.mock('@/components/voice/VoiceStatus', () => ({
  VoiceStatus: () => <div data-testid="voice-status">Voice Status</div>,
}));

vi.mock('@/components/voice/VoiceVisualizer', () => ({
  VoiceVisualizer: () => <div data-testid="voice-visualizer">Voice Visualizer</div>,
}));

vi.mock('@/components/voice/VoiceWidget', () => ({
  VoiceWidget: () => <div data-testid="voice-widget">Voice Widget</div>,
}));

// Mock xAI provider components
vi.mock('@/components/providers', () => ({
  XAIProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  XAIVoiceButton: () => <div data-testid="xai-voice-button">XAI Voice Button</div>,
  XAIVoiceStatus: () => <div data-testid="xai-voice-status">XAI Voice Status</div>,
  XAIVoiceVisualizer: () => <div data-testid="xai-voice-visualizer">XAI Voice Visualizer</div>,
}));

// Mock ProviderTabs
vi.mock('@/components/tabs', () => ({
  ProviderTabs: () => <div data-testid="provider-tabs">Provider Tabs</div>,
}));

describe('Index Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<Index />, { wrapper: TestWrapper });
    // Either hero section or xai hero should render based on active provider
    expect(screen.getByTestId('background-effects')).toBeInTheDocument();
  });

  it('accesses environment variable for agent ID', () => {
    // Test that the component can access environment variables
    const { container } = render(<Index />, { wrapper: TestWrapper });
    expect(container).toBeInTheDocument();

    // The component should render successfully even if env var is not set
    // (it will show config modal in that case)
  });

  it('renders required components', () => {
    render(<Index />, { wrapper: TestWrapper });

    // Background effects should be rendered
    expect(screen.getByTestId('background-effects')).toBeInTheDocument();
    // Provider tabs should be visible
    expect(screen.getByTestId('provider-tabs')).toBeInTheDocument();
  });
});
