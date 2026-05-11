import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OpenAITranslationProvider } from '@/components/providers/OpenAITranslationProvider';
import {
  OPENAI_TRANSLATION_LANGUAGE_COUNT,
  getOpenAITranslationSourceModes,
} from '@/lib/openaiTranslation';

describe('OpenAITranslationProvider', () => {
  const fetchMock = vi.fn();
  const getUserMediaMock = vi.mocked(navigator.mediaDevices.getUserMedia);
  const getDisplayMediaMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockClear();
    getUserMediaMock.mockClear();
    getDisplayMediaMock.mockClear();
    Object.assign(navigator.mediaDevices, {
      getDisplayMedia: getDisplayMediaMock,
    });
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('isSecureContext', true);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders scaffold sections and accessible status semantics', () => {
    render(<OpenAITranslationProvider />);

    expect(
      screen.getByRole('heading', { name: /live translation/i, level: 1 })
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /source mode/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /target language/i })).toBeInTheDocument();

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveTextContent('No translation session started');
    expect(status).toHaveTextContent('No scaffold errors');
    expect(status).toHaveTextContent('Online');
  });

  it('renders shared target language metadata without duplicating constants in the test', () => {
    render(<OpenAITranslationProvider />);

    expect(screen.getByRole('combobox', { name: /deferred target language/i })).toHaveValue('en');
    expect(screen.getByRole('option', { name: 'English' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Spanish' })).toBeInTheDocument();
    expect(
      screen.getByText(
        new RegExp(`${OPENAI_TRANSLATION_LANGUAGE_COUNT} supported target languages`, 'i')
      )
    ).toBeInTheDocument();
  });

  it('renders shared source metadata and capability-aware state without capture actions', () => {
    const sourceModes = getOpenAITranslationSourceModes();

    render(<OpenAITranslationProvider />);

    for (const sourceMode of sourceModes) {
      expect(
        screen.getByRole('button', {
          name: new RegExp(`${sourceMode.label} source mode available`, 'i'),
        })
      ).toBeDisabled();
      expect(screen.getByText(sourceMode.description)).toBeInTheDocument();
    }
    expect(screen.getAllByText('Available')).toHaveLength(sourceModes.length);
    expect(getUserMediaMock).not.toHaveBeenCalled();
    expect(getDisplayMediaMock).not.toHaveBeenCalled();
  });

  it('keeps source, language, and start controls disabled while runtime is deferred', () => {
    render(<OpenAITranslationProvider />);

    expect(
      screen.getByRole('button', { name: /microphone source mode available/i })
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: /tab audio source mode available/i })).toBeDisabled();
    expect(screen.getByRole('combobox', { name: /deferred target language/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /start translation/i })).toBeDisabled();
  });

  it('does not request media permissions or call the translation route when rendered', () => {
    render(<OpenAITranslationProvider />);

    expect(getUserMediaMock).not.toHaveBeenCalled();
    expect(getDisplayMediaMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('renders loading, offline, and error scaffold states from page-owned props', () => {
    render(
      <OpenAITranslationProvider
        isLoading={true}
        isEmpty={false}
        isOffline={true}
        errorMessage="Translation scaffold unavailable"
      />
    );

    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Preparing scaffold');
    expect(status).toHaveTextContent('Session placeholder occupied');
    expect(status).toHaveTextContent('Translation scaffold unavailable');
    expect(status).toHaveTextContent('Offline');
    expect(screen.getByRole('button', { name: /start translation/i })).toBeDisabled();
  });
});
