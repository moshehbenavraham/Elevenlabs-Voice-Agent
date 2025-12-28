# Incident Response

## Severity Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| P0 | Complete outage - no voice functionality | Immediate |
| P1 | One provider down | < 1 hour |
| P2 | Degraded performance | < 4 hours |
| P3 | Minor issues | Next business day |

## Common Incidents

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
2. Check server logs for errors
3. Verify port 3001 is not blocked
4. Restart server: `npm run server`
5. Check for dependency issues

### High Latency / Slow Responses

**Symptoms**:
- Long delays between speech and response
- Choppy audio playback

**Resolution**:
1. Check network latency to provider APIs
2. Verify no bandwidth throttling
3. Check browser CPU/memory usage
4. Reduce audio visualization complexity
5. Test with different network connection

## Diagnostic Commands

```bash
# Check backend health
curl http://localhost:3001/api/health

# Test ElevenLabs signed URL
curl http://localhost:3001/api/elevenlabs/signed-url

# Test xAI token generation
curl -X POST http://localhost:3001/api/xai/session

# Check server logs
npm run server 2>&1 | tee server.log

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
