# Voice-Agent-PuPuPlatter

Multi-provider voice AI demo platform with React, TypeScript, Express, and a feature-flagged OpenAI live translation tab.

## Quick Start

```bash
npm run dev:all
```

This starts the Vite frontend on `http://localhost:8082` and the Express API on `http://localhost:3001`.

For a shareable HTTPS demo:

```bash
npm run demo
```

## Repository Structure

```text
.
|-- src/                # Frontend app, providers, hooks, and shared types
|-- server/             # Express API and security utilities
|-- docs/               # Deployment, architecture, onboarding, and runbooks
|-- tests/              # Playwright fixtures and browser tests
|-- .spec_system/       # Apex spec system state, PRD, sessions, and archives
\-- scripts/            # Local automation for dev, demo, and deploy tasks
```

## Documentation

- [Onboarding](docs/onboarding.md)
- [Development Guide](docs/development.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [CI/CD Operations Guide](docs/CI_CD.md)
- [OpenAI Translation Demo Guide](docs/OPENAI_TRANSLATION_DEMO.md)
- [Contributing](CONTRIBUTING.md)

## Scripts

- `npm run dev` - Vite frontend only
- `npm run dev:all` - Frontend plus backend
- `npm run server` - Express API only
- `npm run build` - Production frontend build
- `npm run test:run` - Vitest once
- `npm run test:e2e:ci` - Bounded Playwright CI subset
- `npm run docker:prod` - Start the production container and verify health
- `npm run demo` - Build production assets and launch ngrok demo mode

## Tech Stack

- React 19 and TypeScript for the UI
- Vite for frontend development and bundling
- Express for server routes, token minting, and health checks
- Playwright and Vitest for browser and unit coverage
- Docker and ngrok for production-like local runs and demos

## Provider Model

Supported tabs are controlled through environment flags and the shared provider order in `src/types/voice-provider.ts`:

- ElevenLabs Widget
- ElevenLabs SDK
- xAI Grok
- OpenAI Realtime
- OpenAI Translation
- Ultravox
- Vapi
- Retell
- Gemini Live
