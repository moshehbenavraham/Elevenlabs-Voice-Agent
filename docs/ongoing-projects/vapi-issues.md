# Vapi Integration Issues Analysis & Implementation Plan

## Executive Summary

Vapi is the only voice provider not working in our multi-provider Voice Agent platform. The root causes are:

1. **Krisp AudioWorklet initialization failures** before our disable workaround executes
2. **Daily.co WebRTC connection errors** causing "Meeting ended in error" failures
3. **Timing issues** in the call initialization sequence
4. **Missing error recovery** for the `call-start-failed` event

This document provides a complete analysis and step-by-step implementation plan to fix Vapi integration for both local development and ngrok demo modes.

---

## Current Error Analysis

### Local Mode Errors (dev.sh)

```
Meeting ended in error: Meeting has ended
Signaling connection interrupted by a disconnect.
[Vapi] Error: {type: 'daily-error', error: {...}}
[Vapi] Error: {type: 'daily-call-join-error', stage: 'daily-call-join', error: {...}, duration: 20641}
[Vapi] Error: {type: 'start-method-error', stage: 'unknown', error: {...}, totalDuration: 26700}
```

**Diagnosis:**

- The Vapi SDK initiates a call via their API
- Vapi creates a Daily.co WebRTC room for the actual audio connection
- The Daily room is created but the join operation fails
- Duration of ~20s suggests a timeout waiting for WebRTC negotiation

**Possible causes:**

1. Network/firewall blocking WebRTC connections to Daily.co
2. Invalid or expired Vapi web token
3. Account quota limits exceeded
4. Vapi API creating the call but room configuration failing

### Demo Mode Errors (ngrok/demo.sh)

```
[Vapi] Disabled Krisp noise cancellation (early)
KrispInitError: Error creating krisp filter: InvalidStateError: Failed to construct
'AudioWorkletNode': AudioWorkletNode cannot be created: No execution context available.
```

**Diagnosis:**

- Our Krisp disable workaround is logging (line 83 of VapiVoiceContext.tsx)
- But the AudioWorklet error still occurs afterward
- "No execution context available" = AudioContext not initialized
- This happens because Daily tries to create Krisp AudioWorklet before we can disable it

---

## Root Cause: Race Condition in Krisp Disable

### Current Implementation Flow

```
1. User clicks button → vapi.start()
2. Vapi SDK creates call via API
3. Vapi SDK fires 'call-start-progress' { stage: 'daily-call-object-creation', status: 'started' }
4. Daily.co initializes internally:
   4a. Creates AudioContext
   4b. ⚠️ Tries to create Krisp AudioWorkletNode → FAILS (no user gesture)
   4c. Completes call object creation (even with error)
5. Vapi fires 'call-start-progress' { stage: 'daily-call-object-creation', status: 'completed' }
6. Our code calls dailyCall.updateInputSettings({ audio: { processor: { type: 'none' } } })
   ↑ TOO LATE - Krisp already failed
7. Daily continues to 'daily-call-join' stage → May fail due to corrupted state
```

The problem: Step 6 happens AFTER step 4b. We can't prevent the AudioWorklet error; we can only disable Krisp after it's already attempted (and failed).

### Why Demo Mode is Worse

In ngrok/demo mode:

- The build is production-minified
- AudioContext restrictions are stricter
- ngrok proxy adds latency, making timing more critical
- Basic auth (if enabled) blocks inline resources needed for AudioWorklet

---

## Vapi SDK Architecture Understanding

### How Vapi Uses Daily.co

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│  Vapi Web SDK   │─────▶│   Vapi API      │─────▶│  Daily.co       │
│  (@vapi-ai/web) │      │                 │      │  WebRTC Rooms   │
│                 │      │                 │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
        │                                                  │
        │ vapi.start()                                     │
        │ ─────────────────────────────────────────────▶   │
        │                                                  │
        │ Creates call record, returns Daily room details  │
        │ ◀───────────────────────────────────────────────│
        │                                                  │
        │ DailyIframe.createCallObject()                   │
        │ ─────────────────────────────────────────────▶   │
        │                                                  │
        │ Initializes WebRTC, loads Krisp AudioWorklet     │
        │ ◀───────────────────────────────────────────────│
```

### Vapi SDK Internal Events

| Event                 | When Fired              | Purpose                      |
| --------------------- | ----------------------- | ---------------------------- |
| `call-start-progress` | During initialization   | Reports stage/status updates |
| `call-start-success`  | Initialization complete | Call is ready for audio      |
| `call-start-failed`   | Initialization failed   | Error with reason            |
| `call-start`          | Room joined             | Audio connection active      |
| `call-end`            | Room left               | Audio connection closed      |
| `error`               | Any error               | General error event          |

**Critical missing handler:** We don't listen for `call-start-failed` which would give us early error information.

---

## Proper Implementation Strategy

### Strategy 1: Pre-Initialize AudioContext (Recommended)

Create AudioContext on user click BEFORE calling vapi.start(). This ensures the execution context exists.

```typescript
// In start() function, BEFORE vapi.start()
const ensureAudioContext = () => {
  if (!window.__vapiAudioContext) {
    window.__vapiAudioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  // Resume if suspended (happens after page idle)
  if (window.__vapiAudioContext.state === 'suspended') {
    window.__vapiAudioContext.resume();
  }
};
```

### Strategy 2: Configure Vapi Assistant to Disable Noise Cancellation

When starting with inline config, add the backgroundSpeechDenoisingPlan:

```typescript
const assistantConfig = {
  name: 'Voice Assistant',
  // ... other config
  backgroundSpeechDenoisingPlan: {
    smartDenoisingPlan: {
      enabled: false,
    },
  },
};
```

**Note:** This requires using inline assistant configuration, not a pre-created assistant ID. For pre-created assistants, configure this in the Vapi dashboard.

### Strategy 3: Multiple Krisp Disable Attempts

Instead of relying on one disable call, try multiple times:

```typescript
const onCallStartProgress = (event: { stage: string; status: string }) => {
  // Try to disable Krisp at every stage
  const dailyCall = vapi.getDailyCallObject();
  if (dailyCall) {
    disableKrispSafely(dailyCall);
  }
};

const disableKrispSafely = async (dailyCall: DailyCall) => {
  try {
    await dailyCall.updateInputSettings({
      audio: { processor: { type: 'none' } },
    });
  } catch (e) {
    // Silently ignore - Krisp may not be enabled or already disabled
  }
};
```

### Strategy 4: Handle All Error Events

Add missing event listeners:

```typescript
vapi.on('call-start-failed', (error) => {
  console.error('[Vapi] Call start failed:', error);
  setError(error.message || 'Failed to start call');
  setCallStatus(VapiCallStatus.INACTIVE);
});
```

---

## Implementation Plan

### Phase 1: Diagnostic Improvements

Before fixing, add better diagnostics to understand the exact failure point.

**File: `src/contexts/VapiVoiceContext.tsx`**

1. Add comprehensive logging for all call-start-progress stages
2. Add `call-start-failed` event listener
3. Log the exact Daily.co error details
4. Track timing of each stage

### Phase 2: AudioContext Pre-Initialization

**File: `src/lib/vapi.ts`**

1. Export a `prepareAudioContext()` function
2. Call it from VapiButton onClick before start()

**File: `src/components/providers/VapiProvider.tsx`**

1. Update VapiButton to call prepareAudioContext() on click

### Phase 3: Assistant Configuration Updates

**File: `src/contexts/VapiVoiceContext.tsx`**

1. Update inline assistant config to include `backgroundSpeechDenoisingPlan`
2. Add `dailyConfigOverride` if supported by SDK

### Phase 4: Robust Error Recovery

**File: `src/contexts/VapiVoiceContext.tsx`**

1. Implement retry logic for transient errors
2. Add exponential backoff
3. Clear stale state on repeated failures

### Phase 5: Dual-Mode Testing

1. Test in local mode (npm run dev:all)
2. Test in demo mode (npm run demo)
3. Test with ngrok basic auth enabled
4. Test on mobile browsers

---

## Code Changes Required

### 1. `src/lib/vapi.ts` - Add AudioContext Helper

```typescript
/**
 * Vapi SDK Singleton
 */
import Vapi from '@vapi-ai/web';

const webToken = import.meta.env.VITE_VAPI_WEB_TOKEN;

if (!webToken) {
  console.warn('[Vapi] VITE_VAPI_WEB_TOKEN not configured.');
}

export const vapi = webToken ? new Vapi(webToken) : null;

/**
 * Pre-initialize AudioContext to prevent AudioWorklet failures
 * MUST be called during a user gesture (click/tap)
 */
export function prepareAudioContext(): AudioContext | null {
  try {
    // Create or reuse AudioContext
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      console.warn('[Vapi] AudioContext not supported');
      return null;
    }

    // Check for existing context
    if ((window as any).__vapiAudioContext) {
      const ctx = (window as any).__vapiAudioContext as AudioContext;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(console.warn);
      }
      return ctx;
    }

    // Create new context
    const ctx = new AudioContextClass();
    (window as any).__vapiAudioContext = ctx;
    console.log('[Vapi] AudioContext pre-initialized, state:', ctx.state);
    return ctx;
  } catch (e) {
    console.warn('[Vapi] Failed to pre-initialize AudioContext:', e);
    return null;
  }
}

/**
 * Cleanup AudioContext on app unmount
 */
export function cleanupAudioContext(): void {
  const ctx = (window as any).__vapiAudioContext as AudioContext | undefined;
  if (ctx) {
    ctx.close().catch(console.warn);
    delete (window as any).__vapiAudioContext;
  }
}
```

### 2. `src/contexts/VapiVoiceContext.tsx` - Enhanced Error Handling

Key changes:

- Add `call-start-failed` listener
- Add `call-start-success` listener
- Improve Krisp disable timing
- Add backgroundSpeechDenoisingPlan to inline config
- Add retry mechanism

### 3. `src/components/providers/VapiProvider.tsx` - Pre-Initialize Audio

Key changes:

- Import and call `prepareAudioContext()` in handleClick
- Add proper error boundary for call failures

---

## Environment Variable Verification Checklist

Before testing, verify these are set correctly:

| Variable                 | Required | Where  | Example          |
| ------------------------ | -------- | ------ | ---------------- |
| `VITE_VAPI_ENABLED`      | Yes      | `.env` | `true`           |
| `VITE_VAPI_WEB_TOKEN`    | Yes      | `.env` | `pk_live_xxx...` |
| `VITE_VAPI_ASSISTANT_ID` | Optional | `.env` | `asst_xxx`       |
| `VITE_VAPI_VOICE`        | Optional | `.env` | `paula`          |
| `VITE_VAPI_MODEL`        | Optional | `.env` | `gpt-4o-mini`    |

**Note:** Vapi does NOT require backend API keys. It's frontend-only.

---

## Testing Checklist

### Local Mode (npm run dev:all)

- [ ] Vapi tab appears when VITE_VAPI_ENABLED=true
- [ ] Empty state shows when VITE_VAPI_WEB_TOKEN missing
- [ ] Click button initiates call (no AudioWorklet errors)
- [ ] Call connects and audio works bidirectionally
- [ ] Transcripts appear in conversation panel
- [ ] Stop button ends call cleanly
- [ ] Provider switching cleans up Vapi state
- [ ] No console errors in steady state

### Demo Mode (npm run demo)

- [ ] Same tests as local mode via ngrok URL
- [ ] Works over HTTPS (required for microphone)
- [ ] No CORS errors in console
- [ ] No AudioWorklet errors in console
- [ ] Works with ngrok basic auth enabled
- [ ] Works on mobile browsers (iOS Safari, Android Chrome)

### Error Recovery

- [ ] Token expired: Shows appropriate error, allows retry
- [ ] Network disconnect: Attempts reconnection
- [ ] Quota exceeded: Shows clear error message
- [ ] Microphone denied: Shows permission error

---

## Comparison with Working Providers

### Retell (Working)

Retell uses LiveKit (not Daily.co) and doesn't have Krisp/AudioWorklet issues:

- Backend generates access token per call
- Frontend uses `retell-client-js-sdk`
- No noise cancellation AudioWorklet loading
- Simpler initialization sequence

### ElevenLabs SDK (Working)

ElevenLabs handles audio differently:

- Uses their own audio pipeline
- No Daily.co dependency
- `useConversation` hook manages audio internally
- No AudioWorklet loading required

### Why Vapi is Different

Vapi's architecture introduces complexity:

1. Depends on Daily.co for WebRTC
2. Daily.co loads Krisp by default
3. Krisp requires AudioWorklet
4. AudioWorklet requires AudioContext from user gesture
5. Race condition between SDK init and our disable call

---

## References

### Official Documentation

- [Vapi Web SDK Docs](https://docs.vapi.ai/sdk/web)
- [Vapi SDK GitHub](https://github.com/VapiAI/client-sdk-web)
- [Vapi Background Speech Denoising](https://docs.vapi.ai/documentation/assistants/conversation-behavior/background-speech-denoising)
- [Daily.co Input Settings](https://docs.daily.co/reference/daily-js/instance-methods/update-input-settings)

### SDK Versions

- `@vapi-ai/web`: ^2.5.2 (latest as of 2026-01-20)
- Uses Daily.co internally for WebRTC

### Related Commits in Codebase

- `513509f` - fix: AudioWorklet and provider switching issues
- `c3acac8` - fix: ngrok demo mode AudioWorklet and API routing issues

---

## Summary of Required Changes

| File                                        | Change Type                       | Priority |
| ------------------------------------------- | --------------------------------- | -------- |
| `src/lib/vapi.ts`                           | Add prepareAudioContext()         | High     |
| `src/contexts/VapiVoiceContext.tsx`         | Add call-start-failed handler     | High     |
| `src/contexts/VapiVoiceContext.tsx`         | Add backgroundSpeechDenoisingPlan | High     |
| `src/contexts/VapiVoiceContext.tsx`         | Improve Krisp disable timing      | Medium   |
| `src/components/providers/VapiProvider.tsx` | Call prepareAudioContext on click | High     |
| `src/types/vapi.ts`                         | Add missing event types if needed | Low      |

---

## Next Steps

1. **Immediate:** Verify Vapi web token is valid and not expired
2. **Diagnostic:** Add enhanced logging to identify exact failure point
3. **Fix:** Implement AudioContext pre-initialization
4. **Fix:** Add backgroundSpeechDenoisingPlan to assistant config
5. **Test:** Verify in both local and demo modes
6. **Document:** Update CLAUDE.md with any new patterns

---

## Questions to Resolve

1. ~~**Is the Vapi web token valid?**~~ ✅ Verified 2026-01-20 - Token exists and appears valid
2. ~~**Is there an account quota issue?**~~ ✅ Verified 2026-01-20 - Server-side services working (ElevenLabs, Deepgram connected)
3. **Can we use a pre-created assistant?** If so, configure noise cancellation in dashboard
4. ~~**Do we need to update CSP headers?**~~ ✅ Not the issue - same error on local mode (no CSP)

---

## Server-Side Verification (2026-01-20)

Vapi call logs confirm the **server-side is working correctly**:

```
Call ID: 019bdaeb-123d-7bb5-aa63-e80cd2e89d7f
Timeline:
  10:19:57.545 - New turn started
  10:19:57.559 - ElevenLabs WebSocket connecting (websocketIndex: 0, 1)
  10:19:57.671 - ElevenLabs WebSocket opened, BOS sent
  10:19:57.675 - Deepgram WebSocket opened
  10:19:57.782 - Deepgram first transcript received
  10:20:12.561 - ElevenLabs WebSocket reconnecting (websocketIndex: 2, 3)
  10:20:15.067 - Deepgram cleanup, new turn started
  10:20:15.120 - ElevenLabs WebSocket closed
```

**Conclusion:** Server waited ~17 seconds with all services ready. Client never successfully joined.

**Root cause is now confirmed: Client-side Daily.co WebRTC join failure, not server/token/quota issues.**

### Local Mode Verification (2026-01-20)

Testing local mode (`npm run dev:all` via dev.sh) from home network:

```
[Vapi] Disabled Krisp noise cancellation (early)    ← Our workaround fires
KrispInitError: Error creating krisp filter: InvalidStateError:
  Failed to construct 'AudioWorkletNode': AudioWorkletNode cannot be
  created: No execution context available.           ← But Krisp already failed
```

**Call stack confirms the race condition:**

```
handleClick @ VapiProvider.tsx:116     ← User clicks button
start @ VapiVoiceContext.tsx:265       ← Our start() called
start @ @vapi-ai_web.js:10316          ← Vapi SDK start()
... Daily internal initialization ...
Krisp AudioWorklet fails               ← Too late to prevent
```

**Confirmed:** Both local AND demo modes have the same root cause - AudioContext not initialized before Daily.co tries to create Krisp AudioWorklet. Network/firewall is NOT the issue.

---

_Last Updated: 2026-01-20_
_Status: Root Cause Verified, Ready for Implementation_

## Verified Root Cause Summary

The issue is **NOT**:

- ❌ Invalid token
- ❌ Account quota
- ❌ Network/firewall
- ❌ CSP headers
- ❌ Demo mode specific

The issue **IS**:

- ✅ **AudioContext race condition** - Daily.co tries to create Krisp AudioWorklet before AudioContext is initialized from user gesture
- ✅ Our current workaround (disabling Krisp after `daily-call-object-creation` completes) fires too late
- ✅ Affects both local and demo modes identically

## Fix Required

**Pre-initialize AudioContext on button click BEFORE calling `vapi.start()`**

This ensures the browser's AudioContext execution context exists when Daily.co tries to create the Krisp AudioWorklet. See "Code Changes Required" section above for implementation details.

---

## Implementation Attempts Log

### Attempt 1: AudioContext Pre-initialization (2026-01-20)

**Changes Made:**

- Added `prepareAudioContext()` in `src/lib/vapi.ts`
- Called it in `handleClick` before `vapi.start()`
- Added `backgroundSpeechDenoisingPlan` to inline configs

**Result:** FAILED

- AudioContext was pre-initialized (state: running)
- Krisp error still occurred
- Daily.co creates its OWN AudioContext internally, not using ours
- `backgroundSpeechDenoisingPlan` is for server-side denoising, NOT client-side Krisp

**Console Output:**

```
[Vapi] AudioContext pre-initialized, state: running
[Vapi] Disabled Krisp noise cancellation (early)
KrispInitError: Error creating krisp filter: InvalidStateError: Failed to construct 'AudioWorkletNode': AudioWorkletNode cannot be created: No execution context available.
```

### Attempt 2: transportConfigurations via assistantOverrides (2026-01-20)

**Analysis:**
The AudioContext pre-initialization doesn't help because Daily.co bundles its own AudioContext creation. The real solution is to prevent Krisp from loading at all via Vapi's API configuration.

**Changes Made:**

- Added `transportConfigurations` to ALL vapi.start() calls
- Uses `inputSettings.audio.processor.type: 'none'` to disable Krisp at Daily.co level
- Works for both assistant ID and inline config scenarios

**Code Pattern:**

```typescript
const transportOverrides = {
  provider: 'daily' as const,
  inputSettings: {
    audio: {
      processor: {
        type: 'none' as const,
      },
    },
  },
};

// For assistant ID:
await vapi.start({
  assistantId: 'xxx',
  assistantOverrides: {
    transportConfigurations: [transportOverrides],
  },
});

// For inline config:
await vapi.start({
  name: 'Assistant',
  transportConfigurations: [transportOverrides],
  // ... other config
});
```

**Result:** FAILED

- Vapi API rejected the request with 400 Bad Request
- API error occurred before any Daily.co initialization

**Console Output:**

```
[Vapi] AudioContext pre-initialized, state: running
POST https://api.vapi.ai/call/web 400 (Bad Request)
[Vapi] Call start failed: {stage: 'unknown', totalDuration: 2102, error: {...}}
[Vapi] Error: {type: 'start-method-error', stage: 'unknown', error: {...}}
```

**Root Cause Analysis - IMPLEMENTATION ERRORS:**

This was lazy guessing without checking the actual SDK types. Two critical mistakes:

1. **Wrong method signature**: The `vapi.start()` takes POSITIONAL parameters, not an options object:

   ```typescript
   // ACTUAL signature from vapi.d.ts:
   start(
     assistant?: CreateAssistantDTO | string,   // 1st positional param
     assistantOverrides?: AssistantOverrides,   // 2nd positional param
     squad?: CreateSquadDTO | string,
     workflow?: CreateWorkflowDTO | string,
     workflowOverrides?: WorkflowOverrides,
     options?: StartCallOptions
   ): Promise<Call | null>;
   ```

   The implementation INCORRECTLY passed an object:

   ```typescript
   // WRONG:
   vapi.start({ assistantId: 'xxx', assistantOverrides: {...} })

   // CORRECT would be:
   vapi.start('xxx', assistantOverrides)
   ```

2. **`transportConfigurations` is Twilio-only**: The SDK type explicitly shows:

   ```typescript
   // From api.d.ts AssistantOverrides interface:
   transportConfigurations?: TransportConfigurationTwilio[];
   ```

   `TransportConfigurationTwilio` is for Twilio phone calls ONLY. There is NO Daily.co transport configuration available in `AssistantOverrides`. The field cannot be used to disable Daily's Krisp.

---

## Current Status: BLOCKED

Both attempted fixes have failed:

1. **AudioContext pre-initialization** - Doesn't help because Daily.co creates its own AudioContext
2. **transportConfigurations API** - Not supported by Vapi Web SDK (400 Bad Request)

### Potential Next Steps (Not Attempted)

1. **Server-side call creation** - Create the Vapi call from backend with transport settings, then join from frontend
2. **Pre-created assistant with Krisp disabled** - Configure noise cancellation settings in Vapi dashboard
3. **Contact Vapi support** - Ask about disabling Krisp for web SDK usage
4. **Patch Daily.co internally** - Extremely hacky, intercept Daily's createCallObject
5. **Use different Vapi SDK version** - Check if older/newer versions handle this differently

### Recommendation

The cleanest solution would be to configure the assistant in the Vapi dashboard to disable noise cancellation, rather than trying to override it at call time. This would require the user to:

1. Go to Vapi dashboard
2. Edit the assistant configuration
3. Disable background noise cancellation / Krisp settings
4. Use that assistant ID instead of inline config

---

### Attempt 3: Fix Method Signature and Remove transportConfigurations (2026-01-20)

**Root Cause Discovery:**

After deeper analysis of the Vapi SDK source code (vapi.js), we found:

1. **Wrong method signature**: The code was incorrectly passing an object `{ assistantId, assistantOverrides }` as a single parameter, but `vapi.start()` takes **positional parameters**:

   ```typescript
   // SDK signature:
   start(
     assistant?: CreateAssistantDTO | string,   // First positional param
     assistantOverrides?: AssistantOverrides,   // Second positional param
     squad?, workflow?, workflowOverrides?,
     options?: StartCallOptions
   ): Promise<Call | null>;
   ```

2. **Invalid transportConfigurations**: This field is explicitly typed as `TransportConfigurationTwilio[]` and is only for Twilio phone calls, NOT Daily.co web calls. Passing it caused the 400 Bad Request error.

3. **Krisp error is nonfatal**: The Vapi SDK has built-in error handling at line 513-527 that catches `audio-processor-error` (nonfatal-error event) and automatically disables Krisp. The call should continue despite the error.

**Changes Made:**

1. **VapiVoiceContext.tsx** - Fixed `start()` function:
   - Removed object wrapper, now uses correct positional parameters
   - Removed all `transportConfigurations` (Twilio-only, doesn't help)
   - Added clarifying comments about method signature
   - `vapi.start('assistant-id')` instead of `vapi.start({ assistantId: '...', assistantOverrides: {...} })`

2. **useVapiVoice.test.tsx** - Updated test expectations:
   - Tests now expect `vapi.start('asst_123')` instead of object parameter

**Result:** SUCCESS - Tests pass (623/623)

The call should now work because:

1. Correct API format prevents 400 Bad Request
2. Krisp AudioWorklet error is expected but nonfatal - SDK handles it
3. Calls will proceed after SDK's built-in error recovery disables Krisp

**Verification Needed:**

- Test in browser (npm run dev:all or npm run demo)
- Krisp error may still appear in console (this is expected)
- But the call should connect and function properly

---

### Attempt 4: Browser Testing of Method Signature Fix (2026-01-20)

**Test Environment:** Local mode (`npm run dev:all`)

**Result:** FAILED - Call starts successfully but is immediately killed by React re-mounting

**Console Log Analysis:**

The call actually **succeeded** through all stages:

```
12:12:03.108 - START() CALLED
12:12:03.109 - initialization: started
12:12:03.109 - web-call-creation: started
12:12:05.859 - web-call-creation: completed (2749ms)
12:12:05.859 - daily-call-object-creation: started
12:12:05.861 - daily-call-object-creation: completed (2ms)
12:12:05.861 - ✅ Krisp noise cancellation disabled (early)
12:12:05.862 - mobile-permissions: skipped
12:12:05.862 - daily-call-join: started
12:12:10.117 - daily-call-join: completed (4253ms)
12:12:10.118 - audio-observer-setup: completed
12:12:10.118 - audio-processing-setup: completed
12:12:10.118 - ✅ CALL-START-SUCCESS (7009ms total)
12:12:10.118 - vapi.start() resolved with Call object
```

**But then immediately after success:**

```
12:12:10.237 - VapiVoiceProvider mounting...
12:12:10.248 - STOP() CALLED (status: loading)
12:12:10.249 - vapi.stop() called
12:12:10.279 - CALL-END (customer-ended-call)
12:12:10.279 - Krisp error appears (AFTER call already ending)
```

**Root Cause Identified: React Re-Mounting Issue**

The `VapiVoiceProvider` component is **remounting multiple times** during the call flow:

1. Initial mount at 12:11:54.372
2. During start() at 12:12:03.110
3. **After call success** at 12:12:10.237 ← This is the problem
4. After call-end at 12:12:10.280

Each mount triggers the **cleanup effect** (from the previous unmount), which calls `stop()`. The timing shows:

- Call succeeds at 12:12:10.118
- Provider remounts at 12:12:10.237 (119ms later)
- Cleanup effect calls stop() at 12:12:10.248
- Call is killed 130ms after it succeeded

**Why the provider remounts:**

- State changes during call initialization cause React to re-render
- If the provider component is conditionally rendered or affected by parent state changes, it can unmount/remount
- React Strict Mode can also cause double-mounting (but wouldn't explain the timing)

**Krisp Error is NOT the Root Cause:**

- Krisp error appears at 12:12:10.279 (AFTER vapi.stop() was called)
- The call was already ending when Krisp failed
- Krisp is a **symptom**, not the cause of the call failure

**New Issue Summary:**

| Issue                       | Cause                               | Status                                 |
| --------------------------- | ----------------------------------- | -------------------------------------- |
| ~~400 Bad Request~~         | Wrong method signature              | ✅ Fixed in Attempt 3                  |
| ~~transportConfigurations~~ | Twilio-only field                   | ✅ Removed in Attempt 3                |
| Call immediately ends       | Provider remounting triggers stop() | 🔴 NEW ISSUE                           |
| Krisp AudioWorklet error    | Daily.co timing                     | ⚠️ Secondary (appears after call ends) |

**Investigation Needed:**

1. Why is `VapiVoiceProvider` remounting after call success?
2. Is there a state change that triggers a re-render causing unmount?
3. Is the cleanup effect properly guarded to not call stop() on every unmount?
4. Check if `useEffect` cleanup is firing during normal state transitions

**Potential Fixes to Explore:**

1. **Guard cleanup effect**: Only call stop() if the component is truly unmounting (use a ref to track mounted state)
2. **Check parent re-renders**: Ensure Index.tsx or ProviderTabs isn't causing VapiProvider to remount
3. **Move stop() logic**: Don't call stop() in cleanup effect - only call it on explicit user action
4. **Use stable key**: Ensure React isn't recreating the component due to key changes

**Code Locations to Investigate:**

- `VapiVoiceContext.tsx` lines 60-78: The mounting/unmounting useEffect
- `VapiProvider.tsx`: The component that wraps VapiVoiceProvider
- `Index.tsx` or `ProviderTabs.tsx`: Parent components that might cause re-renders

---

### Attempt 5: Fix Cleanup Effect Dependency Array (2026-01-20)

**Root Cause Discovery:**

After analyzing the browser logs more carefully, the issue was NOT that `VapiVoiceProvider` was remounting. The log "VapiVoiceProvider mounting..." was misleading - it was actually a re-render logging statement.

The actual root cause was in `VapiProviderInner` (in `VapiProvider.tsx`):

```typescript
// PROBLEMATIC CODE:
useEffect(() => {
  return () => {
    stop(); // This gets called on every re-render!
  };
}, [stop]); // ← stop changes reference on every render
```

**Why This Failed:**

1. The `stop` function comes from `useVapiVoiceContext()` context
2. Every time `VapiVoiceProvider` re-renders (due to state changes), it creates a new context value object
3. This means `stop` gets a new function reference on every render
4. React sees `stop` changed in the dependency array
5. React runs the cleanup from the previous effect, calling `stop()`
6. This kills the call immediately after it succeeds

**Timeline Analysis:**

```
12:12:10.118 - Call succeeds (CALL-START-SUCCESS)
12:12:10.118 - State change: LOADING → ACTIVE
12:12:10.xxx - VapiVoiceProvider re-renders with new state
12:12:10.xxx - Context value recreated with new `stop` function reference
12:12:10.xxx - VapiProviderInner re-renders with new `stop`
12:12:10.xxx - useEffect sees `stop` changed → cleanup runs → stop()
12:12:10.248 - STOP() CALLED ← Here's the bug!
```

**The Fix:**

Use a ref to store the `stop` function, allowing the cleanup to access the latest function without it being a dependency:

```typescript
function VapiProviderInner({ children, onDisconnect }: VapiProviderProps) {
  const { stop, callStatus } = useVapiVoiceContext();

  // Use a ref to track the current stop function
  const stopRef = useRef(stop);

  // Keep the ref in sync with the latest stop function
  useEffect(() => {
    stopRef.current = stop;
  }, [stop]);

  // Cleanup on unmount ONLY (empty deps array)
  useEffect(() => {
    return () => {
      console.log('[Vapi:UI] VapiProviderInner unmounting, calling stop()');
      stopRef.current();
    };
  }, []);  // ← Empty deps = cleanup only runs on actual unmount

  return <>{children}</>;
}
```

**Result:** SUCCESS - All 623 tests pass

**Files Changed:**

- `src/components/providers/VapiProvider.tsx` - Fixed cleanup effect to use ref pattern

**Key Insight:**

This is a common React pattern issue. When a function from context is used in an effect's dependency array, it causes the effect to re-run on every context update. The ref pattern solves this by:

1. Storing the function in a ref (doesn't trigger re-renders)
2. Keeping the ref updated via a separate effect
3. Using the ref in the cleanup, which only runs on actual unmount

---

### Browser Verification (2026-01-20)

**Local Mode (`npm run dev:all` via dev.sh):** ✅ **WORKING**

**Demo Mode (`npm run demo` via demo.sh):** ✅ **WORKING**

The cleanup effect fix resolved the issue in both deployment modes. Vapi calls now:

- Connect successfully
- Stay connected through state transitions
- Audio works bidirectionally
- Transcripts display properly
- Work over ngrok HTTPS tunnel

---

## Resolution Summary

| Issue                    | Root Cause                            | Fix                       |
| ------------------------ | ------------------------------------- | ------------------------- |
| 400 Bad Request          | Wrong `vapi.start()` method signature | Fixed in Attempt 3        |
| Call immediately killed  | Cleanup effect dependency array bug   | Fixed in Attempt 5        |
| Krisp AudioWorklet error | Daily.co timing (nonfatal)            | SDK handles automatically |

**Final Fix:** Changed `VapiProviderInner` cleanup effect to use ref pattern instead of putting `stop` in dependency array.

---

_Last Updated: 2026-01-20_
_Status: ✅ RESOLVED - Vapi integration working in both local and ngrok demo modes_
