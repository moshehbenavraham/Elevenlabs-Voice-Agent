/**
 * VoicePage Page Object Model
 * Provides a structured API for interacting with voice-related UI elements in E2E tests
 */

import type { Page, Locator } from '@playwright/test';
import type { OpenAITranslationMockSnapshot } from '../utils/openai-translation-mock';

type ProviderTabId =
  | 'elevenlabs'
  | 'elevenlabs-sdk'
  | 'openai'
  | 'openai-translation'
  | 'xai'
  | 'gemini';

export class VoicePage {
  readonly page: Page;

  // Provider tabs
  readonly providerTabElevenlabs: Locator;
  readonly providerTabElevenlabsSdk: Locator;
  readonly providerTabOpenai: Locator;
  readonly providerTabOpenaiTranslation: Locator;
  readonly providerTabXai: Locator;
  readonly providerTabGemini: Locator;

  // Voice button and status
  readonly voiceButton: Locator;
  readonly voiceButtonStatus: Locator;
  readonly voiceButtonActiveIndicator: Locator;
  readonly voiceStatus: Locator;
  readonly voiceStatusText: Locator;

  // Voice selector
  readonly voiceSelector: Locator;

  // Conversation panel
  readonly conversationPanel: Locator;
  readonly conversationEmpty: Locator;

  // Function call indicator
  readonly functionCallIndicator: Locator;

  // Reconnection status
  readonly reconnectionStatus: Locator;
  readonly reconnectionRetryButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Provider tabs
    this.providerTabElevenlabs = page.getByTestId('provider-tab-elevenlabs');
    this.providerTabElevenlabsSdk = page.getByTestId('provider-tab-elevenlabs-sdk');
    this.providerTabOpenai = page.getByTestId('provider-tab-openai');
    this.providerTabOpenaiTranslation = page.getByTestId('provider-tab-openai-translation');
    this.providerTabXai = page.getByTestId('provider-tab-xai');
    this.providerTabGemini = page.getByTestId('provider-tab-gemini');

    // Voice button and status
    this.voiceButton = page.getByTestId('voice-button');
    this.voiceButtonStatus = page.getByTestId('voice-button-status');
    this.voiceButtonActiveIndicator = page.getByTestId('voice-button-active-indicator');
    this.voiceStatus = page.getByTestId('voice-status');
    this.voiceStatusText = page.getByTestId('voice-status-text');

    // Voice selector
    this.voiceSelector = page.getByTestId('voice-selector');

    // Conversation panel
    this.conversationPanel = page.getByTestId('conversation-panel');
    this.conversationEmpty = page.getByTestId('conversation-empty');

    // Function call indicator
    this.functionCallIndicator = page.getByTestId('function-call-indicator');

    // Reconnection status
    this.reconnectionStatus = page.getByTestId('reconnection-status');
    this.reconnectionRetryButton = page.getByTestId('reconnection-retry-button');
  }

  /**
   * Navigate to the voice app
   */
  async goto(): Promise<void> {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Select a provider tab
   */
  async selectProvider(provider: ProviderTabId): Promise<void> {
    const tab = this.page.getByTestId(`provider-tab-${provider}`);
    await tab.click();
    await this.page.waitForTimeout(300); // Wait for tab transition animation
  }

  /**
   * Select the OpenAI Translation provider tab
   */
  async selectOpenAITranslationProvider(): Promise<void> {
    await this.selectProvider('openai-translation');
    await this.page.getByRole('heading', { name: /live translation/i }).waitFor();
  }

  /**
   * Get the OpenAI Translation start button
   */
  getOpenAITranslationStartButton(): Locator {
    return this.page.getByRole('button', { name: /start translation/i }).first();
  }

  /**
   * Get the OpenAI Translation stop button
   */
  getOpenAITranslationStopButton(): Locator {
    return this.page.getByRole('button', { name: /^stop translation$/i }).first();
  }

  /**
   * Start OpenAI Translation
   */
  async startOpenAITranslation(): Promise<void> {
    await this.getOpenAITranslationStartButton().click();
  }

  /**
   * Stop OpenAI Translation
   */
  async stopOpenAITranslation(): Promise<void> {
    await this.getOpenAITranslationStopButton().click();
  }

  /**
   * Get a source selector option
   */
  getOpenAITranslationSourceOption(mode: 'microphone' | 'browser-tab'): Locator {
    const label = mode === 'microphone' ? /microphone source/i : /tab audio source/i;
    return this.page.getByRole('radio', { name: label });
  }

  /**
   * Select an OpenAI Translation source
   */
  async selectOpenAITranslationSource(mode: 'microphone' | 'browser-tab'): Promise<void> {
    await this.getOpenAITranslationSourceOption(mode).click();
  }

  /**
   * Select an OpenAI Translation target language
   */
  async selectOpenAITranslationTargetLanguage(languageCode: string): Promise<void> {
    await this.page.getByLabel('Target language', { exact: true }).selectOption(languageCode);
  }

  /**
   * Get the translation status panel
   */
  getOpenAITranslationStatusPanel(): Locator {
    return this.page.locator('section[role="status"]:not([aria-labelledby])');
  }

  /**
   * Get the translation diagnostics panel by heading
   */
  getOpenAITranslationDiagnosticsPanel(): Locator {
    return this.page.locator('section[aria-labelledby="openai-translation-diagnostics-title"]');
  }

  /**
   * Get the translation transcript log
   */
  getOpenAITranslationTranscriptLog(): Locator {
    return this.page.getByRole('log', { name: /translation transcript/i });
  }

  /**
   * Get the latest translated caption region
   */
  getOpenAITranslationLatestCaption(): Locator {
    return this.page.getByRole('status', { name: /latest translated caption/i });
  }

  /**
   * Get the translated audio player
   */
  getOpenAITranslationAudioPlayer(): Locator {
    return this.page.getByLabel(/translated audio playback/i);
  }

  /**
   * Get the test-only OpenAI Translation mock snapshot
   */
  async getOpenAITranslationMockState(): Promise<OpenAITranslationMockSnapshot> {
    return this.page.evaluate(() => {
      const mock = window.__E2E_OPENAI_TRANSLATION_MOCK__;
      if (!mock) {
        throw new Error('OpenAI Translation E2E mock is not installed.');
      }

      return mock.getState();
    });
  }

  /**
   * Emit a translated audio track through the test-only mock
   */
  async emitOpenAITranslationRemoteAudio(): Promise<void> {
    await this.page.evaluate(() => {
      window.__E2E_OPENAI_TRANSLATION_MOCK__?.emitRemoteAudio();
    });
  }

  /**
   * Emit a data-channel event through the test-only mock
   */
  async emitOpenAITranslationEvent(event: Record<string, unknown>): Promise<void> {
    await this.page.evaluate((payload) => {
      window.__E2E_OPENAI_TRANSLATION_MOCK__?.emitTranscript(payload);
    }, event);
  }

  /**
   * Click the voice button to start/stop connection
   */
  async clickVoiceButton(): Promise<void> {
    await this.voiceButton.click();
  }

  /**
   * Get the current voice button state
   */
  async getVoiceButtonState(): Promise<string | null> {
    return this.voiceButton.getAttribute('data-state');
  }

  /**
   * Wait for voice button to reach a specific state
   */
  async waitForVoiceButtonState(
    state: 'idle' | 'loading' | 'connected' | 'speaking' | 'listening' | 'thinking' | 'error',
    timeout = 10000
  ): Promise<void> {
    await this.voiceButton.waitFor({ state: 'visible', timeout });
    await this.page.waitForFunction(
      (expectedState) => {
        const btn = document.querySelector('[data-testid="voice-button"]');
        return btn?.getAttribute('data-state') === expectedState;
      },
      state,
      { timeout }
    );
  }

  /**
   * Get the current voice status text
   */
  async getVoiceStatusText(): Promise<string | null> {
    if (await this.voiceStatusText.isVisible()) {
      return this.voiceStatusText.textContent();
    }
    return null;
  }

  /**
   * Select a voice from the voice selector dropdown
   */
  async selectVoice(voiceId: string): Promise<void> {
    await this.voiceSelector.click();
    await this.page.getByRole('option', { name: voiceId }).click();
  }

  /**
   * Check if conversation panel is visible
   */
  async isConversationPanelVisible(): Promise<boolean> {
    return this.conversationPanel.isVisible();
  }

  /**
   * Get all message bubbles in the conversation panel
   */
  getMessageBubbles(): Locator {
    return this.page.locator('[data-testid^="message-bubble-"]');
  }

  /**
   * Get user message bubbles
   */
  getUserMessageBubbles(): Locator {
    return this.page.getByTestId('message-bubble-user');
  }

  /**
   * Get assistant message bubbles
   */
  getAssistantMessageBubbles(): Locator {
    return this.page.getByTestId('message-bubble-assistant');
  }

  /**
   * Get function call message bubbles
   */
  getFunctionMessageBubbles(): Locator {
    return this.page.getByTestId('message-bubble-function');
  }

  /**
   * Wait for a message to appear in the conversation
   */
  async waitForMessage(role: 'user' | 'assistant' | 'function', timeout = 10000): Promise<void> {
    await this.page.getByTestId(`message-bubble-${role}`).first().waitFor({ timeout });
  }

  /**
   * Get function call indicator status
   */
  async getFunctionCallStatus(): Promise<string | null> {
    if (await this.functionCallIndicator.isVisible()) {
      return this.functionCallIndicator.getAttribute('data-status');
    }
    return null;
  }

  /**
   * Check if reconnection status is visible
   */
  async isReconnectionStatusVisible(): Promise<boolean> {
    return this.reconnectionStatus.isVisible();
  }

  /**
   * Get reconnection status
   */
  async getReconnectionStatus(): Promise<string | null> {
    if (await this.reconnectionStatus.isVisible()) {
      return this.reconnectionStatus.getAttribute('data-status');
    }
    return null;
  }

  /**
   * Click the manual reconnect button
   */
  async clickReconnectButton(): Promise<void> {
    await this.reconnectionRetryButton.click();
  }

  /**
   * Wait for reconnection status to show a specific state
   */
  async waitForReconnectionStatus(
    status: 'reconnecting' | 'max_retries' | 'disconnected',
    timeout = 10000
  ): Promise<void> {
    await this.reconnectionStatus.waitFor({ state: 'visible', timeout });
    await this.page.waitForFunction(
      (expectedStatus) => {
        const el = document.querySelector('[data-testid="reconnection-status"]');
        return el?.getAttribute('data-status') === expectedStatus;
      },
      status,
      { timeout }
    );
  }

  /**
   * Helper to access websocket mock utilities
   */
  async getWebSocketMock(): Promise<void> {
    await this.page.evaluate(() => {
      return window.__E2E_WEBSOCKET_MOCK__;
    });
  }

  /**
   * Simulate a WebSocket disconnect via the mock
   */
  async simulateWebSocketDisconnect(connectionIndex = 0, code = 1006): Promise<void> {
    await this.page.evaluate(
      ({ index, closeCode }) => {
        window.__E2E_WEBSOCKET_MOCK__?.simulateClose(index, closeCode);
      },
      { index: connectionIndex, closeCode: code }
    );
  }

  /**
   * Simulate a network disconnect (closes all connections)
   */
  async simulateNetworkDisconnect(): Promise<void> {
    await this.page.evaluate(() => {
      window.__E2E_WEBSOCKET_MOCK__?.simulateNetworkDisconnect();
    });
  }

  /**
   * Simulate a function call via the mock
   */
  async simulateFunctionCall(
    connectionIndex: number,
    functionName: string,
    args: Record<string, unknown>,
    result: unknown
  ): Promise<void> {
    await this.page.evaluate(
      ({ index, name, fnArgs, fnResult }) => {
        window.__E2E_WEBSOCKET_MOCK__?.simulateFunctionCall(index, name, fnArgs, fnResult);
      },
      { index: connectionIndex, name: functionName, fnArgs: args, fnResult: result }
    );
  }

  /**
   * Get the number of active WebSocket connections
   */
  async getWebSocketConnectionCount(): Promise<number> {
    return this.page.evaluate(() => {
      return window.__E2E_WEBSOCKET_MOCK__?.getConnectionCount() ?? 0;
    });
  }

  /**
   * Clear all WebSocket connections
   */
  async clearWebSocketConnections(): Promise<void> {
    await this.page.evaluate(() => {
      window.__E2E_WEBSOCKET_MOCK__?.clearConnections();
    });
  }
}
