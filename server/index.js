import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';

// Load environment variables
config();

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:8082',
  credentials: true,
}));
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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

app.listen(PORT, () => {
  console.log(`[Server] Running on http://localhost:${PORT}`);
  console.log(`[Server] CORS origin: ${process.env.CORS_ORIGIN || 'http://localhost:8082'}`);
  console.log(`[Server] API key configured: ${process.env.ELEVENLABS_API_KEY ? 'Yes' : 'No'}`);
  console.log(`[Server] Agent ID configured: ${process.env.VITE_ELEVENLABS_AGENT_ID ? 'Yes' : 'No'}`);
});
