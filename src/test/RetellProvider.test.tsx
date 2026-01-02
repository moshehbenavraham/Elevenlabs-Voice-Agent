/**
 * RetellProvider Component Tests
 *
 * Component tests for Retell provider UI elements:
 * - RetellButton: Voice call button with state transitions
 * - RetellVoiceStatus: Connection status display
 * - RetellEmptyState: Unconfigured state display
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  RetellProvider,
  RetellButton,
  RetellVoiceStatus,
  RetellEmptyState,
  checkRetellConfiguration,
  useRetellConfigured,
} from '@/components/providers/RetellProvider';
import { RetellCallStatus } from '@/types/retell';
import { retellMocks } from './setup';
import { renderHook } from '@testing-library/react';

// Mock the useRetellVoice hook
const mockUseRetellVoice = vi.fn();

vi.mock('@/hooks/useRetellVoice', () => ({
  useRetellVoice: () => mockUseRetellVoice(),
}));

// Mock the RetellVoiceContext to avoid creating real SDK instances
vi.mock('@/contexts/RetellVoiceContext', () => ({
  RetellVoiceProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useRetellVoiceContext: () => mockUseRetellVoice(),
}));

// Helper to create mock hook return value
const createMockRetellHookReturn = (overrides = {}) => ({
  callStatus: RetellCallStatus.IDLE,
  isAgentSpeaking: false,
  messages: [],
  activeTranscript: null,
  error: null,
  callId: null,
  startCall: vi.fn().mockResolvedValue(undefined),
  stopCall: vi.fn(),
  toggleCall: vi.fn(),
  ...overrides,
});

describe('RetellProvider Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    retellMocks.reset();
    mockUseRetellVoice.mockReturnValue(createMockRetellHookReturn());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================
  // T013: RetellProvider Wrapper Tests
  // ===========================================
  describe('RetellProvider', () => {
    it('renders children', () => {
      render(
        <RetellProvider>
          <div data-testid="child">Child content</div>
        </RetellProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('calls stopCall on unmount', () => {
      const mockStopCall = vi.fn();
      mockUseRetellVoice.mockReturnValue(createMockRetellHookReturn({ stopCall: mockStopCall }));

      const { unmount } = render(
        <RetellProvider>
          <div>Content</div>
        </RetellProvider>
      );

      unmount();

      expect(mockStopCall).toHaveBeenCalled();
    });
  });

  // ===========================================
  // T014: RetellButton Tests
  // ===========================================
  describe('RetellButton', () => {
    describe('rendering', () => {
      it('renders with default size', () => {
        render(<RetellButton />);
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
      });

      it('renders with small size', () => {
        render(<RetellButton size="sm" />);
        const button = screen.getByRole('button');
        expect(button).toHaveClass('w-16', 'h-16');
      });

      it('renders with medium size', () => {
        render(<RetellButton size="md" />);
        const button = screen.getByRole('button');
        expect(button).toHaveClass('w-24', 'h-24');
      });

      it('renders with large size', () => {
        render(<RetellButton size="lg" />);
        const button = screen.getByRole('button');
        expect(button).toHaveClass('w-32', 'h-32');
      });

      it('applies custom className', () => {
        render(<RetellButton className="custom-class" />);
        const container = screen.getByRole('button').parentElement;
        expect(container).toHaveClass('custom-class');
      });
    });

    describe('state transitions', () => {
      it('shows "Ready" label when idle', () => {
        mockUseRetellVoice.mockReturnValue(createMockRetellHookReturn());
        render(<RetellButton />);
        expect(screen.getByText('Ready')).toBeInTheDocument();
      });

      it('shows "Connecting" label when loading', () => {
        mockUseRetellVoice.mockReturnValue(
          createMockRetellHookReturn({ callStatus: RetellCallStatus.CONNECTING })
        );
        render(<RetellButton />);
        expect(screen.getByText('Connecting')).toBeInTheDocument();
      });

      it('shows "Live" label when connected', () => {
        mockUseRetellVoice.mockReturnValue(
          createMockRetellHookReturn({ callStatus: RetellCallStatus.CONNECTED })
        );
        render(<RetellButton />);
        expect(screen.getByText('Live')).toBeInTheDocument();
      });

      it('shows "Speaking" label when agent is speaking', () => {
        mockUseRetellVoice.mockReturnValue(
          createMockRetellHookReturn({
            callStatus: RetellCallStatus.CONNECTED,
            isAgentSpeaking: true,
          })
        );
        render(<RetellButton />);
        expect(screen.getByText('Speaking')).toBeInTheDocument();
      });

      it('shows "Error" label when error exists', () => {
        mockUseRetellVoice.mockReturnValue(
          createMockRetellHookReturn({ error: 'Connection failed' })
        );
        render(<RetellButton />);
        expect(screen.getByText('Error')).toBeInTheDocument();
      });

      it('disables button when connecting', () => {
        mockUseRetellVoice.mockReturnValue(
          createMockRetellHookReturn({ callStatus: RetellCallStatus.CONNECTING })
        );
        render(<RetellButton />);
        expect(screen.getByRole('button')).toBeDisabled();
      });
    });

    describe('click handlers', () => {
      it('calls startCall when clicked while idle', async () => {
        const mockStartCall = vi.fn().mockResolvedValue(undefined);
        mockUseRetellVoice.mockReturnValue(
          createMockRetellHookReturn({ startCall: mockStartCall })
        );

        render(<RetellButton />);
        fireEvent.click(screen.getByRole('button'));

        await waitFor(() => {
          expect(mockStartCall).toHaveBeenCalled();
        });
      });

      it('calls stopCall when clicked while connected', () => {
        const mockStopCall = vi.fn();
        mockUseRetellVoice.mockReturnValue(
          createMockRetellHookReturn({
            callStatus: RetellCallStatus.CONNECTED,
            stopCall: mockStopCall,
          })
        );

        render(<RetellButton />);
        fireEvent.click(screen.getByRole('button'));

        expect(mockStopCall).toHaveBeenCalled();
      });

      it('calls onConnect callback when connecting', async () => {
        const onConnect = vi.fn();
        const mockStartCall = vi.fn().mockResolvedValue(undefined);
        mockUseRetellVoice.mockReturnValue(
          createMockRetellHookReturn({ startCall: mockStartCall })
        );

        render(<RetellButton onConnect={onConnect} />);
        fireEvent.click(screen.getByRole('button'));

        await waitFor(() => {
          expect(onConnect).toHaveBeenCalled();
        });
      });

      it('calls onDisconnect callback when disconnecting', () => {
        const onDisconnect = vi.fn();
        const mockStopCall = vi.fn();
        mockUseRetellVoice.mockReturnValue(
          createMockRetellHookReturn({
            callStatus: RetellCallStatus.CONNECTED,
            stopCall: mockStopCall,
          })
        );

        render(<RetellButton onDisconnect={onDisconnect} />);
        fireEvent.click(screen.getByRole('button'));

        expect(onDisconnect).toHaveBeenCalled();
      });

      it('does nothing when clicked while connecting', () => {
        const mockStartCall = vi.fn();
        const mockStopCall = vi.fn();
        mockUseRetellVoice.mockReturnValue(
          createMockRetellHookReturn({
            callStatus: RetellCallStatus.CONNECTING,
            startCall: mockStartCall,
            stopCall: mockStopCall,
          })
        );

        render(<RetellButton />);
        fireEvent.click(screen.getByRole('button'));

        expect(mockStartCall).not.toHaveBeenCalled();
        expect(mockStopCall).not.toHaveBeenCalled();
      });
    });

    describe('accessibility', () => {
      it('has correct aria-label when idle', () => {
        mockUseRetellVoice.mockReturnValue(createMockRetellHookReturn());
        render(<RetellButton />);
        expect(screen.getByRole('button')).toHaveAttribute(
          'aria-label',
          'Start Retell voice conversation'
        );
      });

      it('has correct aria-label when connecting', () => {
        mockUseRetellVoice.mockReturnValue(
          createMockRetellHookReturn({ callStatus: RetellCallStatus.CONNECTING })
        );
        render(<RetellButton />);
        expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Connecting to Retell...');
      });

      it('has correct aria-label when connected', () => {
        mockUseRetellVoice.mockReturnValue(
          createMockRetellHookReturn({ callStatus: RetellCallStatus.CONNECTED })
        );
        render(<RetellButton />);
        expect(screen.getByRole('button')).toHaveAttribute(
          'aria-label',
          'Connected to Retell. Click to end call.'
        );
      });

      it('has correct aria-label when speaking', () => {
        mockUseRetellVoice.mockReturnValue(
          createMockRetellHookReturn({
            callStatus: RetellCallStatus.CONNECTED,
            isAgentSpeaking: true,
          })
        );
        render(<RetellButton />);
        expect(screen.getByRole('button')).toHaveAttribute(
          'aria-label',
          'Retell agent is speaking. Click to end call.'
        );
      });

      it('has correct aria-label when error', () => {
        mockUseRetellVoice.mockReturnValue(
          createMockRetellHookReturn({ error: 'Connection failed' })
        );
        render(<RetellButton />);
        expect(screen.getByRole('button')).toHaveAttribute(
          'aria-label',
          'Error: Connection failed. Click to retry.'
        );
      });

      it('has aria-pressed attribute', () => {
        mockUseRetellVoice.mockReturnValue(
          createMockRetellHookReturn({ callStatus: RetellCallStatus.CONNECTED })
        );
        render(<RetellButton />);
        expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
      });

      it('has role="button" attribute', () => {
        render(<RetellButton />);
        expect(screen.getByRole('button')).toHaveAttribute('role', 'button');
      });
    });
  });

  // ===========================================
  // T015: RetellVoiceStatus Tests
  // ===========================================
  describe('RetellVoiceStatus', () => {
    it('renders disconnected status', () => {
      mockUseRetellVoice.mockReturnValue(createMockRetellHookReturn());
      render(<RetellVoiceStatus />);
      expect(screen.getByText('Disconnected')).toBeInTheDocument();
    });

    it('renders connecting status', () => {
      mockUseRetellVoice.mockReturnValue(
        createMockRetellHookReturn({ callStatus: RetellCallStatus.CONNECTING })
      );
      render(<RetellVoiceStatus />);
      expect(screen.getByText('Connecting to Retell...')).toBeInTheDocument();
    });

    it('renders connected status', () => {
      mockUseRetellVoice.mockReturnValue(
        createMockRetellHookReturn({ callStatus: RetellCallStatus.CONNECTED })
      );
      render(<RetellVoiceStatus />);
      expect(screen.getByText('Connected - Ready')).toBeInTheDocument();
    });

    it('renders speaking status', () => {
      mockUseRetellVoice.mockReturnValue(
        createMockRetellHookReturn({
          callStatus: RetellCallStatus.CONNECTED,
          isAgentSpeaking: true,
        })
      );
      render(<RetellVoiceStatus />);
      expect(screen.getByText('Retell agent is responding')).toBeInTheDocument();
    });

    it('renders error status', () => {
      mockUseRetellVoice.mockReturnValue(
        createMockRetellHookReturn({ error: 'Connection failed' })
      );
      render(<RetellVoiceStatus />);
      expect(screen.getByText('Connection Error')).toBeInTheDocument();
    });

    it('displays error details', () => {
      mockUseRetellVoice.mockReturnValue(createMockRetellHookReturn({ error: 'API key invalid' }));
      render(<RetellVoiceStatus />);
      expect(screen.getByText('API key invalid')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      mockUseRetellVoice.mockReturnValue(createMockRetellHookReturn());
      const { container } = render(<RetellVoiceStatus className="custom-status" />);
      expect(container.firstChild).toHaveClass('custom-status');
    });

    it('shows speaking animation when isAgentSpeaking', () => {
      mockUseRetellVoice.mockReturnValue(
        createMockRetellHookReturn({
          callStatus: RetellCallStatus.CONNECTED,
          isAgentSpeaking: true,
        })
      );
      render(<RetellVoiceStatus />);
      expect(screen.getByText('Speaking...')).toBeInTheDocument();
    });
  });

  // ===========================================
  // RetellEmptyState Tests
  // ===========================================
  describe('RetellEmptyState', () => {
    it('renders setup required title', () => {
      render(<RetellEmptyState />);
      expect(screen.getByText('Retell Setup Required')).toBeInTheDocument();
    });

    it('renders description', () => {
      render(<RetellEmptyState />);
      expect(screen.getByText('Retell voice is not configured')).toBeInTheDocument();
    });

    it('displays missing env var', () => {
      render(<RetellEmptyState />);
      expect(screen.getByText('VITE_RETELL_AGENT_ID')).toBeInTheDocument();
    });

    it('renders settings button when onOpenSettings provided', () => {
      const onOpenSettings = vi.fn();
      render(<RetellEmptyState onOpenSettings={onOpenSettings} />);
      expect(screen.getByText('Open Settings')).toBeInTheDocument();
    });

    it('does not render settings button when onOpenSettings not provided', () => {
      render(<RetellEmptyState />);
      expect(screen.queryByText('Open Settings')).not.toBeInTheDocument();
    });

    it('calls onOpenSettings when settings button clicked', () => {
      const onOpenSettings = vi.fn();
      render(<RetellEmptyState onOpenSettings={onOpenSettings} />);
      fireEvent.click(screen.getByText('Open Settings'));
      expect(onOpenSettings).toHaveBeenCalled();
    });

    it('applies custom className', () => {
      const { container } = render(<RetellEmptyState className="custom-empty" />);
      expect(container.firstChild).toHaveClass('custom-empty');
    });
  });

  // ===========================================
  // Configuration Utility Tests
  // ===========================================
  describe('checkRetellConfiguration', () => {
    it('returns boolean', () => {
      const result = checkRetellConfiguration();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('useRetellConfigured', () => {
    it('returns isConfigured and isChecking', () => {
      const { result } = renderHook(() => useRetellConfigured());
      expect(typeof result.current.isConfigured).toBe('boolean');
      expect(result.current.isChecking).toBe(false);
    });
  });
});
