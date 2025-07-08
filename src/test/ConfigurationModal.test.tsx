import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ConfigurationModal } from '../components/ConfigurationModal';

// Mock the dialog components
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogDescription: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogTrigger: ({ children }: any) => <div data-testid="dialog-trigger">{children}</div>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, className, ...props }: any) => (
    <button className={className} {...props} data-testid="button">
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} data-testid="input" />,
}));

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}));

vi.mock('@/components/ui/alert', () => ({
  Alert: ({ children, className }: any) => <div className={className} data-testid="alert">{children}</div>,
  AlertDescription: ({ children }: any) => <div>{children}</div>,
}));

describe('ConfigurationModal', () => {
  it('component renders without crashing', () => {
    const { container } = render(<ConfigurationModal />);
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
    
    expect(screen.getByTestId('dialog-content')).toBeInTheDocument();
    expect(screen.getByText('ElevenLabs Configuration')).toBeInTheDocument();
  });
});