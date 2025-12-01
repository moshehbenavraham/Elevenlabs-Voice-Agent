# ElevenLabs Voice Agent Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure ElevenLabs**
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` and add your ElevenLabs Agent ID:
     ```
     VITE_ELEVENLABS_AGENT_ID=your_actual_agent_id_here
     ```

3. **Get Your Agent ID**
   - Log in to [ElevenLabs](https://elevenlabs.io)
   - Navigate to Conversational AI → Agents
   - Create a new agent or use an existing one
   - Copy the Agent ID from the agent details

4. **Start the Development Server**
   ```bash
   npm run dev
   ```

5. **Using the App**
   - Click "Start Voice Chat" to begin
   - Allow microphone access when prompted
   - Speak naturally - the AI will respond in real-time
   - Use the volume control to adjust audio levels
   - Click the settings icon to update configuration

## Troubleshooting

### "Configuration Required" Error
- Make sure you've created the `.env` file
- Verify your Agent ID is correctly copied
- Restart the development server after updating `.env`

### Microphone Access Issues
- Check browser permissions for microphone access
- Ensure no other applications are using the microphone
- Try using Chrome or Edge for best compatibility

### Connection Errors
- Verify your internet connection
- Check if your ElevenLabs account is active
- Ensure your Agent ID is valid and the agent is published

## Features

- **Real-time Voice Conversation**: Natural, low-latency voice interactions
- **Visual Feedback**: Dynamic visualizations that respond to voice activity
- **Responsive Design**: Works on desktop and mobile devices
- **Dark/Light Theme**: Toggle between themes for comfort
- **Volume Control**: Adjust audio output levels
- **Error Handling**: Clear error messages with actionable solutions

## Production Deployment

When deploying to production:

1. Set the `VITE_ELEVENLABS_AGENT_ID` environment variable on your hosting platform
2. Ensure HTTPS is enabled (required for microphone access)
3. Consider implementing server-side authentication for the ElevenLabs API
4. Test on multiple devices and browsers

## Support

- [ElevenLabs Documentation](https://elevenlabs.io/docs)
- [ElevenLabs Discord](https://discord.gg/elevenlabs)
- Project Issues: Create an issue in this repository