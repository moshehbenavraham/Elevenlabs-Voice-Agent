import { useState, type ReactNode } from 'react';
import { Room } from 'livekit-client';
import { RoomContext, RoomAudioRenderer } from '@livekit/components-react';

/** Provide a single room instance and render subscribed assistant audio for this demo mount. */
export function LiveKitProvider({ children }: { children: ReactNode }) {
  const [room] = useState(
    () =>
      new Room({
        audioCaptureDefaults: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
  );
  return (
    <RoomContext.Provider value={room}>
      {children}
      <RoomAudioRenderer />
    </RoomContext.Provider>
  );
}
