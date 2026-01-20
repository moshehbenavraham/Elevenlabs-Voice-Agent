/**
 * VapiProvider Component Tests
 *
 * Component tests for Vapi provider UI elements:
 * - VapiButton: Voice call button with state transitions
 * - VapiVoiceStatus: Connection status display
 * - VapiEmptyState: Unconfigured state display
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  VapiProvider,
  VapiButton,
  VapiVoiceStatus,
  VapiEmptyState,
  checkVapiConfiguration,
  useVapiConfigured,
} from '@/components/providers/VapiProvider';
import { VapiCallStatus } from '@/types/vapi';
import { vapiMocks } from './setup';
import { renderHook } from '@testing-library/react';

// Mock the useVapiVoice hook (used by VapiVoiceProvider)
const mockUseVapiVoice = vi.fn();

vi.mock('@/hooks/useVapiVoice', () => ({
  useVapiVoice: () => mockUseVapiVoice(),
}));

// Mock useVapiVoiceContext for standalone component tests
const mockUseVapiVoiceContext = vi.fn();

vi.mock('@/contexts/VapiVoiceContext', async () => {
  const actual = await vi.importActual('@/contexts/VapiVoiceContext');
  return {
    ...actual,
    useVapiVoiceContext: () => mockUseVapiVoiceContext(),
  };
});

// Mock the vapi module
vi.mock('@/lib/vapi', () => ({
  vapi: {
    start: vi.fn(),
    stop: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    getDailyCallObject: vi.fn(),
  },
  prepareAudioContext: vi.fn().mockReturnValue(null),
  cleanupAudioContext: vi.fn(),
  getVapiDebugInfo: vi.fn().mockReturnValue({
    sdkInitialized: true,
    webTokenConfigured: true,
    audioContext: null,
    dailyCallObject: null,
  }),
}));

// Helper to create mock hook return value
const createMockHookReturn = (overrides = {}) => ({
  callStatus: VapiCallStatus.INACTIVE,
  isSpeechActive: false,
  messages: [],
  activeTranscript: null,
  audioLevel: 0,
  error: null,
  start: vi.fn().mockResolvedValue(undefined),
  stop: vi.fn(),
  toggleCall: vi.fn(),
  ...overrides,
});

describe('VapiProvider Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vapiMocks.reset();
    mockUseVapiVoice.mockReturnValue(createMockHookReturn());
    mockUseVapiVoiceContext.mockReturnValue(createMockHookReturn());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================
  // T013: VapiProvider Wrapper Tests
  // ===========================================
  describe('VapiProvider', () => {
    it('renders children', () => {
      render(
        <VapiProvider>
          <div data-testid="child">Child content</div>
        </VapiProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('calls stop on unmount', () => {
      const mockStop = vi.fn();
      mockUseVapiVoiceContext.mockReturnValue(createMockHookReturn({ stop: mockStop }));

      const { unmount } = render(
        <VapiProvider>
          <div>Content</div>
        </VapiProvider>
      );

      unmount();

      expect(mockStop).toHaveBeenCalled();
    });
  });

  // ===========================================
  // T014: VapiButton Tests
  // ===========================================
  describe('VapiButton', () => {
    describe('rendering', () => {
      it('renders with default size', () => {
        render(<VapiButton />);
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
      });

      it('renders with small size', () => {
        render(<VapiButton size="sm" />);
        const button = screen.getByRole('button');
        expect(button).toHaveClass('w-16', 'h-16');
      });

      it('renders with medium size', () => {
        render(<VapiButton size="md" />);
        const button = screen.getByRole('button');
        expect(button).toHaveClass('w-24', 'h-24');
      });

      it('renders with large size', () => {
        render(<VapiButton size="lg" />);
        const button = screen.getByRole('button');
        expect(button).toHaveClass('w-32', 'h-32');
      });

      it('applies custom className', () => {
        render(<VapiButton className="custom-class" />);
        const container = screen.getByRole('button').parentElement;
        expect(container).toHaveClass('custom-class');
      });
    });

    describe('state transitions', () => {
      it('shows "Ready" label when idle', () => {
        mockUseVapiVoiceContext.mockReturnValue(createMockHookReturn());
        render(<VapiButton />);
        expect(screen.getByText('Ready')).toBeInTheDocument();
      });

      it('shows "Connecting" label when loading', () => {
        mockUseVapiVoiceContext.mockReturnValue(
          createMockHookReturn({ callStatus: VapiCallStatus.LOADING })
        );
        render(<VapiButton />);
        expect(screen.getByText('Connecting')).toBeInTheDocument();
      });

      it('shows "Live" label when connected', () => {
        mockUseVapiVoiceContext.mockReturnValue(
          createMockHookReturn({ callStatus: VapiCallStatus.ACTIVE })
        );
        render(<VapiButton />);
        expect(screen.getByText('Live')).toBeInTheDocument();
      });

      it('shows "Speaking" label when speaking', () => {
        mockUseVapiVoiceContext.mockReturnValue(
          createMockHookReturn({
            callStatus: VapiCallStatus.ACTIVE,
            isSpeechActive: true,
          })
        );
        render(<VapiButton />);
        expect(screen.getByText('Speaking')).toBeInTheDocument();
      });

      it('shows "Error" label when error exists', () => {
        mockUseVapiVoiceContext.mockReturnValue(
          createMockHookReturn({ error: 'Connection failed' })
        );
        render(<VapiButton />);
        expect(screen.getByText('Error')).toBeInTheDocument();
      });

      it('disables button when loading', () => {
        mockUseVapiVoiceContext.mockReturnValue(
          createMockHookReturn({ callStatus: VapiCallStatus.LOADING })
        );
        render(<VapiButton />);
        expect(screen.getByRole('button')).toBeDisabled();
      });
    });

    describe('click handlers', () => {
      it('calls start when clicked while idle', async () => {
        const mockStart = vi.fn().mockResolvedValue(undefined);
        mockUseVapiVoiceContext.mockReturnValue(createMockHookReturn({ start: mockStart }));

        render(<VapiButton />);
        fireEvent.click(screen.getByRole('button'));

        await waitFor(() => {
          expect(mockStart).toHaveBeenCalled();
        });
      });

      it('calls stop when clicked while connected', () => {
        const mockStop = vi.fn();
        mockUseVapiVoiceContext.mockReturnValue(
          createMockHookReturn({
            callStatus: VapiCallStatus.ACTIVE,
            stop: mockStop,
          })
        );

        render(<VapiButton />);
        fireEvent.click(screen.getByRole('button'));

        expect(mockStop).toHaveBeenCalled();
      });

      it('calls onConnect callback when connecting', async () => {
        const onConnect = vi.fn();
        const mockStart = vi.fn().mockResolvedValue(undefined);
        mockUseVapiVoiceContext.mockReturnValue(createMockHookReturn({ start: mockStart }));

        render(<VapiButton onConnect={onConnect} />);
        fireEvent.click(screen.getByRole('button'));

        await waitFor(() => {
          expect(onConnect).toHaveBeenCalled();
        });
      });

      it('calls onDisconnect callback when disconnecting', () => {
        const onDisconnect = vi.fn();
        const mockStop = vi.fn();
        mockUseVapiVoiceContext.mockReturnValue(
          createMockHookReturn({
            callStatus: VapiCallStatus.ACTIVE,
            stop: mockStop,
          })
        );

        render(<VapiButton onDisconnect={onDisconnect} />);
        fireEvent.click(screen.getByRole('button'));

        expect(onDisconnect).toHaveBeenCalled();
      });

      it('does nothing when clicked while loading', () => {
        const mockStart = vi.fn();
        const mockStop = vi.fn();
        mockUseVapiVoiceContext.mockReturnValue(
          createMockHookReturn({
            callStatus: VapiCallStatus.LOADING,
            start: mockStart,
            stop: mockStop,
          })
        );

        render(<VapiButton />);
        fireEvent.click(screen.getByRole('button'));

        expect(mockStart).not.toHaveBeenCalled();
        expect(mockStop).not.toHaveBeenCalled();
      });
    });

    describe('accessibility', () => {
      it('has correct aria-label when idle', () => {
        mockUseVapiVoiceContext.mockReturnValue(createMockHookReturn());
        render(<VapiButton />);
        expect(screen.getByRole('button')).toHaveAttribute(
          'aria-label',
          'Start Vapi voice conversation'
        );
      });

      it('has correct aria-label when connecting', () => {
        mockUseVapiVoiceContext.mockReturnValue(
          createMockHookReturn({ callStatus: VapiCallStatus.LOADING })
        );
        render(<VapiButton />);
        expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Connecting to Vapi...');
      });

      it('has correct aria-label when connected', () => {
        mockUseVapiVoiceContext.mockReturnValue(
          createMockHookReturn({ callStatus: VapiCallStatus.ACTIVE })
        );
        render(<VapiButton />);
        expect(screen.getByRole('button')).toHaveAttribute(
          'aria-label',
          'Connected to Vapi. Click to end call.'
        );
      });

      it('has correct aria-label when speaking', () => {
        mockUseVapiVoiceContext.mockReturnValue(
          createMockHookReturn({
            callStatus: VapiCallStatus.ACTIVE,
            isSpeechActive: true,
          })
        );
        render(<VapiButton />);
        expect(screen.getByRole('button')).toHaveAttribute(
          'aria-label',
          'Vapi is speaking. Click to end call.'
        );
      });

      it('has correct aria-label when error', () => {
        mockUseVapiVoiceContext.mockReturnValue(
          createMockHookReturn({ error: 'Connection failed' })
        );
        render(<VapiButton />);
        expect(screen.getByRole('button')).toHaveAttribute(
          'aria-label',
          'Error: Connection failed. Click to retry.'
        );
      });

      it('has aria-pressed attribute', () => {
        mockUseVapiVoiceContext.mockReturnValue(
          createMockHookReturn({ callStatus: VapiCallStatus.ACTIVE })
        );
        render(<VapiButton />);
        expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
      });
    });
  });

  // ===========================================
  // T015: VapiVoiceStatus Tests
  // ===========================================
  describe('VapiVoiceStatus', () => {
    it('renders disconnected status', () => {
      mockUseVapiVoiceContext.mockReturnValue(createMockHookReturn());
      render(<VapiVoiceStatus />);
      expect(screen.getByText('Disconnected')).toBeInTheDocument();
    });

    it('renders connecting status', () => {
      mockUseVapiVoiceContext.mockReturnValue(
        createMockHookReturn({ callStatus: VapiCallStatus.LOADING })
      );
      render(<VapiVoiceStatus />);
      expect(screen.getByText('Connecting to Vapi...')).toBeInTheDocument();
    });

    it('renders connected status', () => {
      mockUseVapiVoiceContext.mockReturnValue(
        createMockHookReturn({ callStatus: VapiCallStatus.ACTIVE })
      );
      render(<VapiVoiceStatus />);
      expect(screen.getByText('Connected - Ready')).toBeInTheDocument();
    });

    it('renders speaking status', () => {
      mockUseVapiVoiceContext.mockReturnValue(
        createMockHookReturn({
          callStatus: VapiCallStatus.ACTIVE,
          isSpeechActive: true,
        })
      );
      render(<VapiVoiceStatus />);
      expect(screen.getByText('Vapi is responding')).toBeInTheDocument();
    });

    it('renders error status', () => {
      mockUseVapiVoiceContext.mockReturnValue(createMockHookReturn({ error: 'Connection failed' }));
      render(<VapiVoiceStatus />);
      expect(screen.getByText('Connection Error')).toBeInTheDocument();
    });

    it('displays error details', () => {
      mockUseVapiVoiceContext.mockReturnValue(createMockHookReturn({ error: 'API key invalid' }));
      render(<VapiVoiceStatus />);
      expect(screen.getByText('API key invalid')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      mockUseVapiVoiceContext.mockReturnValue(createMockHookReturn());
      const { container } = render(<VapiVoiceStatus className="custom-status" />);
      expect(container.firstChild).toHaveClass('custom-status');
    });

    it('shows speaking animation when isSpeechActive', () => {
      mockUseVapiVoiceContext.mockReturnValue(
        createMockHookReturn({
          callStatus: VapiCallStatus.ACTIVE,
          isSpeechActive: true,
        })
      );
      render(<VapiVoiceStatus />);
      expect(screen.getByText('Speaking...')).toBeInTheDocument();
    });
  });

  // ===========================================
  // VapiEmptyState Tests
  // ===========================================
  describe('VapiEmptyState', () => {
    it('renders setup required title', () => {
      render(<VapiEmptyState />);
      expect(screen.getByText('Vapi Setup Required')).toBeInTheDocument();
    });

    it('renders description', () => {
      render(<VapiEmptyState />);
      expect(screen.getByText('Vapi voice is not configured')).toBeInTheDocument();
    });

    it('displays missing env var', () => {
      render(<VapiEmptyState />);
      expect(screen.getByText('VITE_VAPI_WEB_TOKEN')).toBeInTheDocument();
    });

    it('renders settings button when onOpenSettings provided', () => {
      const onOpenSettings = vi.fn();
      render(<VapiEmptyState onOpenSettings={onOpenSettings} />);
      expect(screen.getByText('Open Settings')).toBeInTheDocument();
    });

    it('does not render settings button when onOpenSettings not provided', () => {
      render(<VapiEmptyState />);
      expect(screen.queryByText('Open Settings')).not.toBeInTheDocument();
    });

    it('calls onOpenSettings when settings button clicked', () => {
      const onOpenSettings = vi.fn();
      render(<VapiEmptyState onOpenSettings={onOpenSettings} />);
      fireEvent.click(screen.getByText('Open Settings'));
      expect(onOpenSettings).toHaveBeenCalled();
    });

    it('applies custom className', () => {
      const { container } = render(<VapiEmptyState className="custom-empty" />);
      expect(container.firstChild).toHaveClass('custom-empty');
    });
  });

  // ===========================================
  // Configuration Utility Tests
  // ===========================================
  describe('checkVapiConfiguration', () => {
    it('returns boolean', () => {
      const result = checkVapiConfiguration();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('useVapiConfigured', () => {
    it('returns isConfigured and isChecking', () => {
      const { result } = renderHook(() => useVapiConfigured());
      expect(typeof result.current.isConfigured).toBe('boolean');
      expect(result.current.isChecking).toBe(false);
    });
  });
});
