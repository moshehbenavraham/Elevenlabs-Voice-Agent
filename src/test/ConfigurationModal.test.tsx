import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ConfigurationModal } from '../components/ConfigurationModal';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children: ReactNode; [key: string]: unknown }) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

describe('ConfigurationModal', () => {
  it('component renders without crashing', () => {
    const { container } = render(<ConfigurationModal isOpen={false} onClose={() => {}} />);
    expect(container).toBeInTheDocument();
  });

  it('does not render trigger button when controlled externally', () => {
    render(<ConfigurationModal isOpen={true} onClose={() => {}} />);

    // When controlled externally, trigger button should not render
    const trigger = screen.queryByTestId('dialog-trigger');
    expect(trigger).not.toBeInTheDocument();
  });

  it('renders dialog content when open', () => {
    render(<ConfigurationModal isOpen={true} onClose={() => {}} />);

    // Check for the new title text
    expect(screen.getByText('Configuration')).toBeInTheDocument();
    expect(screen.getByText('Voice agent settings')).toBeInTheDocument();
  });
});
