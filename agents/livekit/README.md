# Local LiveKit agent

This independently packaged Node.js worker joins rooms dispatched to `pupuplatter-livekit-demo`. It runs locally against LiveKit Cloud; it is not part of the Express process and does not require cloud deployment.

From the repository root, run `npm run agent:livekit:setup`, then `npm run agent:livekit`. It reads the ignored root `.env`. For a client demo, `npm run demo` supervises the worker and tunnel together.

See [LiveKit setup and operations](../../docs/LIVEKIT_CLOUD.md) for configuration, model choices, verification, and troubleshooting. The exact SDK versions are pinned in this package and its lockfile. `npm run build`, `npm run type-check`, and `npm test` work from this directory. Tests exercise session lifecycle without contacting LiveKit.

The pinned inference pipeline is Deepgram `deepgram/nova-3` (English STT), Google `google/gemma-4-31b-it` (LLM), and Inworld `inworld/inworld-tts-2` with voice `Ashley` (TTS). Turn detection uses LiveKit Inference with adaptive interruption. To change models, edit the server-side worker entrypoint and repeat a live conversation preflight.

Environment example (set in the root `.env`, not a second agent credential file):

```dotenv
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
LIVEKIT_AGENT_NAME=pupuplatter-livekit-demo
LIVEKIT_SESSION_MAX_SECONDS=600
```

Recording is explicitly disabled with `record: false`; job logs use warning level to avoid ordinary SDK transcript logging. Project-level cloud observability retention must still be checked in the LiveKit dashboard before making a retention promise to clients.
