import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../App';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    // Basic test to ensure the app renders
    expect(document.body).toBeInTheDocument();
  });

  it('renders the app component', () => {
    const { container } = render(<App />);
    // Check that the app component renders something
    expect(container.firstChild).not.toBeNull();
  });
});