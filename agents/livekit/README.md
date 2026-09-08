# Local LiveKit agent

This independently packaged Node.js worker joins rooms dispatched to `pupuplatter-livekit-demo`. It runs locally against LiveKit Cloud; it is not part of the Express process and does not require cloud deployment.

From the repository root, run `npm run agent:livekit:setup`, then `npm run agent:livekit`. It reads the ignored root `.env`. For a client demo, `npm run demo` supervises the worker and tunnel together.

See [LiveKit setup and operations](../../docs/LIVEKIT_CLOUD.md) for configuration, model choices, verification, and troubleshooting. The exact SDK versions are pinned in this package and its lockfile. `npm run build`, `npm run type-check`, and `npm test` work from this directory. Tests exercise session lifecycle without contacting LiveKit.
