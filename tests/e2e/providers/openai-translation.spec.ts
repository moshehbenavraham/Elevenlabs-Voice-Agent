import { expect, test, type Page } from '@playwright/test';
import { VoicePage } from '../page-objects/VoicePage';
import {
  type OpenAITranslationMockController,
  type OpenAITranslationMockOptions,
  emitOpenAITranslationTranscript,
  emitUnknownOpenAITranslationEvent,
  resetOpenAITranslationMock,
  setupOpenAITranslationMock,
} from '../utils/openai-translation-mock';

interface TranslationHarness {
  readonly voicePage: VoicePage;
  readonly controller: OpenAITranslationMockController;
}

async function openTranslationHarness(
  page: Page,
  options: OpenAITranslationMockOptions = {}
): Promise<TranslationHarness> {
  const controller = await setupOpenAITranslationMock(page, options);
  const voicePage = new VoicePage(page);

  await voicePage.goto();
  await expect(voicePage.providerTabOpenaiTranslation).toBeVisible();
  await voicePage.selectOpenAITranslationProvider();
  await expect(page.getByRole('heading', { name: /live translation/i })).toBeVisible();

  return { voicePage, controller };
}

async function expectTranslationConnected(voicePage: VoicePage): Promise<void> {
  await expect(voicePage.getOpenAITranslationStatusPanel()).toContainText(
    /translation connected/i,
    { timeout: 10000 }
  );
}

async function switchAwayFromTranslation(page: Page): Promise<string> {
  const candidates = ['openai', 'xai', 'elevenlabs-sdk', 'elevenlabs'] as const;

  for (const provider of candidates) {
    const tab = page.getByTestId(`provider-tab-${provider}`);
    if ((await tab.count()) === 0 || !(await tab.isEnabled())) {
      continue;
    }

    await tab.click();
    await expect(tab).toHaveAttribute('data-state', 'active', { timeout: 10000 });
    return provider;
  }

  throw new Error('No enabled provider tab is available for provider-switch cleanup testing.');
}

test.describe('OpenAI Translation provider', () => {
  test.afterEach(async ({ page }) => {
    await resetOpenAITranslationMock(page).catch(() => undefined);
  });

  test('renders the feature-flagged tab and initial translation controls', async ({ page }) => {
    const { voicePage } = await openTranslationHarness(page);

    await expect(voicePage.providerTabOpenaiTranslation).toHaveAttribute('data-state', 'active');
    await expect(voicePage.getOpenAITranslationSourceOption('microphone')).toBeVisible();
    await expect(voicePage.getOpenAITranslationSourceOption('browser-tab')).toBeVisible();
    await expect(page.getByLabel('Target language', { exact: true })).toBeVisible();
    await expect(voicePage.getOpenAITranslationStartButton()).toBeEnabled();
    await expect(voicePage.getOpenAITranslationStopButton()).toBeDisabled();
    await expect(voicePage.getOpenAITranslationStatusPanel()).toContainText(/ready to translate/i);
    await expect(voicePage.getOpenAITranslationDiagnosticsPanel()).toContainText(
      /ready diagnostic/i
    );
    await expect(voicePage.getOpenAITranslationTranscriptLog()).toContainText(
      /no transcript lines/i
    );
    await expect(page.getByRole('button', { name: /export markdown/i })).toBeDisabled();
    await expect(voicePage.getOpenAITranslationAudioPlayer()).toBeVisible();
  });

  test('keeps start and stop controls guarded while source capture is pending', async ({
    page,
  }) => {
    const { voicePage } = await openTranslationHarness(page, { mediaDelayMs: 600 });

    await voicePage.startOpenAITranslation();

    await expect(voicePage.getOpenAITranslationStartButton()).toBeDisabled();
    await expect(voicePage.getOpenAITranslationStartButton()).toHaveAttribute('aria-busy', 'true');
    await expect(voicePage.getOpenAITranslationStopButton()).toBeEnabled();
    await expect(voicePage.getOpenAITranslationStatusPanel()).toContainText(
      /requesting audio source/i
    );
    await expectTranslationConnected(voicePage);

    const mockState = await voicePage.getOpenAITranslationMockState();
    expect(mockState.media.getUserMediaCalls).toBe(1);
    expect(mockState.rtc.peerConnectionsCreated).toBe(1);
  });

  test('prevents duplicate starts while the client-secret route is pending', async ({ page }) => {
    const { voicePage, controller } = await openTranslationHarness(page, {
      clientSecretDelayMs: 700,
    });

    await voicePage.startOpenAITranslation();
    await expect(voicePage.getOpenAITranslationStatusPanel()).toContainText(
      /requesting client secret/i
    );
    await expect(voicePage.getOpenAITranslationStartButton()).toBeDisabled();
    await voicePage.getOpenAITranslationStartButton().dispatchEvent('click');
    await expectTranslationConnected(voicePage);

    expect(controller.getRouteState().clientSecretRequests).toBe(1);
    expect(controller.getRouteState().sdpRequests).toBe(1);
  });

  test('keeps controls disabled during SDP exchange and WebRTC setup latency', async ({ page }) => {
    const { voicePage, controller } = await openTranslationHarness(page, {
      sdpDelayMs: 500,
      remoteDescriptionDelayMs: 500,
    });

    await voicePage.startOpenAITranslation();

    await expect(voicePage.getOpenAITranslationStatusPanel()).toContainText(
      /connecting translation/i
    );
    await expect(voicePage.getOpenAITranslationStartButton()).toBeDisabled();
    await expect(voicePage.getOpenAITranslationStopButton()).toBeEnabled();
    await voicePage.getOpenAITranslationStartButton().dispatchEvent('click');
    await expectTranslationConnected(voicePage);

    expect(controller.getRouteState().clientSecretRequests).toBe(1);
    expect(controller.getRouteState().sdpRequests).toBe(1);
    const mockState = await voicePage.getOpenAITranslationMockState();
    expect(mockState.rtc.peerConnectionsCreated).toBe(1);
  });

  test('falls back to microphone when browser-tab capture is unsupported', async ({ page }) => {
    const { voicePage } = await openTranslationHarness(page, {
      browserTabMode: 'unsupported',
    });

    await expect(voicePage.getOpenAITranslationSourceOption('browser-tab')).toBeDisabled();
    await expect(voicePage.getOpenAITranslationSourceOption('browser-tab')).toHaveAttribute(
      'aria-label',
      /tab audio source unsupported/i
    );

    await voicePage.startOpenAITranslation();
    await expectTranslationConnected(voicePage);

    const mockState = await voicePage.getOpenAITranslationMockState();
    expect(mockState.media.getDisplayMediaCalls).toBe(0);
    expect(mockState.media.getUserMediaCalls).toBe(1);
  });

  test('shows browser-tab permission denial diagnostics', async ({ page }) => {
    const { voicePage, controller } = await openTranslationHarness(page, {
      browserTabMode: 'permission-denied',
    });

    await voicePage.selectOpenAITranslationSource('browser-tab');
    await voicePage.startOpenAITranslation();

    await expect(voicePage.getOpenAITranslationDiagnosticsPanel()).toContainText(
      /source permission denied/i
    );
    await expect(voicePage.getOpenAITranslationDiagnosticsPanel()).toContainText(
      /grant permission/i
    );
    await expect(voicePage.getOpenAITranslationStartButton()).toBeEnabled();
    expect(controller.getRouteState().clientSecretRequests).toBe(0);
  });

  test('shows browser-tab cancellation diagnostics', async ({ page }) => {
    const { voicePage, controller } = await openTranslationHarness(page, {
      browserTabMode: 'cancelled',
    });

    await voicePage.selectOpenAITranslationSource('browser-tab');
    await voicePage.startOpenAITranslation();

    await expect(voicePage.getOpenAITranslationDiagnosticsPanel()).toContainText(
      /source selection cancelled/i
    );
    await expect(voicePage.getOpenAITranslationDiagnosticsPanel()).toContainText(
      /choose source again/i
    );
    await expect(voicePage.getOpenAITranslationStartButton()).toBeEnabled();
    expect(controller.getRouteState().clientSecretRequests).toBe(0);
  });

  test('shows browser-tab missing audio diagnostics', async ({ page }) => {
    const { voicePage, controller } = await openTranslationHarness(page, {
      browserTabMode: 'no-audio',
    });

    await voicePage.selectOpenAITranslationSource('browser-tab');
    await voicePage.startOpenAITranslation();

    await expect(voicePage.getOpenAITranslationDiagnosticsPanel()).toContainText(
      /no audio track found/i
    );
    await expect(voicePage.getOpenAITranslationDiagnosticsPanel()).toContainText(/share audio/i);
    await expect(voicePage.getOpenAITranslationStartButton()).toBeEnabled();
    expect(controller.getRouteState().clientSecretRequests).toBe(0);

    const mockState = await voicePage.getOpenAITranslationMockState();
    expect(mockState.media.getDisplayMediaCalls).toBe(1);
    expect(mockState.media.stoppedTracks).toBeGreaterThanOrEqual(1);
  });

  test('starts microphone translation when browser-tab audio is unavailable', async ({ page }) => {
    const { voicePage, controller } = await openTranslationHarness(page, {
      browserTabMode: 'unsupported',
    });

    await expect(voicePage.getOpenAITranslationSourceOption('microphone')).toHaveAttribute(
      'aria-checked',
      'true'
    );
    await voicePage.selectOpenAITranslationTargetLanguage('fr');
    await voicePage.startOpenAITranslation();

    await expectTranslationConnected(voicePage);
    await expect(voicePage.getOpenAITranslationStatusPanel()).toContainText(/selected: mic to/i);
    expect(controller.getRouteState().clientSecretRequests).toBe(1);
    expect(controller.getRouteState().lastClientSecretRequestBody).toContain(
      '"targetLanguage":"fr"'
    );

    const mockState = await voicePage.getOpenAITranslationMockState();
    expect(mockState.media.getUserMediaCalls).toBe(1);
    expect(mockState.media.getDisplayMediaCalls).toBe(0);
  });

  test('reaches connected state with mocked WebRTC and translated remote audio', async ({
    page,
  }) => {
    const { voicePage, controller } = await openTranslationHarness(page, {
      autoRemoteAudio: true,
    });

    await voicePage.startOpenAITranslation();

    await expect(voicePage.getOpenAITranslationStatusPanel()).toContainText(
      /translated audio is attached/i,
      { timeout: 10000 }
    );
    await expect(voicePage.getOpenAITranslationDiagnosticsPanel()).toContainText(
      /translated audio is attached/i
    );
    await expect(voicePage.getOpenAITranslationAudioPlayer()).toBeVisible();
    await expect(page.locator('body')).not.toContainText(
      /ek_e2e_translation_client_secret|mock-offer-sdp|mock-answer-sdp|authorization|bearer/i
    );

    const routeState = controller.getRouteState();
    expect(routeState.clientSecretRequests).toBe(1);
    expect(routeState.sdpRequests).toBe(1);
    expect(routeState.leakedSensitiveRequestText).toBe(false);
    expect(routeState.leakedSensitiveResponseText).toBe(false);

    const mockState = await voicePage.getOpenAITranslationMockState();
    expect(mockState.rtc.remoteAudioEmits).toBe(1);
    expect(mockState.cleanup.srcObjectAssignments).toBeGreaterThanOrEqual(1);
  });

  test('renders source and translated transcript events from the data channel', async ({
    page,
  }) => {
    const { voicePage } = await openTranslationHarness(page, {
      autoRemoteAudio: true,
    });

    await voicePage.startOpenAITranslation();
    await expectTranslationConnected(voicePage);

    await emitOpenAITranslationTranscript(page, {
      type: 'translation.source_transcript.delta',
      item_id: 'source-e2e-1',
      delta: 'hola ',
    });
    await emitOpenAITranslationTranscript(page, {
      type: 'translation.source_transcript.final',
      item_id: 'source-e2e-1',
      transcript: 'hola mundo',
    });
    await emitOpenAITranslationTranscript(page, {
      type: 'translation.translated_transcript.delta',
      item_id: 'translated-e2e-1',
      delta: 'hello ',
    });
    await emitUnknownOpenAITranslationEvent(page);
    await emitOpenAITranslationTranscript(page, {
      type: 'translation.translated_transcript.final',
      item_id: 'translated-e2e-1',
      transcript: 'hello world',
    });

    await expect(voicePage.getOpenAITranslationTranscriptLog()).toContainText(/hola mundo/i);
    await expect(voicePage.getOpenAITranslationTranscriptLog()).toContainText(/hello world/i);
    await expect(voicePage.getOpenAITranslationLatestCaption()).toContainText(/hello world/i);
    await expect(voicePage.getOpenAITranslationStatusPanel()).toContainText(/transcript: 2 lines/i);

    const mockState = await voicePage.getOpenAITranslationMockState();
    expect(mockState.rtc.transcriptMessages).toBe(4);
    expect(mockState.rtc.unknownMessages).toBe(1);
  });

  test('cleans up a pending translation startup before provider switch completes', async ({
    page,
  }) => {
    const { voicePage } = await openTranslationHarness(page, {
      clientSecretDelayMs: 900,
    });

    await voicePage.startOpenAITranslation();
    await expect(voicePage.getOpenAITranslationStatusPanel()).toContainText(
      /requesting client secret/i
    );

    await switchAwayFromTranslation(page);

    const mockState = await voicePage.getOpenAITranslationMockState();
    expect(mockState.media.stoppedTracks).toBe(1);
    expect(mockState.rtc.peerConnectionsCreated).toBe(0);
  });

  test('cleans up an active translation session once during provider switch', async ({ page }) => {
    const { voicePage } = await openTranslationHarness(page, {
      autoRemoteAudio: true,
    });

    await voicePage.startOpenAITranslation();
    await expectTranslationConnected(voicePage);

    await switchAwayFromTranslation(page);

    const mockState = await voicePage.getOpenAITranslationMockState();
    expect(mockState.cleanup.peerConnectionCloses).toBe(1);
    expect(mockState.cleanup.dataChannelCloses).toBe(1);
    expect(mockState.cleanup.removeTrackCalls).toBe(1);
  });
});
