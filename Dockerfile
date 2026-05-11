# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS build-deps
WORKDIR /app

COPY package*.json ./
RUN --mount=type=cache,id=voice-agent-npm-build,target=/root/.npm \
    npm ci --ignore-scripts

FROM build-deps AS frontend-builder

# Copy only files needed by the Vite build so dependency layers stay cached.
COPY components.json index.html postcss.config.js tsconfig*.json vite.config.ts ./
COPY scripts/ensure-config-stub.mjs ./scripts/
COPY public ./public
COPY src ./src

# Public frontend build-time variables. Do not add server-side API keys here.
ARG VITE_ELEVENLABS_AGENT_ID
ARG VITE_ELEVENLABS_ENABLED=true
ARG VITE_ELEVENLABS_SDK_ENABLED=true
ARG VITE_WIDGET_ORB_COLOR_1
ARG VITE_WIDGET_ORB_COLOR_2
ARG VITE_WIDGET_VARIANT
ARG VITE_WIDGET_ACTION_TEXT
ARG VITE_WIDGET_START_CALL_TEXT
ARG VITE_WIDGET_END_CALL_TEXT
ARG VITE_WIDGET_LISTENING_TEXT
ARG VITE_WIDGET_SPEAKING_TEXT
ARG VITE_WIDGET_AVATAR_URL
ARG VITE_WIDGET_OVERRIDE_VOICE_ID
ARG VITE_WIDGET_OVERRIDE_LANGUAGE
ARG VITE_WIDGET_OVERRIDE_FIRST_MESSAGE
ARG VITE_XAI_ENABLED=true
ARG VITE_XAI_MODEL
ARG VITE_XAI_VOICE
ARG VITE_XAI_INSTRUCTIONS
ARG VITE_OPENAI_ENABLED=true
ARG VITE_OPENAI_MODEL
ARG VITE_OPENAI_VOICE
ARG VITE_OPENAI_INSTRUCTIONS
ARG VITE_OPENAI_TRANSLATION_ENABLED=false
ARG VITE_OPENAI_TRANSLATION_MAX_SESSION_MINUTES=30
ARG VITE_ULTRAVOX_ENABLED=true
ARG VITE_ULTRAVOX_VOICE
ARG VITE_ULTRAVOX_INSTRUCTIONS
ARG VITE_ULTRAVOX_MODEL
ARG VITE_VAPI_ENABLED=true
ARG VITE_VAPI_WEB_TOKEN
ARG VITE_VAPI_API_URL
ARG VITE_VAPI_ASSISTANT_ID
ARG VITE_VAPI_VOICE
ARG VITE_VAPI_MODEL
ARG VITE_VAPI_SYSTEM_PROMPT
ARG VITE_VAPI_FIRST_MESSAGE
ARG VITE_RETELL_ENABLED=true
ARG VITE_RETELL_AGENT_ID
ARG VITE_GEMINI_ENABLED=false
ARG VITE_GEMINI_MODEL
ARG VITE_GEMINI_VOICE
ARG VITE_GEMINI_INSTRUCTIONS
ARG VITE_DEFAULT_PROVIDER
ARG VITE_API_BASE_URL=/
ARG VITE_NODE_ENV=production

RUN npm run build

FROM node:20-alpine AS production-deps

WORKDIR /app

COPY package*.json ./
RUN --mount=type=cache,id=voice-agent-npm-production,target=/root/.npm \
    npm ci --omit=dev --ignore-scripts

FROM node:20-alpine AS production

WORKDIR /app

# Install a minimal init process and create the runtime user.
RUN apk add --no-cache dumb-init && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

COPY --from=production-deps --chown=nodejs:nodejs /app/node_modules ./node_modules

COPY --from=frontend-builder --chown=nodejs:nodejs /app/dist ./dist

COPY --chown=nodejs:nodejs server ./server
COPY --chown=nodejs:nodejs package.json ./

# Set environment
ENV NODE_ENV=production
ENV SERVER_PORT=3001

# Switch to non-root user
USER nodejs:nodejs

# Expose the server port
EXPOSE 3001

# Health check: healthy and degraded provider states both mean the app is serving.
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --quiet --tries=1 --timeout=5 --spider "http://127.0.0.1:${SERVER_PORT:-3001}/api/health" || exit 1

ENTRYPOINT ["dumb-init", "--"]

# Start the server
CMD ["node", "server/index.js"]
