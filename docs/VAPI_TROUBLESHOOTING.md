# Vapi Troubleshooting

Use this guide when the Vapi provider fails to start, reports Daily.co WebRTC
errors, or logs Krisp/AudioWorklet failures.

## Current Integration Facts

- Vapi is frontend-only in this app. It uses `VITE_VAPI_WEB_TOKEN` and does not
  require a backend token endpoint.
- The provider code is centered in `src/lib/vapi.ts`,
  `src/contexts/VapiVoiceContext.tsx`, `src/components/providers/VapiProvider.tsx`,
  and `src/types/vapi.ts`.
- `vapi.start()` uses positional parameters in this codebase. Pass an assistant
  ID string or an inline assistant config as the first argument.
- `transportConfigurations` is not used for web-call Krisp suppression here; a
  prior attempt caused Vapi API `400 Bad Request` responses.
- The current code listens for `call-start-progress`, `call-start-success`,
  `call-start-failed`, `call-start`, `call-end`, `speech-start`, `speech-end`,
  `volume-level`, `message`, and `error`.
- `VapiProviderInner` keeps the current `stop` function in a ref and uses an
  empty-dependency cleanup effect. Do not put `stop` directly in that cleanup
  effect's dependency list; doing so can stop a call during normal state updates.

## Resolved Historical Issues

These findings came from the old Vapi issue log and are preserved to avoid
reintroducing solved bugs:

| Symptom                                                      | Cause                                                                     | Durable fix                                                                             |
| ------------------------------------------------------------ | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Vapi API returned `400 Bad Request` before Daily initialized | Code passed an options object to `vapi.start()`                           | Use the SDK positional signature: assistant ID or inline config as the first argument   |
| Call connected and then immediately ended                    | A React cleanup effect depended on the changing `stop` function reference | Store `stop` in a ref and run cleanup only on actual unmount                            |
| Krisp `AudioWorkletNode` error appeared in console           | Daily.co audio processing attempted Krisp setup during startup            | Treat as nonfatal when the call still connects; capture logs only when connection fails |

After the positional `vapi.start()` fix and cleanup-ref fix, Vapi was manually
verified in both local mode and ngrok demo mode on 2026-01-20. Re-verify after
SDK upgrades, provider lifecycle changes, or demo-mode routing changes.

## Required Environment

| Variable                 | Required | Notes                                           |
| ------------------------ | -------- | ----------------------------------------------- |
| `VITE_VAPI_ENABLED`      | Yes      | Enables the Vapi tab when true                  |
| `VITE_VAPI_WEB_TOKEN`    | Yes      | Public web token embedded in the frontend build |
| `VITE_VAPI_ASSISTANT_ID` | Optional | Uses a pre-created Vapi assistant when set      |
| `VITE_VAPI_VOICE`        | Optional | Voice ID used by inline assistant config        |
| `VITE_VAPI_MODEL`        | Optional | Model used by inline assistant config           |
| `VITE_VAPI_DEBUG`        | Optional | Enables extra Vapi SDK logs when true           |

Because `VITE_*` values are compiled into the frontend bundle, rebuild after
changing them for demo or production verification.

## Common Failure Patterns

### Krisp AudioWorklet Errors

Example:

```text
KrispInitError: Error creating krisp filter: InvalidStateError: Failed to construct 'AudioWorkletNode'
```

Vapi uses Daily.co for the web media connection, and Daily may initialize Krisp
noise processing during call startup. The current code tries to prime browser
audio from the button click and disables the Daily input processor after the
Daily call object is available. If this error appears but the call still
connects, treat it as nonfatal. If the call fails, capture the surrounding
`call-start-progress`, `call-start-failed`, and `error` logs.

### Daily Join Failures

Examples:

```text
Meeting ended in error: Meeting has ended
Signaling connection interrupted by a disconnect.
daily-call-join-error
```

These indicate the Vapi API call may have created a call record, but the browser
did not successfully join the Daily room. Check:

1. The page is loaded over HTTPS, or from localhost during local development.
2. Microphone permission was granted.
3. The Vapi web token and assistant ID were built into the active frontend.
4. Browser extensions, firewall rules, or corporate networks are not blocking
   WebRTC.
5. The Vapi dashboard shows the call attempt and any provider-side error.

## Debugging Checklist

1. Open browser DevTools before clicking the Vapi button.
2. Set `VITE_VAPI_DEBUG=true`, rebuild, and reproduce the failure.
3. Confirm `getVapiDebugInfo()` reports an initialized SDK and configured web
   token.
4. Inspect the first `call-start-failed` stage and total duration.
5. Verify whether the failure occurs in both `npm run dev:all` and
   `npm run demo`.
6. For demo mode, confirm requests are same-origin and no stale config remains
   by running `./scripts/reset-dev-mode.sh` before retesting locally.

## Prior Findings To Preserve

An earlier investigation observed Vapi call logs where server-side STT/TTS
services were ready but the browser never joined the Daily room. That points to
client-side WebRTC startup rather than backend API routing.

Two attempted fixes should not be repeated without new evidence:

- Creating a separate app-level `AudioContext` alone did not prevent Daily from
  creating its own internal audio context.
- Adding Daily `transportConfigurations` through Vapi web-call startup caused
  request validation failures.

## Verification

Run the normal checks before and after Vapi changes:

```bash
npm run lint
npm run test:run
npm run build
```

Then manually verify:

1. Local mode: `npm run dev:all`, open the Vapi tab, start a call, speak, and
   stop the call.
2. Demo mode: `npm run demo`, open the ngrok URL over HTTPS, repeat the same
   call flow, and check for CORS or WebRTC errors.
3. Provider switching: leave the Vapi tab during an active or failed call and
   confirm state is cleaned up.
