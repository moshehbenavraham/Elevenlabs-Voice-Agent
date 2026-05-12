# Onboarding

Zero-to-hero checklist for new developers.

## Prerequisites

- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm 7+ or Bun installed
- [ ] Git installed
- [ ] Modern browser (Chrome, Firefox, Edge, Safari)
- [ ] Microphone available for voice testing
- [ ] ElevenLabs account (for ElevenLabs provider)
- [ ] xAI account (for xAI Grok provider)
- [ ] OpenAI account (for OpenAI Realtime and OpenAI Translation)
- [ ] Ultravox account (for Ultravox provider)
- [ ] Vapi account (for Vapi provider)
- [ ] Retell account (for Retell provider)
- [ ] Google AI account (for Gemini Live provider)

## Setup Steps

### 1. Clone Repository

```bash
git clone <REPO_URL>
cd Voice-Agent-PuPuPlatter
```

### 2. Install Dependencies

```bash
# Using npm
npm install

# Or using Bun (faster)
bun install
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your values
```

### 4. Required Secrets

| Variable                   | Where to Get                                                        | Description                                      |
| -------------------------- | ------------------------------------------------------------------- | ------------------------------------------------ |
| `VITE_ELEVENLABS_AGENT_ID` | [ElevenLabs Dashboard](https://elevenlabs.io/app/conversational-ai) | Agent ID for voice conversations                 |
| `ELEVENLABS_API_KEY`       | [ElevenLabs API Keys](https://elevenlabs.io/app/settings/api-keys)  | Server-side API key                              |
| `XAI_API_KEY`              | [xAI Console](https://console.x.ai/)                                | Server-side API key for Grok                     |
| `OPENAI_API_KEY`           | [OpenAI API Keys](https://platform.openai.com/api-keys)             | Server-side API key for Realtime and translation |
| `ULTRAVOX_API_KEY`         | [Ultravox Dashboard](https://ultravox.ai/)                          | Server-side API key for Ultravox                 |
| `VITE_VAPI_WEB_TOKEN`      | [Vapi Dashboard](https://dashboard.vapi.ai/)                        | Public web token (frontend-safe)                 |
| `RETELL_API_KEY`           | [Retell Dashboard](https://dashboard.retellai.com/)                 | Server-side API key for Retell                   |
| `VITE_RETELL_AGENT_ID`     | [Retell Dashboard](https://dashboard.retellai.com/)                 | Retell Agent ID                                  |
| `GEMINI_API_KEY`           | [Google AI Studio](https://aistudio.google.com/apikey)              | Server-side API key for Gemini                   |
| `VITE_GEMINI_VOICE`        | Default: Zephyr                                                     | Gemini voice selection (30 opts)                 |

### 5. Start Development

```bash
# Start both frontend (8082) and backend (3001)
npm run dev:all

# Or just frontend
npm run dev

# Or the production-style demo with ngrok
npm run demo
```

### 6. Verify Setup

- [ ] Frontend runs at `http://localhost:8082`
- [ ] Backend health check: `curl http://localhost:3001/api/health`
- [ ] Tests pass: `npm run test:run`
- [ ] ElevenLabs tab shows (if `VITE_ELEVENLABS_ENABLED=true`)
- [ ] xAI tab shows (if `VITE_XAI_ENABLED=true`)
- [ ] OpenAI tab shows (if `VITE_OPENAI_ENABLED=true`)
- [ ] OpenAI Translation tab shows (if `VITE_OPENAI_TRANSLATION_ENABLED=true`)
- [ ] Ultravox tab shows (if `VITE_ULTRAVOX_ENABLED=true`)
- [ ] Vapi tab shows (if `VITE_VAPI_ENABLED=true`)
- [ ] Retell tab shows (if `VITE_RETELL_ENABLED=true`)
- [ ] Gemini tab shows (if `VITE_GEMINI_ENABLED=true`)
- [ ] Voice connection works when clicking "Start Conversation"

## Project Structure

```
Voice-Agent-PuPuPlatter/
├── src/
│   ├── components/
│   │   ├── tabs/           # Provider tab navigation
│   │   ├── providers/      # Provider-specific components
│   │   ├── voice/          # Voice UI components
│   │   └── ui/             # shadcn/ui components
│   ├── contexts/           # React contexts (Provider, Voice, Theme)
│   ├── hooks/              # Custom hooks
│   ├── lib/
│   │   ├── audio/          # Audio processing utilities
│   │   ├── gemini/         # Gemini Live audio and client
│   │   └── openaiTranslation.ts # OpenAI translation shared config
│   ├── types/              # TypeScript definitions
│   └── pages/              # Route components
├── server/
│   ├── index.js            # Express server
│   └── routes/             # API routes
├── docs/                   # Documentation
└── .spec_system/           # Spec system (PRD, sessions)
```

## Common Issues

### Microphone Permission Denied

**Solution**:

- Ensure HTTPS in production (required for microphone)
- Check browser permissions
- Try incognito mode to reset permissions

### xAI Connection Failed

**Solution**:

- Verify `XAI_API_KEY` is set in `.env`
- Ensure backend is running on port 3001
- Check browser console for errors

### ElevenLabs Agent Not Found

**Solution**:

- Verify `VITE_ELEVENLABS_AGENT_ID` is correct
- Check agent is published in ElevenLabs dashboard
- Ensure API key has access to the agent

### Tests Failing

**Solution**:

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run test:run
```

### Gemini Connection Failed

**Solution**:

- Verify `GEMINI_API_KEY` is set in `.env`
- Ensure backend is running on port 3001
- Check that the API key has access to Gemini Live API
- Sessions are limited to 15 minutes

## Demo Mode

For client demos, mobile testing, or team collaboration with HTTPS access:

```bash
# Prerequisites: ngrok CLI installed and authenticated
./scripts/ngrok/install-instructions.sh
ngrok config add-authtoken YOUR_TOKEN

# Start demo mode
npm run demo
```

See [Demo Mode](DEMO_MODE.md) for full documentation.

## Next Steps

1. Read [Architecture Overview](ARCHITECTURE.md)
2. Review [Development Guide](development.md)
3. Check [Contributing Guidelines](../CONTRIBUTING.md)
4. Explore the codebase starting with `src/pages/Index.tsx`
