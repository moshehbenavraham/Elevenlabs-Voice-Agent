import express from 'express';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import xaiRoutes from './routes/xai.js';
import openaiRoutes from './routes/openai.js';
import ultravoxRoutes from './routes/ultravox.js';
import retellRoutes from './routes/retell.js';
import geminiRoutes from './routes/gemini.js';
import functionsRoutes from './routes/functions.js';

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Production mode detection
const isProduction = process.env.NODE_ENV === 'production';

// Load base environment variables first
config();

// Demo mode: load .env.demo on top of .env if it exists
// This allows ngrok URLs to override CORS_ORIGIN dynamically
const envDemoPath = join(__dirname, '.env.demo');
if (existsSync(envDemoPath)) {
  config({ path: envDemoPath, override: true });
  console.log('[Server] Demo mode: loaded .env.demo overrides');
}

// Demo mode flag from environment
const isDemoMode = process.env.DEMO_MODE === 'true';

// Rate limiting configuration
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    error: 'Too many requests',
    message: 'You have exceeded the 100 requests in 15 minutes limit. Please try again later.',
    retryAfter: '15 minutes',
  },
});

// Stricter rate limit for token endpoints (ephemeral tokens)
const tokenLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 token requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many token requests',
    message: 'You have exceeded the 10 token requests per minute limit.',
    retryAfter: '1 minute',
  },
});

// Rate limit for static file serving (SPA fallback)
const staticLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Higher limit for static file requests
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests',
    message: 'Too many static file requests. Please try again later.',
    retryAfter: '15 minutes',
  },
});

const app = express();
const PORT = process.env.SERVER_PORT || 3001;
const startTime = Date.now();
const distPath = join(__dirname, '..', 'dist');
const indexPath = join(distPath, 'index.html');

function isEnvConfigured(name) {
  const value = process.env[name];
  return typeof value === 'string' && value.trim().length > 0;
}

function createProviderStatus(requiredEnv) {
  const missing = requiredEnv.filter(name => !isEnvConfigured(name));

  return {
    configured: missing.length === 0,
    missing,
  };
}

function getProviderServices() {
  return {
    elevenlabs: createProviderStatus(['ELEVENLABS_API_KEY', 'VITE_ELEVENLABS_AGENT_ID']),
    openai: createProviderStatus(['OPENAI_API_KEY']),
    xai: createProviderStatus(['XAI_API_KEY']),
    ultravox: createProviderStatus(['ULTRAVOX_API_KEY']),
    vapi: createProviderStatus(['VITE_VAPI_WEB_TOKEN']),
    retell: createProviderStatus(['RETELL_API_KEY']),
    gemini: createProviderStatus(['GEMINI_API_KEY']),
  };
}

function getProviderSummary(services) {
  const total = Object.keys(services).length;
  const configured = Object.values(services).filter(service => service.configured).length;

  return {
    total,
    configured,
    unconfigured: total - configured,
  };
}

function getHealthStatus({ isAppReady, providerSummary }) {
  if (!isAppReady) {
    return 'unhealthy';
  }

  if (providerSummary.configured === providerSummary.total) {
    return 'healthy';
  }

  return 'degraded';
}

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:8082',
  credentials: true,
}));
app.use(express.json());

// Compression for all responses (improves static file delivery)
app.use(compression());

// Serve static files in production mode (BEFORE API routes)
if (isProduction) {
  app.use(express.static(distPath));
  console.log(`[Server] Serving static files from: ${distPath}`);
}

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// Apply stricter rate limiting to token endpoints
app.use('/api/xai/token', tokenLimiter);
app.use('/api/openai/token', tokenLimiter);
app.use('/api/elevenlabs/signed-url', tokenLimiter);
app.use('/api/ultravox/call', tokenLimiter);
app.use('/api/retell/create-web-call', tokenLimiter);
app.use('/api/gemini/session', tokenLimiter);

// API Routes
app.use('/api/xai', xaiRoutes);
app.use('/api/openai', openaiRoutes);
app.use('/api/ultravox', ultravoxRoutes);
app.use('/api/retell', retellRoutes);
app.use('/api/gemini', geminiRoutes);
app.use('/api/functions', functionsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const memUsage = process.memoryUsage();
  const uptimeMs = Date.now() - startTime;
  const services = getProviderServices();
  const providerSummary = getProviderSummary(services);
  const isStaticReady = !isProduction || existsSync(indexPath);
  const isAppReady = isStaticReady;
  const status = getHealthStatus({ isAppReady, providerSummary });
  const httpStatus = status === 'unhealthy' ? 503 : 200;

  // Security features status
  const security = {
    cors: {
      enabled: true,
      origin: process.env.CORS_ORIGIN || 'http://localhost:8082',
    },
    rateLimiting: {
      enabled: true,
      api: { windowMs: 900000, max: 100 }, // 15 min, 100 requests
      tokens: { windowMs: 60000, max: 10 }, // 1 min, 10 requests
    },
    demoMode: isDemoMode,
  };

  const healthResponse = {
    status,
    ready: isAppReady,
    statusMapping: {
      healthy: 'Application is serving and all provider runtime variables are configured.',
      degraded: 'Application is serving, but one or more providers are not configured.',
      unhealthy: 'Application is not ready to serve production traffic.',
    },
    timestamp: new Date().toISOString(),
    uptime: {
      ms: uptimeMs,
      formatted: `${Math.floor(uptimeMs / 1000 / 60)} minutes`,
    },
    memory: {
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
      rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
    },
    runtime: {
      nodeEnv: process.env.NODE_ENV || 'development',
      staticAssets: {
        required: isProduction,
        ready: isStaticReady,
      },
    },
    providerSummary,
    services,
    security,
    version: process.env.npm_package_version || '1.0.0',
  };

  res.status(httpStatus).json(healthResponse);
});

// Get signed URL for ElevenLabs conversation
app.get('/api/elevenlabs/signed-url', async (req, res) => {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.VITE_ELEVENLABS_AGENT_ID;

  if (!apiKey) {
    console.error('[Server] ELEVENLABS_API_KEY is not configured');
    return res.status(500).json({
      error: 'Server configuration error',
      message: 'API key not configured'
    });
  }

  if (!agentId) {
    console.error('[Server] VITE_ELEVENLABS_AGENT_ID is not configured');
    return res.status(500).json({
      error: 'Server configuration error',
      message: 'Agent ID not configured'
    });
  }

  try {
    console.log(`[Server] Requesting signed URL for agent: ${agentId.substring(0, 10)}...`);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': apiKey,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Server] ElevenLabs API error: ${response.status} - ${errorText}`);
      return res.status(response.status).json({
        error: 'Failed to get signed URL',
        message: errorText
      });
    }

    const data = await response.json();
    console.log('[Server] Signed URL generated successfully');

    res.json({ signedUrl: data.signed_url });
  } catch (error) {
    console.error('[Server] Error getting signed URL:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// SPA fallback: serve index.html for all non-API routes in production
// This must come AFTER all API routes
// Express 5 requires named wildcards - use {*path} syntax
if (isProduction) {
  app.get('{*path}', staticLimiter, (req, res) => {
    // Only serve index.html for non-API routes
    if (!req.path.startsWith('/api')) {
      res.sendFile(indexPath);
    }
  });
}

app.listen(PORT, () => {
  console.log(`[Server] Running on http://localhost:${PORT}`);
  console.log(`[Server] Mode: ${isProduction ? 'production' : 'development'}${isDemoMode ? ' (demo)' : ''}`);
  console.log(`[Server] CORS origin: ${process.env.CORS_ORIGIN || 'http://localhost:8082'}`);
  if (isDemoMode) {
    console.log('[Server] Demo mode: CORS configured for ngrok tunnel');
  }
  console.log(`[Server] ElevenLabs API key: ${process.env.ELEVENLABS_API_KEY ? 'Yes' : 'No'}`);
  console.log(`[Server] ElevenLabs Agent ID: ${process.env.VITE_ELEVENLABS_AGENT_ID ? 'Yes' : 'No'}`);
  console.log(`[Server] xAI API key: ${process.env.XAI_API_KEY ? 'Yes' : 'No'}`);
  console.log(`[Server] OpenAI API key: ${process.env.OPENAI_API_KEY ? 'Yes' : 'No'}`);
  console.log(`[Server] Ultravox API key: ${process.env.ULTRAVOX_API_KEY ? 'Yes' : 'No'}`);
  console.log(`[Server] Retell API key: ${process.env.RETELL_API_KEY ? 'Yes' : 'No'}`);
  console.log(`[Server] Gemini API key: ${process.env.GEMINI_API_KEY ? 'Yes' : 'No'}`);
});
