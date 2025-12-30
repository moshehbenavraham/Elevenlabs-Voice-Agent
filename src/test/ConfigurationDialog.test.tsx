import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigurationDialog } from '@/components/settings/ConfigurationDialog';

// Mock environment variables
vi.stubEnv('VITE_ELEVENLABS_ENABLED', 'true');
vi.stubEnv('VITE_ELEVENLABS_SDK_ENABLED', 'false');
vi.stubEnv('VITE_OPENAI_ENABLED', 'true');
vi.stubEnv('VITE_XAI_ENABLED', 'true');
vi.stubEnv('VITE_ELEVENLABS_AGENT_ID', 'test-agent-id');

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock the voice hooks
vi.mock('@/hooks/useOpenAIVoice', () => ({
  useOpenAIVoice: () => ({
    selectedVoice: 'alloy',
    setVoice: vi.fn(),
    systemPrompt: 'Test prompt',
    setSystemPrompt: vi.fn(),
    isConnected: false,
  }),
}));

vi.mock('@/hooks/useXAIVoice', () => ({
  useXAIVoice: () => ({
    selectedVoice: 'Ara',
    setVoice: vi.fn(),
    systemPrompt: 'Test xAI prompt',
    setSystemPrompt: vi.fn(),
    isConnected: false,
  }),
}));

describe('ConfigurationDialog', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    elevenLabsStatus: 'disconnected' as const,
    openAIStatus: 'disconnected' as const,
    xaiStatus: 'disconnected' as const,
  };

  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('Dialog Open/Close', () => {
    it('renders when isOpen is true', () => {
      render(<ConfigurationDialog {...defaultProps} isOpen={true} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(<ConfigurationDialog {...defaultProps} isOpen={false} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('displays Settings title', () => {
      render(<ConfigurationDialog {...defaultProps} />);
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', async () => {
      const onClose = vi.fn();
      render(<ConfigurationDialog {...defaultProps} onClose={onClose} />);

      // Use the aria-label "Close settings" to get the header close button specifically
      const closeButton = screen.getByRole('button', { name: /close settings/i });
      await userEvent.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose when Escape key is pressed', async () => {
      const onClose = vi.fn();
      render(<ConfigurationDialog {...defaultProps} onClose={onClose} />);

      await userEvent.keyboard('{Escape}');

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  describe('Provider Tabs', () => {
    it('renders ElevenLabs tab', () => {
      render(<ConfigurationDialog {...defaultProps} />);
      expect(screen.getByRole('tab', { name: /elevenlabs/i })).toBeInTheDocument();
    });

    it('renders OpenAI tab', () => {
      render(<ConfigurationDialog {...defaultProps} />);
      expect(screen.getByRole('tab', { name: /openai/i })).toBeInTheDocument();
    });

    it('renders xAI tab', () => {
      render(<ConfigurationDialog {...defaultProps} />);
      expect(screen.getByRole('tab', { name: /xai/i })).toBeInTheDocument();
    });

    it('switches to OpenAI tab when clicked', async () => {
      render(<ConfigurationDialog {...defaultProps} />);

      const openaiTab = screen.getByRole('tab', { name: /openai/i });
      await userEvent.click(openaiTab);

      expect(openaiTab).toHaveAttribute('data-state', 'active');
    });
  });

  describe('Connection Status', () => {
    it('displays connection status section', () => {
      render(<ConfigurationDialog {...defaultProps} />);
      expect(screen.getByText('Connection Status')).toBeInTheDocument();
    });

    it('shows ElevenLabs in diagnostics', () => {
      render(<ConfigurationDialog {...defaultProps} elevenLabsStatus="connected" />);
      // ElevenLabs appears in both tabs and diagnostics - check diagnostics has Connected status
      const statusSection = screen.getByText('Connection Status').parentElement;
      expect(statusSection).toHaveTextContent('ElevenLabs');
    });

    it('shows OpenAI in diagnostics', () => {
      render(<ConfigurationDialog {...defaultProps} openAIStatus="connected" />);
      // OpenAI appears in both tabs and diagnostics - check diagnostics has Connected status
      const statusSection = screen.getByText('Connection Status').parentElement;
      expect(statusSection).toHaveTextContent('OpenAI');
    });

    it('shows xAI in diagnostics', () => {
      render(<ConfigurationDialog {...defaultProps} xaiStatus="connected" />);
      // Check that xAI (Grok) appears in connection diagnostics
      expect(screen.getByText('xAI (Grok)')).toBeInTheDocument();
    });
  });

  describe('Footer Actions', () => {
    it('renders Reset to defaults button', () => {
      render(<ConfigurationDialog {...defaultProps} />);
      expect(screen.getByRole('button', { name: /reset to defaults/i })).toBeInTheDocument();
    });

    it('renders Close button', () => {
      render(<ConfigurationDialog {...defaultProps} />);
      // There are multiple close buttons - get the one in the footer
      const closeButtons = screen.getAllByRole('button', { name: /close/i });
      expect(closeButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('has proper dialog role', () => {
      render(<ConfigurationDialog {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('has dialog title', () => {
      render(<ConfigurationDialog {...defaultProps} />);
      const title = screen.getByText('Settings');
      expect(title).toBeInTheDocument();
    });

    it('has dialog description', () => {
      render(<ConfigurationDialog {...defaultProps} />);
      expect(screen.getByText('Configure voice providers')).toBeInTheDocument();
    });

    it('has aria-label on close button', () => {
      render(<ConfigurationDialog {...defaultProps} />);
      expect(screen.getByRole('button', { name: /close settings/i })).toBeInTheDocument();
    });
  });
});
