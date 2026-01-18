/**
 * GeminiEmptyState Component Tests
 *
 * Tests for the empty state component displayed when Gemini is not configured.
 * Follows patterns from VapiProvider.test.tsx and RetellProvider.test.tsx.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GeminiEmptyState } from '@/components/providers/GeminiEmptyState';

describe('GeminiEmptyState', () => {
  describe('rendering', () => {
    it('renders setup required title', () => {
      render(<GeminiEmptyState />);
      expect(screen.getByText('Gemini Setup Required')).toBeInTheDocument();
    });

    it('renders description', () => {
      render(<GeminiEmptyState />);
      expect(screen.getByText('Gemini Live voice is not configured')).toBeInTheDocument();
    });

    it('displays missing env var', () => {
      render(<GeminiEmptyState />);
      expect(screen.getByText('VITE_GEMINI_ENABLED')).toBeInTheDocument();
    });

    it('renders instructions text', () => {
      render(<GeminiEmptyState />);
      expect(
        screen.getByText(/Enable Gemini Live voice in your environment variables/)
      ).toBeInTheDocument();
    });

    it('renders alert icon', () => {
      render(<GeminiEmptyState />);
      // The AlertCircle icon should be present in the component
      const iconContainer = document.querySelector('.bg-emerald-500\\/10');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('settings button', () => {
    it('renders settings button when onOpenSettings provided', () => {
      const onOpenSettings = vi.fn();
      render(<GeminiEmptyState onOpenSettings={onOpenSettings} />);
      expect(screen.getByText('Open Settings')).toBeInTheDocument();
    });

    it('does not render settings button when onOpenSettings not provided', () => {
      render(<GeminiEmptyState />);
      expect(screen.queryByText('Open Settings')).not.toBeInTheDocument();
    });

    it('calls onOpenSettings when settings button clicked', () => {
      const onOpenSettings = vi.fn();
      render(<GeminiEmptyState onOpenSettings={onOpenSettings} />);
      fireEvent.click(screen.getByText('Open Settings'));
      expect(onOpenSettings).toHaveBeenCalledTimes(1);
    });
  });

  describe('styling', () => {
    it('applies custom className', () => {
      const { container } = render(<GeminiEmptyState className="custom-empty" />);
      expect(container.firstChild).toHaveClass('custom-empty');
    });

    it('has emerald color scheme styling', () => {
      render(<GeminiEmptyState />);
      // Check for emerald color scheme in the code display
      const codeElement = screen.getByText('VITE_GEMINI_ENABLED');
      expect(codeElement).toHaveClass('text-emerald-400/80');
    });

    it('has glassmorphism container styling', () => {
      const { container } = render(<GeminiEmptyState />);
      expect(container.firstChild).toHaveClass('backdrop-blur-lg');
    });
  });
});
