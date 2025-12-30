import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  UltravoxProvider,
  UltravoxVoiceButton,
  UltravoxVoiceStatus,
  UltravoxEmptyState,
  checkUltravoxConfiguration,
  useUltravoxConfigured,
} from '@/components/providers/UltravoxProvider';
import { renderHook } from '@testing-library/react';

// Mock fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('UltravoxProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ joinUrl: 'wss://mock-url.com' }),
    });
  });

  describe('UltravoxVoiceButton', () => {
    it('renders with ready state by default', () => {
      render(
        <UltravoxProvider>
          <UltravoxVoiceButton />
        </UltravoxProvider>
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText('Ready')).toBeInTheDocument();
    });

    it('has correct aria-label when idle', () => {
      render(
        <UltravoxProvider>
          <UltravoxVoiceButton />
        </UltravoxProvider>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Start Ultravox voice conversation');
    });

    it('calls connect when clicked in idle state', async () => {
      const user = userEvent.setup();
      const onConnect = vi.fn();

      render(
        <UltravoxProvider>
          <UltravoxVoiceButton onConnect={onConnect} />
        </UltravoxProvider>
      );

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/ultravox/call'),
          expect.any(Object)
        );
      });
    });

    it('shows loading state while connecting', async () => {
      const user = userEvent.setup();

      render(
        <UltravoxProvider>
          <UltravoxVoiceButton />
        </UltravoxProvider>
      );

      await user.click(screen.getByRole('button'));

      expect(screen.getByText('Connecting')).toBeInTheDocument();
    });

    it('disables button while loading', async () => {
      const user = userEvent.setup();

      render(
        <UltravoxProvider>
          <UltravoxVoiceButton />
        </UltravoxProvider>
      );

      const button = screen.getByRole('button');
      await user.click(button);

      expect(button).toBeDisabled();
    });

    it('supports different sizes', () => {
      const { rerender } = render(
        <UltravoxProvider>
          <UltravoxVoiceButton size="sm" />
        </UltravoxProvider>
      );

      expect(screen.getByRole('button')).toHaveClass('w-16', 'h-16');

      rerender(
        <UltravoxProvider>
          <UltravoxVoiceButton size="md" />
        </UltravoxProvider>
      );

      expect(screen.getByRole('button')).toHaveClass('w-24', 'h-24');

      rerender(
        <UltravoxProvider>
          <UltravoxVoiceButton size="lg" />
        </UltravoxProvider>
      );

      expect(screen.getByRole('button')).toHaveClass('w-32', 'h-32');
    });

    it('applies custom className', () => {
      render(
        <UltravoxProvider>
          <UltravoxVoiceButton className="custom-class" />
        </UltravoxProvider>
      );

      const container = screen.getByRole('button').parentElement;
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('UltravoxVoiceStatus', () => {
    it('renders disconnected state by default', () => {
      render(
        <UltravoxProvider>
          <UltravoxVoiceStatus />
        </UltravoxProvider>
      );

      expect(screen.getByText('Disconnected')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <UltravoxProvider>
          <UltravoxVoiceStatus className="custom-status" />
        </UltravoxProvider>
      );

      const container = screen.getByText('Disconnected').closest('.custom-status');
      expect(container).toBeInTheDocument();
    });
  });

  describe('UltravoxEmptyState', () => {
    it('renders setup required message', () => {
      render(<UltravoxEmptyState />);

      expect(screen.getByText('Ultravox Setup Required')).toBeInTheDocument();
      expect(screen.getByText('Ultravox voice is not configured')).toBeInTheDocument();
      expect(screen.getByText('ULTRAVOX_API_KEY')).toBeInTheDocument();
    });

    it('shows settings button when onOpenSettings provided', () => {
      const onOpenSettings = vi.fn();
      render(<UltravoxEmptyState onOpenSettings={onOpenSettings} />);

      const settingsButton = screen.getByRole('button', { name: /open settings/i });
      expect(settingsButton).toBeInTheDocument();
    });

    it('calls onOpenSettings when settings button clicked', async () => {
      const user = userEvent.setup();
      const onOpenSettings = vi.fn();
      render(<UltravoxEmptyState onOpenSettings={onOpenSettings} />);

      const settingsButton = screen.getByRole('button', { name: /open settings/i });
      await user.click(settingsButton);

      expect(onOpenSettings).toHaveBeenCalled();
    });

    it('does not show settings button when onOpenSettings not provided', () => {
      render(<UltravoxEmptyState />);

      expect(screen.queryByRole('button', { name: /open settings/i })).not.toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<UltravoxEmptyState className="custom-empty" />);

      const container = screen.getByText('Ultravox Setup Required').closest('.custom-empty');
      expect(container).toBeInTheDocument();
    });
  });

  describe('checkUltravoxConfiguration', () => {
    it('returns true when server reports configured', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ configured: true }),
      });

      const result = await checkUltravoxConfiguration();
      expect(result).toBe(true);
    });

    it('returns false when server reports not configured', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ configured: false }),
      });

      const result = await checkUltravoxConfiguration();
      expect(result).toBe(false);
    });

    it('returns false when API call fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await checkUltravoxConfiguration();
      expect(result).toBe(false);
    });

    it('returns false when network error occurs', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await checkUltravoxConfiguration();
      expect(result).toBe(false);
    });
  });

  describe('useUltravoxConfigured', () => {
    it('returns initial checking state', () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ configured: true }),
      });

      const { result } = renderHook(() => useUltravoxConfigured());

      expect(result.current.isChecking).toBe(true);
      expect(result.current.isConfigured).toBe(null);
    });

    it('returns configured true after check', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ configured: true }),
      });

      const { result } = renderHook(() => useUltravoxConfigured());

      await waitFor(() => {
        expect(result.current.isChecking).toBe(false);
        expect(result.current.isConfigured).toBe(true);
      });
    });

    it('returns configured false after check', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ configured: false }),
      });

      const { result } = renderHook(() => useUltravoxConfigured());

      await waitFor(() => {
        expect(result.current.isChecking).toBe(false);
        expect(result.current.isConfigured).toBe(false);
      });
    });
  });
});
