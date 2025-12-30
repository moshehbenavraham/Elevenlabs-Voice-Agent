# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
# --ignore-scripts skips husky prepare hook (not needed in Docker)
RUN npm ci --ignore-scripts

# Copy source files
COPY . .

# Build frontend with Vite
# VITE_* variables must be passed as build args
ARG VITE_ELEVENLABS_AGENT_ID
ARG VITE_ELEVENLABS_ENABLED=true
ARG VITE_ELEVENLABS_SDK_ENABLED=true
ARG VITE_XAI_ENABLED=true
ARG VITE_OPENAI_ENABLED=true
ARG VITE_API_BASE_URL

RUN npm run build

# Stage 2: Production dependencies
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies (skip husky prepare hook)
RUN npm ci --omit=dev --ignore-scripts

# Stage 3: Production image
FROM node:20-alpine AS production

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy production node_modules (owned by nodejs user)
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy built frontend (owned by nodejs user)
COPY --from=frontend-builder --chown=nodejs:nodejs /app/dist ./dist

# Copy server files (owned by nodejs user)
COPY --chown=nodejs:nodejs server ./server
COPY --chown=nodejs:nodejs package.json ./

# Set environment
ENV NODE_ENV=production
ENV SERVER_PORT=3001

# Switch to non-root user
USER nodejs

# Expose the server port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

# Start the server
CMD ["node", "server/index.js"]
