# Incident Response

## Severity Levels

| Level | Description                              | Response Time     |
| ----- | ---------------------------------------- | ----------------- |
| P0    | Complete outage - no voice functionality | Immediate         |
| P1    | One provider down                        | < 1 hour          |
| P2    | Degraded performance                     | < 4 hours         |
| P3    | Minor issues                             | Next business day |

## Common Incidents

### Uptime Alert Fired

**Symptoms**:

- Uptime monitor reports `/api/health` timeout, non-200 response, or `unhealthy` status
- Deploy workflow health-check job fails
- Users cannot load the app or start provider sessions

**Resolution**:

1. Confirm from a second network: `curl -i https://your-domain.com/api/health`
2. Check whether the response includes `X-Request-Id` and record it
3. Check container status and recent restarts
4. Inspect logs for the request ID or recent 5xx entries
5. Check `/api/metrics` for elevated 5xx counts or latency
6. If `/api/health` is `degraded` with HTTP 200, follow Provider Degraded
7. If `/api/health` is `unhealthy` or unreachable, roll back or restart after capturing logs

### Provider Degraded

**Symptoms**:

- `/api/health` returns `degraded`
- `providerSummary.unconfigured` is greater than 0
- A specific provider tab cannot start, while other providers still work

**Resolution**:

1. Inspect `providerSummary` and `services` in `/api/health`
2. Confirm whether the missing provider is expected for this deployment
3. If unexpected, verify the provider runtime secret or public `VITE_*` value
4. Restart the container after changing runtime secrets
5. Rebuild and redeploy after changing build-time `VITE_*` values
6. Run `npm run deploy:verify -- --url https://your-domain.com`
7. Test the affected provider tab in the browser

### Voice Connection Failed (ElevenLabs)

**Symptoms**:

- "Connection Failed" error in UI
- Toast shows connection error

**Resolution**:

1. Check ElevenLabs service status: https://status.elevenlabs.io/
2. Verify `VITE_ELEVENLABS_AGENT_ID` is correct
3. Check backend logs for signed URL errors
4. Verify `ELEVENLABS_API_KEY` is valid
5. Test agent in ElevenLabs dashboard

### Voice Connection Failed (xAI)

**Symptoms**:

- xAI tab shows connection error
- "Failed to connect to xAI" message

**Resolution**:

1. Check backend is running: `curl http://localhost:3001/api/health`
2. Check xAI API status
3. Verify `XAI_API_KEY` in server environment
4. Check server logs for token generation errors
5. Test endpoint: `curl -X POST http://localhost:3001/api/xai/session`

### Audio Not Playing

**Symptoms**:

- Connection succeeds but no audio output
- Visualizer not animating

**Resolution**:

1. Check browser console for AudioContext errors
2. Verify microphone permissions granted
3. Try user interaction before audio (Safari requirement)
4. Check audio output device selection
5. Clear browser cache and reload

### Backend Server Down

**Symptoms**:

- Health check fails
- All provider connections fail

**Resolution**:

1. Check if server process is running
2. Check server logs for errors and request IDs
3. Verify port 3001 is not blocked
4. Check `/api/metrics` for 5xx counts and latency
5. Restart server: `npm run server`
6. Check for dependency issues

### High Latency / Slow Responses

**Symptoms**:

- Long delays between speech and response
- Choppy audio playback

**Resolution**:

1. Check `/api/metrics` for high average or p95 latency
2. Capture `X-Request-Id` from a slow API response
3. Search logs for the request ID and compare provider endpoint timing
4. Check network latency to provider APIs
5. Verify no bandwidth throttling
6. Check browser CPU/memory usage
7. Reduce audio visualization complexity
8. Test with different network connection

## Request ID Triage

Every `/api/*` response includes `X-Request-Id`. Use it to correlate browser failures with server logs.

1. Capture the header:
   ```bash
   curl -i https://your-domain.com/api/health
   ```
2. Search logs:
   ```bash
   docker logs voice-agent | grep '<request-id>'
   docker compose logs voice-agent | grep '<request-id>'
   ```
3. Record method, path, status, duration, and completion event.
4. Include the request ID in tickets, deployment failure issues, and escalation messages.

## Diagnostic Commands

```bash
# Check backend health
curl -i http://localhost:3001/api/health

# Check metrics
curl -s http://localhost:3001/api/metrics

# Check route-level metrics
curl -s "http://localhost:3001/api/metrics?details=true"

# Test ElevenLabs signed URL
curl -i http://localhost:3001/api/elevenlabs/signed-url

# Test xAI token generation
curl -i -X POST http://localhost:3001/api/xai/session

# Check server logs
npm run server 2>&1 | tee server.log

# Check container logs
docker compose logs -f voice-agent

# Run tests to verify functionality
npm run test:run
```

## Rollback Procedure

If a deployment causes issues:

1. Identify the problematic commit
2. Revert to previous working version:
   ```bash
   git revert HEAD
   git push
   ```
3. Trigger redeployment
4. Verify functionality restored
5. Document incident for post-mortem

## Escalation

If unable to resolve:

1. Check provider status pages
2. Review recent code changes
3. Check for dependency updates that may have broken functionality
4. Open issue in repository with detailed symptoms
5. Include production URL, timestamp and timezone, `X-Request-Id`, `/api/health` status, `/api/metrics` snapshot, recent deployment SHA or image tag, and any provider status page findings
6. Escalate to the alert destination configured for the uptime monitor if users are affected or the health endpoint is `unhealthy`
