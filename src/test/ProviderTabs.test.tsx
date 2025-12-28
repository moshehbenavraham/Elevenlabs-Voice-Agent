import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProviderTabs } from '@/components/tabs/ProviderTabs';
import { ProviderProvider } from '@/contexts/ProviderContext';

// Wrapper with ProviderProvider
const TestWrapper = ({ children }: { children: ReactNode }) => (
  <ProviderProvider>{children}</ProviderProvider>
);

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
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('ProviderTabs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  describe('rendering', () => {
    it('renders all provider tabs', () => {
      render(
        <TestWrapper>
          <ProviderTabs />
        </TestWrapper>
      );

      expect(screen.getByRole('tab', { name: /elevenlabs/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /xai/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /openai/i })).toBeInTheDocument();
    });

    it('renders with correct aria-label', () => {
      render(
        <TestWrapper>
          <ProviderTabs />
        </TestWrapper>
      );

      expect(screen.getByRole('tablist', { name: /voice provider selection/i })).toBeInTheDocument();
    });

    it('shows ElevenLabs as selected by default', () => {
      render(
        <TestWrapper>
          <ProviderTabs />
        </TestWrapper>
      );

      const elevenlabsTab = screen.getByRole('tab', { name: /elevenlabs/i });
      expect(elevenlabsTab).toHaveAttribute('data-state', 'active');
    });
  });

  describe('disabled states', () => {
    it('disables xAI tab (not available)', () => {
      render(
        <TestWrapper>
          <ProviderTabs />
        </TestWrapper>
      );

      const xaiTab = screen.getByRole('tab', { name: /xai/i });
      expect(xaiTab).toBeDisabled();
    });

    it('disables OpenAI tab (not available)', () => {
      render(
        <TestWrapper>
          <ProviderTabs />
        </TestWrapper>
      );

      const openaiTab = screen.getByRole('tab', { name: /openai/i });
      expect(openaiTab).toBeDisabled();
    });

    it('shows disabled tooltip for unavailable providers', () => {
      render(
        <TestWrapper>
          <ProviderTabs />
        </TestWrapper>
      );

      const xaiTab = screen.getByRole('tab', { name: /xai/i });
      expect(xaiTab).toHaveAttribute('title', 'xAI coming soon');
    });
  });

  describe('interaction', () => {
    it('calls onProviderChange when tab is clicked', async () => {
      const user = userEvent.setup();
      const onProviderChange = vi.fn();

      render(
        <TestWrapper>
          <ProviderTabs onProviderChange={onProviderChange} />
        </TestWrapper>
      );

      const elevenlabsTab = screen.getByRole('tab', { name: /elevenlabs/i });
      await user.click(elevenlabsTab);

      // ElevenLabs is already selected and available, so callback should be called
      expect(onProviderChange).toHaveBeenCalledWith('elevenlabs');
    });

    it('does not switch to disabled tab when clicked', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <ProviderTabs />
        </TestWrapper>
      );

      const xaiTab = screen.getByRole('tab', { name: /xai/i });
      await user.click(xaiTab);

      // ElevenLabs should still be selected
      const elevenlabsTab = screen.getByRole('tab', { name: /elevenlabs/i });
      expect(elevenlabsTab).toHaveAttribute('data-state', 'active');
    });
  });

  describe('keyboard navigation', () => {
    it('tabs can be focused with keyboard', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <ProviderTabs />
        </TestWrapper>
      );

      const tabList = screen.getByRole('tablist');

      // Tab into the tablist
      await user.tab();

      // One of the tabs should be focused
      expect(tabList.contains(document.activeElement)).toBe(true);
    });
  });

  describe('content rendering', () => {
    it('renders children content when provided', () => {
      render(
        <TestWrapper>
          <ProviderTabs>
            <div data-testid="tab-content">Tab Content</div>
          </ProviderTabs>
        </TestWrapper>
      );

      expect(screen.getByTestId('tab-content')).toBeInTheDocument();
    });
  });
});
