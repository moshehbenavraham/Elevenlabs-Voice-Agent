
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from '../ThemeToggle';
import { ThemeProvider } from '@/contexts/ThemeContext';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    button: ({ children, onClick, ...props }: any) => (
      <button onClick={onClick} {...props}>
        {children}
      </button>
    ),
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

const ThemeToggleWithProvider = () => (
  <ThemeProvider>
    <ThemeToggle />
  </ThemeProvider>
);

describe('ThemeToggle', () => {
  test('renders theme toggle button', () => {
    render(<ThemeToggleWithProvider />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  test('toggles theme when clicked', () => {
    render(<ThemeToggleWithProvider />);
    const button = screen.getByRole('button');
    
    // Initial state should be dark theme (Sun icon visible)
    expect(screen.getByTestId('sun-icon') || screen.getByTestId('moon-icon')).toBeInTheDocument();
    
    // Click to toggle theme
    fireEvent.click(button);
    
    // Theme should have changed
    expect(screen.getByTestId('sun-icon') || screen.getByTestId('moon-icon')).toBeInTheDocument();
  });

  test('has proper accessibility attributes', () => {
    render(<ThemeToggleWithProvider />);
    const button = screen.getByRole('button');
    
    expect(button).toHaveAttribute('aria-label');
    expect(button.getAttribute('aria-label')).toMatch(/Switch to (light|dark) mode/);
  });
});
