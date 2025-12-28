# Session 02: xAI Backend Integration

| Field                  | Value                         |
| ---------------------- | ----------------------------- |
| **Session ID**         | phase00-session02-xai-backend |
| **Phase**              | 00 - Multi-Provider Voice     |
| **Status**             | Not Started                   |
| **Estimated Duration** | 2 hours                       |
| **Estimated Tasks**    | 15-20                         |

---

## Objective

Create the backend infrastructure for xAI voice agent integration by implementing an ephemeral token endpoint that enables secure client-to-xAI WebSocket connections without exposing API keys.

---

## Prerequisites

- [x] Session 01 completed (provider types and tab system)
- [x] Existing `server/index.js` Express setup
- [ ] xAI API key obtained

---

## Key Deliverables

### 1. xAI Routes

- `server/routes/xai.js` - Express routes for xAI
- `POST /api/xai/session` - Create ephemeral token
- `GET /api/xai/session/:id` - Get session status (optional)

### 2. Environment Configuration

- Add `XAI_API_KEY` to `.env.example`
- Add `VITE_XAI_ENABLED` flag
- Document xAI environment variables

### 3. Server Integration

- Register xAI routes in `server/index.js`
- Add xAI key validation middleware
- Error handling for xAI API failures

---

## Scope

### In Scope (MVP)

- Ephemeral token endpoint
- Environment variable handling
- Basic error responses
- CORS configuration for WebSocket

### Out of Scope

- Session management/cleanup
- Rate limiting (defer to production hardening)
- xAI voice model configuration endpoint
- Frontend xAI integration (Session 03)

---

## Technical Approach

### Ephemeral Token Pattern

Based on `EXAMPLE/xai/backend-nodejs/`:

```javascript
// POST /api/xai/session
app.post('/api/xai/session', async (req, res) => {
  const response = await fetch('https://api.x.ai/v1/realtime/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.XAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'grok-2-public',
      voice: 'default',
      instructions: req.body.instructions || 'You are a helpful assistant.',
    }),
  });

  const data = await response.json();
  res.json({ token: data.client_secret.value });
});
```

### Route Structure

```
server/
├── index.js           # Main server (existing)
└── routes/
    └── xai.js         # xAI routes (new)
```

---

## Dependencies

### Internal

- `server/index.js` - Existing Express server
- Session 01 completion

### External

- xAI Realtime API access
- Valid `XAI_API_KEY`

---

## Success Criteria

1. `/api/xai/session` returns ephemeral token
2. Endpoint rejects requests when API key missing
3. Error responses follow existing API patterns
4. Server starts without errors
5. Manual testing with curl/Postman works

---

## Files to Create/Modify

| File                   | Action | Description         |
| ---------------------- | ------ | ------------------- |
| `server/routes/xai.js` | CREATE | xAI route handlers  |
| `server/index.js`      | MODIFY | Register xAI routes |
| `.env.example`         | MODIFY | Add xAI variables   |

---

## Testing Strategy

- Manual API testing with curl
- Unit tests for route handlers
- Error case coverage (missing key, API failure)
