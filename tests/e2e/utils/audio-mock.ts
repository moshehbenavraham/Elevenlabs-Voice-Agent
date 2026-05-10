/**
 * Audio API mocking utilities for E2E tests
 * Prevents actual microphone access while simulating voice interactions
 */

import type { Page } from '@playwright/test';

/**
 * Script to inject into the page that mocks MediaDevices, AudioContext, and MediaStream APIs
 * Must be injected via page.addInitScript() before page load
 */
export const audioMockScript = `
(function() {
  // Mock MediaStream
  class MockMediaStreamTrack {
    constructor(kind) {
      this.kind = kind;
      this.id = 'mock-track-' + Math.random().toString(36).substr(2, 9);
      this.enabled = true;
      this.muted = false;
      this.readyState = 'live';
      this.label = kind === 'audio' ? 'Mock Audio Device' : 'Mock Video Device';
    }

    stop() {
      this.readyState = 'ended';
    }

    clone() {
      return new MockMediaStreamTrack(this.kind);
    }

    getCapabilities() {
      return {};
    }

    getConstraints() {
      return {};
    }

    getSettings() {
      return {
        deviceId: 'mock-device-id',
        groupId: 'mock-group-id',
        sampleRate: 48000,
        channelCount: 1,
      };
    }

    applyConstraints() {
      return Promise.resolve();
    }

    addEventListener() {}
    removeEventListener() {}
    dispatchEvent() { return true; }
  }

  class MockMediaStream {
    constructor(tracks = []) {
      this.id = 'mock-stream-' + Math.random().toString(36).substr(2, 9);
      this.active = true;
      this._tracks = tracks.length > 0 ? tracks : [new MockMediaStreamTrack('audio')];
    }

    getAudioTracks() {
      return this._tracks.filter(t => t.kind === 'audio');
    }

    getVideoTracks() {
      return this._tracks.filter(t => t.kind === 'video');
    }

    getTracks() {
      return this._tracks;
    }

    getTrackById(id) {
      return this._tracks.find(t => t.id === id) || null;
    }

    addTrack(track) {
      this._tracks.push(track);
    }

    removeTrack(track) {
      const index = this._tracks.indexOf(track);
      if (index > -1) {
        this._tracks.splice(index, 1);
      }
    }

    clone() {
      return new MockMediaStream(this._tracks.map(t => t.clone()));
    }

    addEventListener() {}
    removeEventListener() {}
    dispatchEvent() { return true; }
  }

  function createNativeMediaStream() {
    try {
      if (typeof window.MediaStream === 'function') {
        return new window.MediaStream();
      }
    } catch (error) {
      console.warn('[E2E Mock] Failed to create native MediaStream:', error);
    }

    return new MockMediaStream([new MockMediaStreamTrack('audio')]);
  }

  // Mock MediaDevices.getUserMedia
  const originalGetUserMedia = navigator.mediaDevices?.getUserMedia?.bind(navigator.mediaDevices);

  if (navigator.mediaDevices) {
    navigator.mediaDevices.getUserMedia = function(constraints) {
      console.log('[E2E Mock] getUserMedia called with:', JSON.stringify(constraints));
      return Promise.resolve(new MockMediaStream());
    };

    navigator.mediaDevices.enumerateDevices = function() {
      return Promise.resolve([
        {
          deviceId: 'mock-audio-input',
          kind: 'audioinput',
          label: 'Mock Microphone',
          groupId: 'mock-group'
        },
        {
          deviceId: 'mock-audio-output',
          kind: 'audiooutput',
          label: 'Mock Speaker',
          groupId: 'mock-group'
        }
      ]);
    };
  }

  // Mock AudioContext
  const OriginalAudioContext = window.AudioContext || window.webkitAudioContext;

  class MockAnalyserNode {
    constructor() {
      this.fftSize = 2048;
      this.frequencyBinCount = 1024;
      this.minDecibels = -100;
      this.maxDecibels = -30;
      this.smoothingTimeConstant = 0.8;
    }

    getByteFrequencyData(array) {
      // Fill with mock frequency data (sine wave pattern)
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(128 + 64 * Math.sin(i * 0.1 + Date.now() * 0.01));
      }
    }

    getByteTimeDomainData(array) {
      for (let i = 0; i < array.length; i++) {
        array[i] = 128;
      }
    }

    getFloatFrequencyData(array) {
      for (let i = 0; i < array.length; i++) {
        array[i] = -50 + 20 * Math.sin(i * 0.1);
      }
    }

    getFloatTimeDomainData(array) {
      for (let i = 0; i < array.length; i++) {
        array[i] = 0;
      }
    }

    connect() { return this; }
    disconnect() {}
  }

  class MockGainNode {
    constructor() {
      this.gain = { value: 1, setValueAtTime: () => {} };
    }
    connect() { return this; }
    disconnect() {}
  }

  class MockMediaStreamSource {
    connect() { return this; }
    disconnect() {}
  }

  class MockMediaStreamDestination {
    constructor() {
      this.stream = createNativeMediaStream();
      this.channelCount = 2;
      this.channelCountMode = 'explicit';
      this.channelInterpretation = 'speakers';
    }

    connect() { return this; }
    disconnect() {}
  }

  class MockAudioWorkletNode {
    constructor() {
      this.port = {
        onmessage: null,
        postMessage: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        start: () => {}
      };
    }

    connect() { return this; }
    disconnect() {}
  }

  class MockAudioContext {
    constructor(options = {}) {
      this.state = 'running';
      this.sampleRate = options.sampleRate || 48000;
      this.currentTime = 0;
      this.baseLatency = 0.01;
      this.destination = { maxChannelCount: 2 };
      this.audioWorklet = {
        addModule: () => Promise.resolve()
      };
      this._intervalId = null;

      // Increment currentTime
      this._intervalId = setInterval(() => {
        this.currentTime += 0.1;
      }, 100);
    }

    createAnalyser() {
      return new MockAnalyserNode();
    }

    createGain() {
      return new MockGainNode();
    }

    createMediaStreamSource() {
      return new MockMediaStreamSource();
    }

    createMediaStreamDestination() {
      return new MockMediaStreamDestination();
    }

    createOscillator() {
      return {
        frequency: { value: 440 },
        type: 'sine',
        connect: () => {},
        start: () => {},
        stop: () => {},
        disconnect: () => {}
      };
    }

    createBufferSource() {
      return {
        buffer: null,
        loop: false,
        connect: () => {},
        start: () => {},
        stop: () => {},
        disconnect: () => {}
      };
    }

    decodeAudioData(buffer) {
      return Promise.resolve({
        duration: 1,
        length: this.sampleRate,
        numberOfChannels: 1,
        sampleRate: this.sampleRate,
        getChannelData: () => new Float32Array(this.sampleRate)
      });
    }

    resume() {
      this.state = 'running';
      return Promise.resolve();
    }

    suspend() {
      this.state = 'suspended';
      return Promise.resolve();
    }

    close() {
      this.state = 'closed';
      if (this._intervalId) {
        clearInterval(this._intervalId);
      }
      return Promise.resolve();
    }

    addEventListener() {}
    removeEventListener() {}
  }

  window.AudioContext = MockAudioContext;
  window.webkitAudioContext = MockAudioContext;
  window.AudioWorkletNode = MockAudioWorkletNode;

  // Expose for testing
  window.__E2E_AUDIO_MOCK__ = {
    MockMediaStream,
    MockMediaStreamTrack,
    MockAudioContext,
    MockMediaStreamDestination,
    MockAudioWorkletNode,
    originalGetUserMedia
  };

  console.log('[E2E Mock] Audio APIs mocked successfully');
})();
`;

/**
 * Type definitions for the mock APIs exposed on window
 */
export interface E2EAudioMock {
  MockMediaStream: typeof MediaStream;
  MockMediaStreamTrack: typeof MediaStreamTrack;
  MockAudioContext: typeof AudioContext;
  MockMediaStreamDestination: unknown;
  MockAudioWorkletNode: typeof AudioWorkletNode;
  originalGetUserMedia?: typeof navigator.mediaDevices.getUserMedia;
}

declare global {
  interface Window {
    __E2E_AUDIO_MOCK__?: E2EAudioMock;
  }
}

/**
 * Set up audio mocking for a Playwright page
 * Injects the audio mock script before page load
 *
 * @param page - Playwright page instance
 */
export async function setupAudioMock(page: Page): Promise<void> {
  await page.addInitScript(audioMockScript);
}
