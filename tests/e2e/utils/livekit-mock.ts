import type { Page } from '@playwright/test';

// Intercept only the SDK modules in the Vite test server. No mock switches ship in app code.
const client = `
export * from '/node_modules/.vite/deps/livekit-client.js?livekit-original';
export class Room {
  state='disconnected'; canPlaybackAudio=true; listeners=new Map(); messages=[]; agentState='disconnected';
  localParticipant={identity:'visitor',setMicrophoneEnabled:async(enabled)=>{this.mic=enabled;this.emit('change');},getTrackPublication:()=>undefined};
  on(name,fn){const list=this.listeners.get(name)||new Set();list.add(fn);this.listeners.set(name,list);return this;}
  off(name,fn){this.listeners.get(name)?.delete(fn);return this;}
  emit(name,...args){for(const fn of this.listeners.get(name)||[])fn(...args);}
  async switchActiveDevice(){}
  async connect(url,token){
    this.state='connected';this.agentState='listening';this.messages=[{text:'Hello. What would you like to explore?',participantInfo:{identity:'assistant'},streamInfo:{id:'greeting',timestamp:Date.now(),attributes:{'lk.transcription_final':'true'}}}];
    this.emit('change');
  }
  async disconnect(){this.state='disconnected';this.mic=false;this.emit('disconnected');this.emit('change');}
  async startAudio(){this.canPlaybackAudio=true;this.emit('audioPlayback');}
}
`;
const react = `
import React from '/node_modules/.vite/deps/react.js';
export const RoomContext=React.createContext(null);
export const useRoomContext=()=>React.useContext(RoomContext);
function useRoom(){const room=useRoomContext();const [,update]=React.useState(0);React.useEffect(()=>{const fn=()=>update(n=>n+1);room.on('change',fn);return()=>room.off('change',fn);},[room]);return room;}
export function useVoiceAssistant(){const room=useRoom();return {state:room.agentState,agentAttributes:{},audioTrack:undefined};}
export function useTranscriptions(){return useRoom().messages;}
export function useConnectionState(){return useRoom().state;}
export const useTrackVolume=()=>0;
export const RoomAudioRenderer=()=>null;
`;

export async function mockLiveKit(page: Page): Promise<void> {
  // Match Vite's exact React module URL; a second URL creates a second hook dispatcher.
  const appSource = await (await page.request.get('http://localhost:8082/src/App.tsx')).text();
  const reactUrl = appSource.match(/from "([^"]*\/react\.js[^"]*)"/)?.[1];
  if (!reactUrl) throw new Error('Could not resolve the test server React module');
  const reactMock = react.replace('/node_modules/.vite/deps/react.js', reactUrl);
  await page.route('**/node_modules/.vite/deps/livekit-client.js*', (route) => {
    if (route.request().url().includes('livekit-original')) return route.continue();
    return route.fulfill({ contentType: 'text/javascript', body: client });
  });
  await page.route('**/node_modules/.vite/deps/@livekit_components-react.js*', (route) =>
    route.fulfill({ contentType: 'text/javascript', body: reactMock })
  );
  await page.route('**/api/livekit/config', (route) =>
    route.fulfill({
      json: { enabled: true, configured: true, agentOnline: null, maxSessionSeconds: 600 },
    })
  );
  await page.route('**/api/livekit/session', (route) =>
    route.fulfill({
      json: { serverUrl: 'wss://mock.livekit.cloud', participantToken: 'test-only' },
    })
  );
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: async () => ({ getTracks: () => [{ stop() {} }] }),
        enumerateDevices: async () => [],
        getSupportedConstraints: () => ({}),
        addEventListener() {},
        removeEventListener() {},
      },
    });
  });
}
