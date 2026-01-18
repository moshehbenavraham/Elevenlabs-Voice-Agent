/**
 * GeminiProvider Component Tests
 *
 * Component tests for Gemini provider UI elements:
 * - GeminiProvider: Provider wrapper component
 * - GeminiButton: Voice call button with state transitions
 * - GeminiVoiceStatus: Connection status display
 * - GeminiVoiceSelector: Voice selection dropdown
 *
 * Follows patterns from VapiProvider.test.tsx and RetellProvider.test.tsx.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  GeminiProvider,
  GeminiButton,
  GeminiVoiceStatus,
  checkGeminiConfiguration,
  useGeminiConfigured,
} from '@/components/providers/GeminiProvider';
import type { GeminiConnectionStatus, GeminiVoiceContextValue } from '@/types/gemini';
import { renderHook } from '@testing-library/react';

// Local gemini mocks for this test file
const geminiMocks = {
  reset: vi.fn(),
};

// Mock the useGeminiVoice hook
const mockUseGeminiVoice = vi.fn();

vi.mock('@/hooks/useGeminiVoice', () => ({
  useGeminiVoice: () => mockUseGeminiVoice(),
}));

// Mock the GeminiVoiceContext to avoid creating real client instances
vi.mock('@/contexts/GeminiVoiceContext', () => ({
  GeminiVoiceProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  GeminiVoiceContext: {
    Provider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  },
}));

// Helper to create mock hook return value
const createMockGeminiHookReturn = (
  overrides: Partial<GeminiVoiceContextValue> = {}
): GeminiVoiceContextValue => ({
  status: 'idle' as GeminiConnectionStatus,
  isConnected: false,
  isLoading: false,
  isSpeaking: false,
  isListening: false,
  isThinking: false,
  isMuted: false,
  messages: [],
  activeTranscript: '',
  pendingFunctionCall: null,
  error: null,
  sessionDuration: 0,
  sessionWarning: null,
  volume: 0.7,
  selectedVoice: 'Aoede',
  setVoice: vi.fn(),
  systemPrompt: '',
  setSystemPrompt: vi.fn(),
  connect: vi.fn().mockResolvedValue(undefined),
  disconnect: vi.fn().mockResolvedValue(undefined),
  toggleMute: vi.fn(),
  sendText: vi.fn(),
  setVolume: vi.fn(),
  clearError: vi.fn(),
  getAnalyserNode: vi.fn().mockReturnValue(null),
  reconnection: {
    status: 'idle',
    attempt: 0,
    countdown: 0,
    isOnline: true,
  },
  manualReconnect: vi.fn(),
  ...overrides,
});

describe('GeminiProvider Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    geminiMocks.reset();
    mockUseGeminiVoice.mockReturnValue(createMockGeminiHookReturn());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================
  // GeminiProvider Wrapper Tests
  // ===========================================
  describe('GeminiProvider', () => {
    it('renders children', () => {
      render(
        <GeminiProvider>
          <div data-testid="child">Child content</div>
        </GeminiProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('calls disconnect on unmount', () => {
      const mockDisconnect = vi.fn().mockResolvedValue(undefined);
      mockUseGeminiVoice.mockReturnValue(
        createMockGeminiHookReturn({ disconnect: mockDisconnect })
      );

      const { unmount } = render(
        <GeminiProvider>
          <div>Content</div>
        </GeminiProvider>
      );

      unmount();

      expect(mockDisconnect).toHaveBeenCalled();
    });
  });

  // ===========================================
  // GeminiButton Tests
  // ===========================================
  describe('GeminiButton', () => {
    describe('rendering', () => {
      it('renders with default size', () => {
        render(<GeminiButton />);
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
      });

      it('renders with small size', () => {
        render(<GeminiButton size="sm" />);
        const button = screen.getByRole('button');
        expect(button).toHaveClass('w-16', 'h-16');
      });

      it('renders with medium size', () => {
        render(<GeminiButton size="md" />);
        const button = screen.getByRole('button');
        expect(button).toHaveClass('w-24', 'h-24');
      });

      it('renders with large size', () => {
        render(<GeminiButton size="lg" />);
        const button = screen.getByRole('button');
        expect(button).toHaveClass('w-32', 'h-32');
      });

      it('applies custom className', () => {
        render(<GeminiButton className="custom-class" />);
        const container = screen.getByRole('button').parentElement;
        expect(container).toHaveClass('custom-class');
      });
    });

    describe('state transitions', () => {
      it('shows "Ready" label when idle', () => {
        mockUseGeminiVoice.mockReturnValue(createMockGeminiHookReturn());
        render(<GeminiButton />);
        expect(screen.getByText('Ready')).toBeInTheDocument();
      });

      it('shows "Connecting" label when loading', () => {
        mockUseGeminiVoice.mockReturnValue(
          createMockGeminiHookReturn({ status: 'connecting', isLoading: true })
        );
        render(<GeminiButton />);
        expect(screen.getByText('Connecting')).toBeInTheDocument();
      });

      it('shows "Live" label when connected', () => {
        mockUseGeminiVoice.mockReturnValue(
          createMockGeminiHookReturn({ status: 'connected', isConnected: true })
        );
        render(<GeminiButton />);
        expect(screen.getByText('Live')).toBeInTheDocument();
      });

      it('shows "Listening" label when listening', () => {
        mockUseGeminiVoice.mockReturnValue(
          createMockGeminiHookReturn({
            status: 'listening',
            isConnected: true,
            isListening: true,
          })
        );
        render(<GeminiButton />);
        expect(screen.getByText('Listening')).toBeInTheDocument();
      });

      it('shows "Speaking" label when speaking', () => {
        mockUseGeminiVoice.mockReturnValue(
          createMockGeminiHookReturn({
            status: 'speaking',
            isConnected: true,
            isSpeaking: true,
          })
        );
        render(<GeminiButton />);
        expect(screen.getByText('Speaking')).toBeInTheDocument();
      });

      it('shows "Thinking" label when thinking', () => {
        mockUseGeminiVoice.mockReturnValue(
          createMockGeminiHookReturn({
            status: 'thinking',
            isConnected: true,
            isThinking: true,
          })
        );
        render(<GeminiButton />);
        expect(screen.getByText('Thinking')).toBeInTheDocument();
      });

      it('shows "Error" label when error exists', () => {
        mockUseGeminiVoice.mockReturnValue(
          createMockGeminiHookReturn({ error: 'Connection failed' })
        );
        render(<GeminiButton />);
        expect(screen.getByText('Error')).toBeInTheDocument();
      });

      it('disables button when loading', () => {
        mockUseGeminiVoice.mockReturnValue(
          createMockGeminiHookReturn({ status: 'connecting', isLoading: true })
        );
        render(<GeminiButton />);
        expect(screen.getByRole('button')).toBeDisabled();
      });
    });

    describe('click handlers', () => {
      it('calls connect when clicked while idle', async () => {
        const mockConnect = vi.fn().mockResolvedValue(undefined);
        mockUseGeminiVoice.mockReturnValue(createMockGeminiHookReturn({ connect: mockConnect }));

        render(<GeminiButton />);
        fireEvent.click(screen.getByRole('button'));

        await waitFor(() => {
          expect(mockConnect).toHaveBeenCalled();
        });
      });

      it('calls disconnect when clicked while connected', async () => {
        const mockDisconnect = vi.fn().mockResolvedValue(undefined);
        mockUseGeminiVoice.mockReturnValue(
          createMockGeminiHookReturn({
            status: 'connected',
            isConnected: true,
            disconnect: mockDisconnect,
          })
        );

        render(<GeminiButton />);
        fireEvent.click(screen.getByRole('button'));

        await waitFor(() => {
          expect(mockDisconnect).toHaveBeenCalled();
        });
      });

      it('calls onConnect callback when connecting', async () => {
        const onConnect = vi.fn();
        const mockConnect = vi.fn().mockResolvedValue(undefined);
        mockUseGeminiVoice.mockReturnValue(createMockGeminiHookReturn({ connect: mockConnect }));

        render(<GeminiButton onConnect={onConnect} />);
        fireEvent.click(screen.getByRole('button'));

        await waitFor(() => {
          expect(onConnect).toHaveBeenCalled();
        });
      });

      it('calls disconnect when button is clicked while connected', async () => {
        // Note: onDisconnect callback is now handled by GeminiProviderInner to avoid duplicate callbacks
        const mockDisconnect = vi.fn().mockResolvedValue(undefined);
        mockUseGeminiVoice.mockReturnValue(
          createMockGeminiHookReturn({
            status: 'connected',
            isConnected: true,
            disconnect: mockDisconnect,
          })
        );

        render(<GeminiButton />);
        fireEvent.click(screen.getByRole('button'));

        await waitFor(() => {
          expect(mockDisconnect).toHaveBeenCalled();
        });
      });

      it('does nothing when clicked while loading', () => {
        const mockConnect = vi.fn();
        const mockDisconnect = vi.fn();
        mockUseGeminiVoice.mockReturnValue(
          createMockGeminiHookReturn({
            status: 'connecting',
            isLoading: true,
            connect: mockConnect,
            disconnect: mockDisconnect,
          })
        );

        render(<GeminiButton />);
        fireEvent.click(screen.getByRole('button'));

        expect(mockConnect).not.toHaveBeenCalled();
        expect(mockDisconnect).not.toHaveBeenCalled();
      });
    });

    describe('accessibility', () => {
      it('has correct aria-label when idle', () => {
        mockUseGeminiVoice.mockReturnValue(createMockGeminiHookReturn());
        render(<GeminiButton />);
        expect(screen.getByRole('button')).toHaveAttribute(
          'aria-label',
          'Start Gemini voice conversation'
        );
      });

      it('has correct aria-label when connecting', () => {
        mockUseGeminiVoice.mockReturnValue(
          createMockGeminiHookReturn({ status: 'connecting', isLoading: true })
        );
        render(<GeminiButton />);
        expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Connecting to Gemini...');
      });

      it('has correct aria-label when connected', () => {
        mockUseGeminiVoice.mockReturnValue(
          createMockGeminiHookReturn({ status: 'connected', isConnected: true })
        );
        render(<GeminiButton />);
        expect(screen.getByRole('button')).toHaveAttribute(
          'aria-label',
          'Connected to Gemini. Click to end call.'
        );
      });

      it('has correct aria-label when speaking', () => {
        mockUseGeminiVoice.mockReturnValue(
          createMockGeminiHookReturn({
            status: 'speaking',
            isConnected: true,
            isSpeaking: true,
          })
        );
        render(<GeminiButton />);
        expect(screen.getByRole('button')).toHaveAttribute(
          'aria-label',
          'Gemini is speaking. Click to end call.'
        );
      });

      it('has correct aria-label when thinking', () => {
        mockUseGeminiVoice.mockReturnValue(
          createMockGeminiHookReturn({
            status: 'thinking',
            isConnected: true,
            isThinking: true,
          })
        );
        render(<GeminiButton />);
        expect(screen.getByRole('button')).toHaveAttribute(
          'aria-label',
          'Gemini is thinking. Click to end call.'
        );
      });

      it('has correct aria-label when listening', () => {
        mockUseGeminiVoice.mockReturnValue(
          createMockGeminiHookReturn({
            status: 'listening',
            isConnected: true,
            isListening: true,
          })
        );
        render(<GeminiButton />);
        expect(screen.getByRole('button')).toHaveAttribute(
          'aria-label',
          'Gemini is listening. Click to end call.'
        );
      });

      it('has correct aria-label when error', () => {
        mockUseGeminiVoice.mockReturnValue(
          createMockGeminiHookReturn({ error: 'Connection failed' })
        );
        render(<GeminiButton />);
        expect(screen.getByRole('button')).toHaveAttribute(
          'aria-label',
          'Error: Connection failed. Click to retry.'
        );
      });

      it('has aria-pressed attribute when connected', () => {
        mockUseGeminiVoice.mockReturnValue(
          createMockGeminiHookReturn({ status: 'connected', isConnected: true })
        );
        render(<GeminiButton />);
        expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
      });

      it('has role="button" attribute', () => {
        render(<GeminiButton />);
        expect(screen.getByRole('button')).toHaveAttribute('role', 'button');
      });
    });
  });

  // ===========================================
  // GeminiVoiceStatus Tests
  // ===========================================
  describe('GeminiVoiceStatus', () => {
    it('renders disconnected status', () => {
      mockUseGeminiVoice.mockReturnValue(createMockGeminiHookReturn());
      render(<GeminiVoiceStatus />);
      expect(screen.getByText('Disconnected')).toBeInTheDocument();
    });

    it('renders connecting status', () => {
      mockUseGeminiVoice.mockReturnValue(
        createMockGeminiHookReturn({ status: 'connecting', isLoading: true })
      );
      render(<GeminiVoiceStatus />);
      expect(screen.getByText('Connecting to Gemini...')).toBeInTheDocument();
    });

    it('renders connected status', () => {
      mockUseGeminiVoice.mockReturnValue(
        createMockGeminiHookReturn({ status: 'connected', isConnected: true })
      );
      render(<GeminiVoiceStatus />);
      expect(screen.getByText('Connected - Ready')).toBeInTheDocument();
    });

    it('renders listening status', () => {
      mockUseGeminiVoice.mockReturnValue(
        createMockGeminiHookReturn({
          status: 'listening',
          isConnected: true,
          isListening: true,
        })
      );
      render(<GeminiVoiceStatus />);
      expect(screen.getByText('Listening - speak now')).toBeInTheDocument();
    });

    it('renders speaking status', () => {
      mockUseGeminiVoice.mockReturnValue(
        createMockGeminiHookReturn({
          status: 'speaking',
          isConnected: true,
          isSpeaking: true,
        })
      );
      render(<GeminiVoiceStatus />);
      expect(screen.getByText('Gemini is speaking')).toBeInTheDocument();
    });

    it('renders thinking status', () => {
      mockUseGeminiVoice.mockReturnValue(
        createMockGeminiHookReturn({
          status: 'thinking',
          isConnected: true,
          isThinking: true,
        })
      );
      render(<GeminiVoiceStatus />);
      expect(screen.getByText('Gemini is thinking...')).toBeInTheDocument();
    });

    it('renders error status', () => {
      mockUseGeminiVoice.mockReturnValue(
        createMockGeminiHookReturn({ error: 'Connection failed' })
      );
      render(<GeminiVoiceStatus />);
      expect(screen.getByText('Connection Error')).toBeInTheDocument();
    });

    it('displays error details', () => {
      mockUseGeminiVoice.mockReturnValue(createMockGeminiHookReturn({ error: 'API key invalid' }));
      render(<GeminiVoiceStatus />);
      expect(screen.getByText('API key invalid')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      mockUseGeminiVoice.mockReturnValue(createMockGeminiHookReturn());
      const { container } = render(<GeminiVoiceStatus className="custom-status" />);
      expect(container.firstChild).toHaveClass('custom-status');
    });

    it('shows speaking animation when isSpeaking', () => {
      mockUseGeminiVoice.mockReturnValue(
        createMockGeminiHookReturn({
          status: 'speaking',
          isConnected: true,
          isSpeaking: true,
        })
      );
      render(<GeminiVoiceStatus />);
      expect(screen.getByText('Speaking...')).toBeInTheDocument();
    });

    it('shows thinking animation when isThinking', () => {
      mockUseGeminiVoice.mockReturnValue(
        createMockGeminiHookReturn({
          status: 'thinking',
          isConnected: true,
          isThinking: true,
        })
      );
      render(<GeminiVoiceStatus />);
      expect(screen.getByText('Thinking...')).toBeInTheDocument();
    });

    describe('session timer', () => {
      it('shows session duration when connected', () => {
        mockUseGeminiVoice.mockReturnValue(
          createMockGeminiHookReturn({
            status: 'connected',
            isConnected: true,
            sessionDuration: 120,
          })
        );
        render(<GeminiVoiceStatus />);
        expect(screen.getByText('02:00')).toBeInTheDocument();
      });

      it('shows warning state at 12 minutes', () => {
        mockUseGeminiVoice.mockReturnValue(
          createMockGeminiHookReturn({
            status: 'connected',
            isConnected: true,
            sessionDuration: 720,
            sessionWarning: 'warning',
          })
        );
        render(<GeminiVoiceStatus />);
        expect(
          screen.getByText('Session has been active for over 12 minutes.')
        ).toBeInTheDocument();
      });

      it('shows urgent state at 14 minutes', () => {
        mockUseGeminiVoice.mockReturnValue(
          createMockGeminiHookReturn({
            status: 'connected',
            isConnected: true,
            sessionDuration: 840,
            sessionWarning: 'urgent',
          })
        );
        render(<GeminiVoiceStatus />);
        expect(
          screen.getByText('Session ending soon. Conversation will disconnect at 15 minutes.')
        ).toBeInTheDocument();
      });
    });
  });

  // ===========================================
  // Configuration Utility Tests
  // ===========================================
  describe('checkGeminiConfiguration', () => {
    it('returns boolean', () => {
      const result = checkGeminiConfiguration();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('useGeminiConfigured', () => {
    it('returns isConfigured and isChecking', () => {
      const { result } = renderHook(() => useGeminiConfigured());
      expect(typeof result.current.isConfigured).toBe('boolean');
      expect(result.current.isChecking).toBe(false);
    });
  });
});
