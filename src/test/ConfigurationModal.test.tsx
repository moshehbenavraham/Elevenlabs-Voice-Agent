import type {
  ReactNode,
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  LabelHTMLAttributes,
} from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ConfigurationModal } from '../components/ConfigurationModal';

interface MockDialogProps {
  children: ReactNode;
  open?: boolean;
}

interface MockChildrenProps {
  children: ReactNode;
}

interface MockButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
}

interface MockAlertProps {
  children: ReactNode;
  className?: string;
}

// Mock the dialog components
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: MockDialogProps) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: MockChildrenProps) => (
    <div data-testid="dialog-content">{children}</div>
  ),
  DialogDescription: ({ children }: MockChildrenProps) => <div>{children}</div>,
  DialogHeader: ({ children }: MockChildrenProps) => <div>{children}</div>,
  DialogTitle: ({ children }: MockChildrenProps) => <h2>{children}</h2>,
  DialogTrigger: ({ children }: MockChildrenProps) => (
    <div data-testid="dialog-trigger">{children}</div>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, className, ...props }: MockButtonProps) => (
    <button className={className} {...props} data-testid="button">
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/input', () => ({
  Input: (props: InputHTMLAttributes<HTMLInputElement>) => <input {...props} data-testid="input" />,
}));

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: MockChildrenProps & LabelHTMLAttributes<HTMLLabelElement>) => (
    <label {...props}>{children}</label>
  ),
}));

vi.mock('@/components/ui/alert', () => ({
  Alert: ({ children, className }: MockAlertProps) => (
    <div className={className} data-testid="alert">
      {children}
    </div>
  ),
  AlertDescription: ({ children }: MockChildrenProps) => <div>{children}</div>,
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
    expect(screen.getByText('Voice Agent Settings')).toBeInTheDocument();
  });
});
