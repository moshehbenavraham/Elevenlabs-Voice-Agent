# Dual-Mode Development Guidelines: Local vs Demo Mode

This guide prevents conflicts when switching between local development and ngrok demo mode.

## Mode Architecture Comparison

| Aspect            | Local Development       | Demo Mode                     |
| ----------------- | ----------------------- | ----------------------------- |
| **Frontend Port** | 8082 (Vite HMR)         | 3001 (served from dist/)      |
| **Backend Port**  | 3001                    | 3001                          |
| **Tunnel**        | None                    | Single ngrok tunnel (3001)    |
| **CORS**          | Enabled (cross-origin)  | Disabled (same-origin)        |
| **Hot Reload**    | Yes                     | No (production build)         |
| **API Base URL**  | `http://localhost:3001` | Empty string (relative paths) |
| **Config File**   | None                    | `dist/config.js`              |

## Mode Switching Checklists

### Local → Demo Mode

Before running `npm run demo`:

1. Stop any running local servers (`Ctrl+C` on `npm run dev:all`)
2. Verify ports 3001 and 4041 are free
3. Ensure `.env` has required credentials
4. Run `npm run demo`

### Demo → Local Mode

After stopping demo mode (`Ctrl+C`):

1. Run `npm run dev:all` to start local development
   - **Automatic cleanup**: dev.sh resets `public/config.js` to stub and removes stale demo files

If you encounter issues, use the full reset script:

```bash
./scripts/reset-dev-mode.sh
```

## Code Patterns That Work in Both Modes

### Always Use `getApiBaseUrl()`

```typescript
// CORRECT - works in both modes
import { getApiBaseUrl } from '@/lib/apiConfig';
const response = await fetch(`${getApiBaseUrl()}/api/endpoint`);

// WRONG - breaks in demo mode
const response = await fetch('http://localhost:3001/api/endpoint');
```

### Check Demo Mode Before Accessing Config

```typescript
import { isDemoMode, getDemoConfig } from '@/lib/apiConfig';

// CORRECT - safe access
if (isDemoMode()) {
  const config = getDemoConfig();
  console.log('Demo URL:', config?.frontendUrl);
}

// WRONG - may crash if not in demo mode
const url = window.__DEMO_CONFIG__.frontendUrl; // undefined error
```

### Never Hardcode Port Numbers in API Calls

```typescript
// CORRECT
const apiUrl = getApiBaseUrl();

// WRONG
const apiUrl = 'http://localhost:3001';
const apiUrl = `http://localhost:${process.env.PORT}`;
```

## High-Risk Files Reference

| File                                    | Risk     | Impact if Modified Incorrectly          |
| --------------------------------------- | -------- | --------------------------------------- |
| `src/lib/apiConfig.ts`                  | CRITICAL | All API calls fail in one or both modes |
| `server/index.js`                       | HIGH     | Backend routing breaks, CORS issues     |
| `vite.config.ts`                        | HIGH     | Build fails, proxy configuration breaks |
| `scripts/demo.sh`                       | HIGH     | Demo mode fails to start/cleanup        |
| Provider contexts (`*VoiceContext.tsx`) | MEDIUM   | Specific provider API calls fail        |

### apiConfig.ts Resolution Order

1. `window.__DEMO_CONFIG__.apiBaseUrl` (demo mode)
2. `import.meta.env.VITE_API_BASE_URL` (build-time)
3. `http://localhost:3001` (fallback)

**Critical**: Demo mode returns empty string for same-origin requests. Don't assume a non-empty URL.

## Testing Requirements

### Minimum (All Changes)

- Run `npm run lint`
- Run `npm run test:run`
- Run `npm run build`

### High-Risk Changes (apiConfig, server, vite config)

1. Test in local mode: `npm run dev:all`
2. Test in demo mode: `npm run demo`
3. Verify API calls work in both
4. Check browser DevTools Network tab for correct URLs

### Quick Verification Commands

```bash
# Local mode - should show localhost:3001
npm run dev:all
# Open http://localhost:8082, check Network tab

# Demo mode - should show relative paths (no host)
npm run demo
# Open ngrok URL, check Network tab
```

## Troubleshooting Guide

### API Calls Failing After Mode Switch

**Symptoms**:

- 404 errors on API endpoints
- CORS errors in console
- "Failed to fetch" errors

**Cause**: Stale config file from previous mode

**Fix**:

```bash
# Just restart - dev.sh auto-cleans stale demo files
npm run dev:all

# Or run the full reset script
./scripts/reset-dev-mode.sh
```

### Stale Config File Detection

Check if `public/config.js` contains demo config:

```bash
grep "__DEMO_CONFIG__" public/config.js && echo "STALE - needs reset"
```

Check for other stale files:

```bash
ls -la dist/config.js server/.env.demo 2>/dev/null
```

**Note:** `public/config.js` should always exist as either a no-op stub (local) or demo config (ngrok). The dev.sh script auto-resets it.

### Port Conflict Resolution

**Symptoms**: "Port already in use" error

**Fix**:

```bash
# Find process using port
lsof -i :3001
lsof -i :8082
lsof -i :4041

# Kill by PID
kill <PID>

# Or kill all related processes
pkill -f ngrok
pkill -f vite
pkill -f "node.*server"
```

### Emergency Recovery

If everything is broken:

```bash
# 1. Kill all processes
pkill -f ngrok
pkill -f vite
pkill -f "node.*server"

# 2. Remove all generated files
rm -f dist/config.js
rm -f public/config.js
rm -f server/.env.demo
rm -f scripts/ngrok/ngrok.yml

# 3. Clear ports
for port in 3001 8082 4041; do
  lsof -ti :$port | xargs kill -9 2>/dev/null || true
done

# 4. Rebuild
npm run build

# 5. Start fresh
npm run dev:all
```

Or use the reset script:

```bash
./scripts/reset-dev-mode.sh
```

## Generated Files Reference

| File                      | Created By | Purpose                                   | Safe to Delete                     |
| ------------------------- | ---------- | ----------------------------------------- | ---------------------------------- |
| `dist/config.js`          | Demo mode  | Runtime API config for same-origin        | Yes                                |
| `public/config.js`        | Both modes | No-op stub (local) or demo config (ngrok) | No - reset to stub instead         |
| `server/.env.demo`        | Demo mode  | CORS config for ngrok                     | Yes                                |
| `scripts/ngrok/ngrok.yml` | Demo mode  | ngrok tunnel config                       | Yes                                |
| `dist/`                   | Build      | Production assets                         | Yes (rebuild with `npm run build`) |

**Note:** `public/config.js` should always exist. In local mode it's a no-op stub (prevents 404 errors). Demo mode overwrites it with actual config. The `dev.sh` and `reset-dev-mode.sh` scripts automatically reset it to the stub.

## Common Mistakes to Avoid

1. **Running demo mode without stopping local servers first**
   - Causes port conflicts

2. **Modifying apiConfig.ts without testing both modes**
   - Can break one mode while fixing another

3. **Assuming `getApiBaseUrl()` returns a non-empty string**
   - Demo mode returns empty string for same-origin

4. **Committing generated config files**
   - These are gitignored for a reason

5. **Hardcoding localhost URLs in new code**
   - Always use `getApiBaseUrl()`

6. **Not cleaning up after demo mode crashes**
   - Run cleanup script if demo mode didn't exit cleanly
