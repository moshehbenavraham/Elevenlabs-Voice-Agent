import type { Page, Route } from '@playwright/test';

export type OpenAITranslationMediaMode =
  | 'success'
  | 'unsupported'
  | 'permission-denied'
  | 'cancelled'
  | 'no-audio';

export interface OpenAITranslationMockOptions {
  readonly microphoneMode?: OpenAITranslationMediaMode;
  readonly browserTabMode?: OpenAITranslationMediaMode;
  readonly mediaDelayMs?: number;
  readonly clientSecretDelayMs?: number;
  readonly sdpDelayMs?: number;
  readonly offerDelayMs?: number;
  readonly remoteDescriptionDelayMs?: number;
  readonly autoRemoteAudio?: boolean;
}

export interface OpenAITranslationRouteState {
  readonly clientSecretRequests: number;
  readonly sdpRequests: number;
  readonly leakedSensitiveRequestText: boolean;
  readonly leakedSensitiveResponseText: boolean;
  readonly lastClientSecretRequestBody: string | null;
  readonly lastSdpRequestBodyLength: number | null;
  readonly lastSdpAuthorizationHeader: string | null;
}

export interface OpenAITranslationMockSnapshot {
  readonly media: {
    readonly getUserMediaCalls: number;
    readonly getDisplayMediaCalls: number;
    readonly createdStreams: number;
    readonly stoppedTracks: number;
  };
  readonly rtc: {
    readonly peerConnectionsCreated: number;
    readonly addTrackCalls: number;
    readonly dataChannelsCreated: number;
    readonly remoteAudioEmits: number;
    readonly transcriptMessages: number;
    readonly unknownMessages: number;
    readonly lastAction: string;
    readonly actionLog: readonly string[];
  };
  readonly cleanup: {
    readonly peerConnectionCloses: number;
    readonly dataChannelCloses: number;
    readonly removeTrackCalls: number;
    readonly srcObjectAssignments: number;
    readonly timersCleared: number;
  };
}

export interface OpenAITranslationMockController {
  readonly getRouteState: () => OpenAITranslationRouteState;
}

const TRANSLATION_SESSION_ROUTE = '**/api/openai/translation-session';
const TRANSLATION_SDP_ROUTE = '**/v1/realtime/translations';
const FAKE_CLIENT_SECRET = 'ek_e2e_translation_client_secret';
const FAKE_ANSWER_SDP = 'mock-answer-sdp';
const CORS_HEADERS = {
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Origin': '*',
} as const;
const SENSITIVE_PATTERNS = [
  /sk-[a-z0-9_-]+/i,
  /bearer\s+sk-[a-z0-9._-]+/i,
  /authorization:\s*bearer\s+sk-/i,
  /openai_api_key/i,
  /api[_-]?key/i,
] as const;

export async function setupOpenAITranslationMock(
  page: Page,
  options: OpenAITranslationMockOptions = {}
): Promise<OpenAITranslationMockController> {
  await page.addInitScript({ content: buildOpenAITranslationMockScript(options) });
  const routeState: OpenAITranslationRouteStateMutable = {
    clientSecretRequests: 0,
    sdpRequests: 0,
    leakedSensitiveRequestText: false,
    leakedSensitiveResponseText: false,
    lastClientSecretRequestBody: null,
    lastSdpRequestBodyLength: null,
    lastSdpAuthorizationHeader: null,
  };

  await page.route(TRANSLATION_SESSION_ROUTE, async (route) => {
    await handleTranslationSessionRoute(route, routeState, options.clientSecretDelayMs ?? 0);
  });
  await page.route(TRANSLATION_SDP_ROUTE, async (route) => {
    await handleTranslationSdpRoute(route, routeState, options.sdpDelayMs ?? 0);
  });

  return {
    getRouteState: () => ({ ...routeState }),
  };
}

export async function setOpenAITranslationMediaMode(
  page: Page,
  mode: 'microphone' | 'browser-tab',
  value: OpenAITranslationMediaMode
): Promise<void> {
  await page.evaluate(
    ({ sourceMode, mediaMode }) => {
      window.__E2E_OPENAI_TRANSLATION_MOCK__?.setMediaMode(sourceMode, mediaMode);
    },
    { sourceMode: mode, mediaMode: value }
  );
}

export async function setOpenAITranslationMockLatency(
  page: Page,
  key: 'mediaDelayMs' | 'offerDelayMs' | 'remoteDescriptionDelayMs',
  value: number
): Promise<void> {
  await page.evaluate(
    ({ latencyKey, latencyValue }) => {
      window.__E2E_OPENAI_TRANSLATION_MOCK__?.setLatency(latencyKey, latencyValue);
    },
    { latencyKey: key, latencyValue: value }
  );
}

export async function emitOpenAITranslationRemoteAudio(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.__E2E_OPENAI_TRANSLATION_MOCK__?.emitRemoteAudio();
  });
}

export async function emitOpenAITranslationTranscript(
  page: Page,
  event: Record<string, unknown>
): Promise<void> {
  await page.evaluate((payload) => {
    window.__E2E_OPENAI_TRANSLATION_MOCK__?.emitTranscript(payload);
  }, event);
}

export async function emitUnknownOpenAITranslationEvent(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.__E2E_OPENAI_TRANSLATION_MOCK__?.emitUnknownEvent();
  });
}

export async function getOpenAITranslationMockState(
  page: Page
): Promise<OpenAITranslationMockSnapshot> {
  return page.evaluate(() => {
    const mock = window.__E2E_OPENAI_TRANSLATION_MOCK__;
    if (!mock) {
      throw new Error('OpenAI Translation E2E mock is not installed.');
    }

    return mock.getState();
  });
}

export async function resetOpenAITranslationMock(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.__E2E_OPENAI_TRANSLATION_MOCK__?.reset();
  });
}

interface OpenAITranslationRouteStateMutable {
  clientSecretRequests: number;
  sdpRequests: number;
  leakedSensitiveRequestText: boolean;
  leakedSensitiveResponseText: boolean;
  lastClientSecretRequestBody: string | null;
  lastSdpRequestBodyLength: number | null;
  lastSdpAuthorizationHeader: string | null;
}

async function handleTranslationSessionRoute(
  route: Route,
  routeState: OpenAITranslationRouteStateMutable,
  delayMs: number
): Promise<void> {
  await waitForMockDelay(delayMs);
  const request = route.request();
  if (request.method() === 'OPTIONS') {
    await route.fulfill({
      status: 204,
      headers: CORS_HEADERS,
    });
    return;
  }

  routeState.clientSecretRequests += 1;
  const requestBody = request.postData() ?? '';
  routeState.lastClientSecretRequestBody = requestBody;
  routeState.leakedSensitiveRequestText =
    routeState.leakedSensitiveRequestText || includesSensitiveText(requestBody);

  const targetLanguage = readTargetLanguage(requestBody);
  const responseBody = JSON.stringify({
    clientSecret: FAKE_CLIENT_SECRET,
    expiresAt: '2026-05-11T20:00:00.000Z',
    targetLanguage,
    model: 'gpt-realtime-translate',
  });
  routeState.leakedSensitiveResponseText =
    routeState.leakedSensitiveResponseText || includesSensitiveText(responseBody);

  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: CORS_HEADERS,
    body: responseBody,
  });
}

async function handleTranslationSdpRoute(
  route: Route,
  routeState: OpenAITranslationRouteStateMutable,
  delayMs: number
): Promise<void> {
  await waitForMockDelay(delayMs);
  const request = route.request();
  if (request.method() === 'OPTIONS') {
    await route.fulfill({
      status: 204,
      headers: CORS_HEADERS,
    });
    return;
  }

  routeState.sdpRequests += 1;
  const requestBody = request.postData() ?? '';
  const authorizationHeader = request.headers().authorization ?? null;
  routeState.lastSdpRequestBodyLength = requestBody.length;
  routeState.lastSdpAuthorizationHeader = authorizationHeader;
  routeState.leakedSensitiveRequestText =
    routeState.leakedSensitiveRequestText ||
    includesSensitiveText(requestBody) ||
    includesSensitiveText(authorizationHeader ?? '');
  routeState.leakedSensitiveResponseText =
    routeState.leakedSensitiveResponseText || includesSensitiveText(FAKE_ANSWER_SDP);

  await route.fulfill({
    status: 200,
    contentType: 'application/sdp',
    headers: CORS_HEADERS,
    body: FAKE_ANSWER_SDP,
  });
}

function readTargetLanguage(body: string): string {
  try {
    const parsed = JSON.parse(body) as { readonly targetLanguage?: unknown };
    return typeof parsed.targetLanguage === 'string' ? parsed.targetLanguage : 'en';
  } catch {
    return 'en';
  }
}

function includesSensitiveText(value: string): boolean {
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(value));
}

function waitForMockDelay(ms: number): Promise<void> {
  if (ms <= 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function buildOpenAITranslationMockScript(options: OpenAITranslationMockOptions): string {
  return `
(() => {
  const initialOptions = ${JSON.stringify({
    microphoneMode: options.microphoneMode ?? 'success',
    browserTabMode: options.browserTabMode ?? 'success',
    mediaDelayMs: options.mediaDelayMs ?? 0,
    offerDelayMs: options.offerDelayMs ?? 0,
    remoteDescriptionDelayMs: options.remoteDescriptionDelayMs ?? 0,
    autoRemoteAudio: options.autoRemoteAudio ?? false,
  })};

  const config = {
    microphoneMode: initialOptions.microphoneMode,
    browserTabMode: initialOptions.browserTabMode,
    mediaDelayMs: initialOptions.mediaDelayMs,
    offerDelayMs: initialOptions.offerDelayMs,
    remoteDescriptionDelayMs: initialOptions.remoteDescriptionDelayMs,
    autoRemoteAudio: initialOptions.autoRemoteAudio,
  };
  const timers = new Set();
  const peerConnections = [];
  const state = {
    media: {
      getUserMediaCalls: 0,
      getDisplayMediaCalls: 0,
      createdStreams: 0,
      stoppedTracks: 0,
    },
    rtc: {
      peerConnectionsCreated: 0,
      addTrackCalls: 0,
      dataChannelsCreated: 0,
      remoteAudioEmits: 0,
      transcriptMessages: 0,
      unknownMessages: 0,
      lastAction: 'init',
      actionLog: ['init'],
    },
    cleanup: {
      peerConnectionCloses: 0,
      dataChannelCloses: 0,
      removeTrackCalls: 0,
      srcObjectAssignments: 0,
      timersCleared: 0,
    },
  };

  function setRtcAction(action) {
    state.rtc.lastAction = action;
    state.rtc.actionLog.push(action);
  }

  function wait(ms) {
    if (!ms || ms <= 0) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const timerId = window.setTimeout(() => {
        timers.delete(timerId);
        resolve();
      }, ms);
      timers.add(timerId);
    });
  }

  class MockMediaStreamTrack {
    constructor(kind, label) {
      this.kind = kind;
      this.id = 'translation-' + kind + '-' + Math.random().toString(36).slice(2);
      this.label = label || (kind === 'audio' ? 'Mock Translation Audio' : 'Mock Translation Video');
      this.enabled = true;
      this.muted = false;
      this.readyState = 'live';
      this._listeners = new Map();
    }

    stop() {
      if (this.readyState === 'ended') {
        return;
      }

      this.readyState = 'ended';
      state.media.stoppedTracks += 1;
      this.dispatchEvent({ type: 'ended', target: this });
    }

    clone() {
      return new MockMediaStreamTrack(this.kind, this.label);
    }

    getCapabilities() {
      return {};
    }

    getConstraints() {
      return {};
    }

    getSettings() {
      return {
        deviceId: 'translation-mock-device',
        groupId: 'translation-mock-group',
        sampleRate: 48000,
        channelCount: this.kind === 'audio' ? 1 : undefined,
      };
    }

    applyConstraints() {
      return Promise.resolve();
    }

    addEventListener(type, listener) {
      if (!this._listeners.has(type)) {
        this._listeners.set(type, new Set());
      }
      this._listeners.get(type).add(listener);
    }

    removeEventListener(type, listener) {
      this._listeners.get(type)?.delete(listener);
    }

    dispatchEvent(event) {
      const eventType = event && event.type;
      if (!eventType) {
        return true;
      }

      for (const listener of this._listeners.get(eventType) || []) {
        if (typeof listener === 'function') {
          listener.call(this, event);
        } else if (listener && typeof listener.handleEvent === 'function') {
          listener.handleEvent(event);
        }
      }
      const handler = this['on' + eventType];
      if (typeof handler === 'function') {
        handler.call(this, event);
      }
      return true;
    }
  }

  class MockMediaStream {
    constructor(tracks) {
      this.id = 'translation-stream-' + Math.random().toString(36).slice(2);
      this.active = true;
      this._tracks = Array.isArray(tracks) ? tracks : [];
      state.media.createdStreams += 1;
    }

    getAudioTracks() {
      return this._tracks.filter((track) => track.kind === 'audio');
    }

    getVideoTracks() {
      return this._tracks.filter((track) => track.kind === 'video');
    }

    getTracks() {
      return this._tracks.slice();
    }

    getTrackById(id) {
      return this._tracks.find((track) => track.id === id) || null;
    }

    addTrack(track) {
      if (!this._tracks.includes(track)) {
        this._tracks.push(track);
      }
    }

    removeTrack(track) {
      this._tracks = this._tracks.filter((currentTrack) => currentTrack !== track);
    }

    clone() {
      return new MockMediaStream(this._tracks.map((track) => track.clone()));
    }

    addEventListener() {}
    removeEventListener() {}
    dispatchEvent() {
      return true;
    }
  }

  class MockRTCDataChannel {
    constructor(label) {
      this.label = label;
      this.readyState = 'open';
      this.binaryType = 'arraybuffer';
      this.bufferedAmount = 0;
      this.bufferedAmountLowThreshold = 0;
      this.id = 1;
      this.negotiated = false;
      this.ordered = true;
      this.protocol = '';
      this.maxPacketLifeTime = null;
      this.maxRetransmits = null;
      this.onopen = null;
      this.onmessage = null;
      this.onerror = null;
      this.onclose = null;
    }

    close() {
      if (this.readyState === 'closed') {
        return;
      }

      this.readyState = 'closed';
      state.cleanup.dataChannelCloses += 1;
      if (typeof this.onclose === 'function') {
        this.onclose(new Event('close'));
      }
    }

    send() {}
    addEventListener() {}
    removeEventListener() {}
    dispatchEvent() {
      return true;
    }

    emitMessage(payload) {
      if (typeof this.onmessage === 'function') {
        this.onmessage(new MessageEvent('message', { data: JSON.stringify(payload) }));
      }
    }
  }

  class MockRTCPeerConnection {
    constructor() {
      setRtcAction('peer-constructor');
      Object.defineProperty(this, 'connectionState', {
        configurable: true,
        enumerable: true,
        writable: true,
        value: 'new',
      });
      Object.defineProperty(this, 'iceConnectionState', {
        configurable: true,
        enumerable: true,
        writable: true,
        value: 'new',
      });
      Object.defineProperty(this, 'localDescription', {
        configurable: true,
        enumerable: true,
        writable: true,
        value: null,
      });
      Object.defineProperty(this, 'remoteDescription', {
        configurable: true,
        enumerable: true,
        writable: true,
        value: null,
      });
      this.ontrack = null;
      this.onconnectionstatechange = null;
      this.oniceconnectionstatechange = null;
      this._senders = [];
      this._dataChannel = null;
      peerConnections.push(this);
      state.rtc.peerConnectionsCreated += 1;
    }

    getConfiguration() {
      return {};
    }

    setConfiguration() {}

    addTrack(track, stream) {
      setRtcAction('add-track');
      const sender = { track, stream };
      this._senders.push(sender);
      state.rtc.addTrackCalls += 1;
      return sender;
    }

    removeTrack(sender) {
      setRtcAction('remove-track');
      this._senders = this._senders.filter((currentSender) => currentSender !== sender);
      state.cleanup.removeTrackCalls += 1;
    }

    createDataChannel(label) {
      setRtcAction('create-data-channel');
      this._dataChannel = new MockRTCDataChannel(label);
      state.rtc.dataChannelsCreated += 1;
      return this._dataChannel;
    }

    async createOffer() {
      setRtcAction('create-offer');
      await wait(config.offerDelayMs);
      return { type: 'offer', sdp: 'mock-offer-sdp' };
    }

    async setLocalDescription(description) {
      setRtcAction('set-local-description');
      this.localDescription = description;
    }

    async setRemoteDescription(description) {
      setRtcAction('set-remote-description');
      await wait(config.remoteDescriptionDelayMs);
      this.remoteDescription = description;
      this.connectionState = 'connected';
      this.iceConnectionState = 'connected';
      this._dispatchConnectionState();
      this._dispatchIceConnectionState();
      if (config.autoRemoteAudio) {
        this.emitRemoteAudio();
      }
    }

    close() {
      setRtcAction('close-peer');
      if (this.connectionState === 'closed') {
        return;
      }

      this.connectionState = 'closed';
      state.cleanup.peerConnectionCloses += 1;
      this._dispatchConnectionState();
    }

    addEventListener() {}
    removeEventListener() {}
    dispatchEvent() {
      return true;
    }

    emitRemoteAudio() {
      setRtcAction('emit-remote-audio');
      const track = new MockMediaStreamTrack('audio', 'Mock Translated Audio');
      const stream = new MockMediaStream([track]);
      state.rtc.remoteAudioEmits += 1;
      if (typeof this.ontrack === 'function') {
        this.ontrack({ track, streams: [stream] });
      }
    }

    emitTranscript(payload) {
      setRtcAction('emit-transcript');
      state.rtc.transcriptMessages += 1;
      this._dataChannel?.emitMessage(payload);
    }

    emitUnknownEvent() {
      setRtcAction('emit-unknown-event');
      state.rtc.unknownMessages += 1;
      this._dataChannel?.emitMessage({ type: 'session.created', id: 'unknown-e2e-event' });
    }

    failConnection() {
      setRtcAction('fail-connection');
      this.connectionState = 'failed';
      this.iceConnectionState = 'failed';
      this._dispatchConnectionState();
      this._dispatchIceConnectionState();
    }

    _dispatchConnectionState() {
      if (typeof this.onconnectionstatechange === 'function') {
        this.onconnectionstatechange(new Event('connectionstatechange'));
      }
    }

    _dispatchIceConnectionState() {
      if (typeof this.oniceconnectionstatechange === 'function') {
        this.oniceconnectionstatechange(new Event('iceconnectionstatechange'));
      }
    }
  }

  function createMockStream(mode) {
    if (mode === 'no-audio') {
      return new MockMediaStream([new MockMediaStreamTrack('video', 'Mock Translation Video')]);
    }

    return new MockMediaStream([new MockMediaStreamTrack('audio', 'Mock Translation Audio')]);
  }

  function createMediaError(mode) {
    if (mode === 'permission-denied') {
      return new DOMException('Permission denied by mock browser.', 'NotAllowedError');
    }

    if (mode === 'cancelled') {
      return new DOMException('Selection cancelled by mock browser.', 'AbortError');
    }

    return new DOMException('Capture API is unsupported by mock browser.', 'NotSupportedError');
  }

  async function resolveMediaMode(mode, sourceName) {
    await wait(config.mediaDelayMs);
    if (mode === 'success' || mode === 'no-audio') {
      return createMockStream(mode);
    }

    throw createMediaError(mode, sourceName);
  }

  function ensureMediaDevices() {
    if (!navigator.mediaDevices) {
      Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: {},
      });
    }
  }

  function applyMediaDevices() {
    ensureMediaDevices();
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
      configurable: true,
      writable: true,
      value: () => {
        state.media.getUserMediaCalls += 1;
        return resolveMediaMode(config.microphoneMode, 'microphone');
      },
    });
    Object.defineProperty(navigator.mediaDevices, 'enumerateDevices', {
      configurable: true,
      writable: true,
      value: () =>
        Promise.resolve([
          {
            deviceId: 'translation-mock-audio-input',
            groupId: 'translation-mock-group',
            kind: 'audioinput',
            label: 'Mock Translation Microphone',
          },
        ]),
    });

    if (config.browserTabMode === 'unsupported') {
      Object.defineProperty(navigator.mediaDevices, 'getDisplayMedia', {
        configurable: true,
        writable: true,
        value: undefined,
      });
    } else {
      Object.defineProperty(navigator.mediaDevices, 'getDisplayMedia', {
        configurable: true,
        writable: true,
        value: () => {
          state.media.getDisplayMediaCalls += 1;
          return resolveMediaMode(config.browserTabMode, 'browser-tab');
        },
      });
    }
  }

  function installAudioElementSrcObjectStore() {
    if (!window.HTMLMediaElement) {
      return;
    }

    const values = new WeakMap();
    Object.defineProperty(window.HTMLMediaElement.prototype, 'srcObject', {
      configurable: true,
      get() {
        return values.get(this) || null;
      },
      set(value) {
        values.set(this, value);
        state.cleanup.srcObjectAssignments += 1;
      },
    });
  }

  function getLatestPeerConnection() {
    return peerConnections[peerConnections.length - 1] || null;
  }

  function clearTimers() {
    for (const timerId of timers) {
      window.clearTimeout(timerId);
      state.cleanup.timersCleared += 1;
    }
    timers.clear();
  }

  applyMediaDevices();
  installAudioElementSrcObjectStore();
  Object.defineProperty(window, 'RTCPeerConnection', {
    configurable: true,
    get() {
      return MockRTCPeerConnection;
    },
    set() {},
  });
  Object.defineProperty(globalThis, 'RTCPeerConnection', {
    configurable: true,
    get() {
      return MockRTCPeerConnection;
    },
    set() {},
  });

  window.__E2E_OPENAI_TRANSLATION_MOCK__ = {
    setMediaMode(sourceMode, mode) {
      if (sourceMode === 'microphone') {
        config.microphoneMode = mode;
      } else {
        config.browserTabMode = mode;
      }
      applyMediaDevices();
    },
    setLatency(key, value) {
      config[key] = Number.isFinite(value) && value > 0 ? value : 0;
    },
    emitRemoteAudio() {
      getLatestPeerConnection()?.emitRemoteAudio();
    },
    emitTranscript(payload) {
      getLatestPeerConnection()?.emitTranscript(payload);
    },
    emitUnknownEvent() {
      getLatestPeerConnection()?.emitUnknownEvent();
    },
    failConnection() {
      getLatestPeerConnection()?.failConnection();
    },
    getState() {
      return JSON.parse(JSON.stringify(state));
    },
    reset() {
      clearTimers();
      for (const peerConnection of peerConnections) {
        peerConnection.close();
        peerConnection._dataChannel?.close();
      }
      peerConnections.length = 0;
    },
  };
})();
`;
}

declare global {
  interface Window {
    __E2E_OPENAI_TRANSLATION_MOCK__?: {
      setMediaMode: (
        sourceMode: 'microphone' | 'browser-tab',
        mode: OpenAITranslationMediaMode
      ) => void;
      setLatency: (
        key: 'mediaDelayMs' | 'offerDelayMs' | 'remoteDescriptionDelayMs',
        value: number
      ) => void;
      emitRemoteAudio: () => void;
      emitTranscript: (event: Record<string, unknown>) => void;
      emitUnknownEvent: () => void;
      failConnection: () => void;
      getState: () => OpenAITranslationMockSnapshot;
      reset: () => void;
    };
  }
}
