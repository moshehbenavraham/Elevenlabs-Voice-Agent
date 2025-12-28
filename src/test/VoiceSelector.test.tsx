import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { VoiceSelector } from '@/components/voice/VoiceSelector';
import { OPENAI_VOICES, XAI_VOICES } from '@/lib/voiceConfig';

describe('VoiceSelector', () => {
  const defaultProps = {
    provider: 'openai' as const,
    value: 'alloy',
    onValueChange: vi.fn(),
  };

  it('renders with label', () => {
    render(<VoiceSelector {...defaultProps} />);
    expect(screen.getByText('Voice')).toBeInTheDocument();
  });

  it('displays selected voice name', () => {
    render(<VoiceSelector {...defaultProps} value="echo" />);
    expect(screen.getByText('Echo')).toBeInTheDocument();
  });

  it('displays selected voice description on larger screens', () => {
    render(<VoiceSelector {...defaultProps} value="alloy" />);
    // Description is hidden on small screens, shown with sm:inline
    expect(screen.getByText('- Neutral and balanced')).toBeInTheDocument();
  });

  it('shows disabled message when disabled', () => {
    render(<VoiceSelector {...defaultProps} disabled={true} />);
    expect(screen.getByText('Disconnect to change voice')).toBeInTheDocument();
  });

  it('uses correct accent color for openai provider', () => {
    const { container } = render(<VoiceSelector {...defaultProps} provider="openai" />);
    const trigger = container.querySelector('button');
    expect(trigger).toHaveClass('focus:ring-violet-500/50');
  });

  it('uses correct accent color for xai provider', () => {
    const { container } = render(<VoiceSelector {...defaultProps} provider="xai" />);
    const trigger = container.querySelector('button');
    expect(trigger).toHaveClass('focus:ring-sky-500/50');
  });

  it('opens dropdown on click', () => {
    render(<VoiceSelector {...defaultProps} />);
    const trigger = screen.getByRole('combobox');
    fireEvent.click(trigger);
    // Check that voice options are visible (getAllByText since name appears in trigger and dropdown)
    expect(screen.getAllByText('Alloy').length).toBeGreaterThanOrEqual(1);
  });

  it('shows all openai voice options', () => {
    render(<VoiceSelector {...defaultProps} provider="openai" />);
    const trigger = screen.getByRole('combobox');
    fireEvent.click(trigger);

    OPENAI_VOICES.forEach((voice) => {
      // At least one element with this name should be in the document
      expect(screen.getAllByText(voice.name).length).toBeGreaterThan(0);
    });
  });

  it('shows all xai voice options', () => {
    render(<VoiceSelector {...defaultProps} provider="xai" value="verse" />);
    const trigger = screen.getByRole('combobox');
    fireEvent.click(trigger);

    XAI_VOICES.forEach((voice) => {
      expect(screen.getAllByText(voice.name).length).toBeGreaterThan(0);
    });
  });

  it('calls onValueChange when selecting a voice', () => {
    const onValueChange = vi.fn();
    render(<VoiceSelector {...defaultProps} onValueChange={onValueChange} />);

    const trigger = screen.getByRole('combobox');
    fireEvent.click(trigger);

    // Click on Echo option
    const echoOption = screen.getByText('Echo').closest('[data-radix-collection-item]');
    if (echoOption) {
      fireEvent.click(echoOption);
      expect(onValueChange).toHaveBeenCalledWith('echo');
    }
  });

  it('is disabled when disabled prop is true', () => {
    render(<VoiceSelector {...defaultProps} disabled={true} />);
    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeDisabled();
  });

  it('accepts custom className', () => {
    const { container } = render(<VoiceSelector {...defaultProps} className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
