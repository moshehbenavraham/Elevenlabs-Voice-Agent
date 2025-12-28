import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FunctionCallIndicator } from '../FunctionCallIndicator';
import type { FunctionCall } from '@/types';

describe('FunctionCallIndicator', () => {
  const baseFunctionCall: FunctionCall = {
    callId: 'test-call-123',
    name: 'get_weather',
    arguments: { location: 'Tokyo' },
    status: 'pending',
  };

  describe('pending state', () => {
    it('renders with pending status', () => {
      const functionCall: FunctionCall = {
        ...baseFunctionCall,
        status: 'pending',
      };

      render(<FunctionCallIndicator functionCall={functionCall} />);

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Preparing function...')).toBeInTheDocument();
    });
  });

  describe('executing state', () => {
    it('renders with executing status', () => {
      const functionCall: FunctionCall = {
        ...baseFunctionCall,
        status: 'executing',
      };

      render(<FunctionCallIndicator functionCall={functionCall} />);

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Executing get_weather...')).toBeInTheDocument();
    });

    it('shows function name in executing message', () => {
      const functionCall: FunctionCall = {
        ...baseFunctionCall,
        name: 'calculate',
        status: 'executing',
      };

      render(<FunctionCallIndicator functionCall={functionCall} />);

      expect(screen.getByText('Executing calculate...')).toBeInTheDocument();
    });
  });

  describe('completed state', () => {
    it('renders with completed status', () => {
      const functionCall: FunctionCall = {
        ...baseFunctionCall,
        status: 'completed',
        result: { temperature: 20 },
      };

      render(<FunctionCallIndicator functionCall={functionCall} />);

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('renders with error status', () => {
      const functionCall: FunctionCall = {
        ...baseFunctionCall,
        status: 'error',
        error: 'Function timed out',
      };

      render(<FunctionCallIndicator functionCall={functionCall} />);

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Failed')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has role="status" for screen readers', () => {
      render(<FunctionCallIndicator functionCall={baseFunctionCall} />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('has aria-live="polite" for announcements', () => {
      render(<FunctionCallIndicator functionCall={baseFunctionCall} />);

      expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <FunctionCallIndicator functionCall={baseFunctionCall} className="custom-class" />
      );

      const element = container.querySelector('.custom-class');
      expect(element).toBeInTheDocument();
    });
  });
});
