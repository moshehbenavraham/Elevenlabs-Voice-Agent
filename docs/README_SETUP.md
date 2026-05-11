# Voice-Agent-PuPuPlatter Setup Guide

## Quick Start

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Configure provider settings**
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` and add the provider variables you need:
     ```
     VITE_ELEVENLABS_AGENT_ID=your_actual_agent_id_here
     ```
   - Add any other enabled provider variables, such as `VITE_XAI_ENABLED=true` or `VITE_OPENAI_ENABLED=true`.

3. **Get Your Agent ID**
   - Log in to [ElevenLabs](https://elevenlabs.io)
   - Navigate to Conversational AI > Agents
   - Create a new agent or use an existing one
   - Copy the Agent ID from the agent details

4. **Start the development server**

   ```bash
   npm run dev:all
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
- Verify the provider variables are correctly copied
- Restart the development server after updating `.env`

### Microphone Access Issues

- Check browser permissions for microphone access
- Ensure no other applications are using the microphone
- Try using Chrome or Edge for best compatibility

### Connection Errors

- Verify your internet connection
- Check that the provider account is active
- Ensure the provider identifiers are valid and published where required

## Features

- **Real-time Voice Conversation**: Natural, low-latency voice interactions
- **Visual Feedback**: Dynamic visualizations that respond to voice activity
- **Responsive Design**: Works on desktop and mobile devices
- **Dark/Light Theme**: Toggle between themes for comfort
- **Volume Control**: Adjust audio output levels
- **Error Handling**: Clear error messages with actionable solutions

## Production Deployment

When deploying to production:

1. Set the required `VITE_*` environment variables on your hosting platform
2. Ensure HTTPS is enabled (required for microphone access)
3. Keep API secrets on the server and avoid exposing them to the browser
4. Test on multiple devices and browsers

## Support

- [Project README](../README.md)
- [Onboarding Guide](onboarding.md)
- Project Issues: Create an issue in this repository
