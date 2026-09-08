import { ServerOptions, cli, defineAgent, inference, voice, log } from '@livekit/agents';
import { RoomEvent } from '@livekit/rtc-node';
import { createSessionLifetime } from './lifetime.js';
import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { getLiveKitConfig } from '../../../shared/livekit-config.mjs';

loadEnv({ path: fileURLToPath(new URL('../../../.env', import.meta.url)), quiet: true });
const config = getLiveKitConfig();
if (!config.configured)
  throw new Error('LiveKit agent configuration is missing or invalid. See docs/LIVEKIT_CLOUD.md.');

export default defineAgent({
  entry: async (ctx) => {
    // SDK info logs include transcript text; keep job logs at warning level.
    log().level = 'warn';
    const session = new voice.AgentSession({
      stt: new inference.STT({ model: 'deepgram/nova-3', language: 'en' }),
      llm: new inference.LLM({ model: 'google/gemma-4-31b-it' }),
      tts: new inference.TTS({ model: 'inworld/inworld-tts-2', voice: 'Ashley' }),
      turnHandling: {
        turnDetection: new inference.TurnDetector(),
        interruption: { mode: 'adaptive' },
      },
    });
    const lifetime = createSessionLifetime(config.maxSessionSeconds, async (reason) => {
      try {
        await ctx.room.localParticipant?.setAttributes({ 'pupu.sessionEnd': reason });
      } catch {
        /* A departed room cannot receive final status. */
      }
      try {
        await session.close();
      } finally {
        ctx.shutdown(reason);
      }
    });
    ctx.addShutdownCallback(async () => {
      lifetime.dispose();
      await session.close();
    });
    session.on(voice.AgentSessionEventTypes.Close, (event) => {
      void lifetime.finish(event.error ? 'pipeline-error' : event.reason);
    });
    await ctx.connect();
    // The server supplies the intended visitor identity, never an arbitrary client prompt.
    const metadata = JSON.parse(ctx.job.metadata || '{}') as { participantIdentity?: string };
    const participant = await ctx.waitForParticipant(metadata.participantIdentity);
    const participantLeft = (departed: { identity: string }) => {
      if (departed.identity === participant.identity) void lifetime.finish('participant-left');
    };
    ctx.room.on(RoomEvent.ParticipantDisconnected, participantLeft);
    ctx.addShutdownCallback(async () => {
      ctx.room.off(RoomEvent.ParticipantDisconnected, participantLeft);
    });
    if (lifetime.finished) return;
    await session.start({
      room: ctx.room,
      record: false,
      inputOptions: { participantIdentity: participant.identity, closeOnDisconnect: true },
      agent: voice.Agent.create({
        instructions:
          'You are the PuPuPlatter voice demo assistant. Be warm, curious, and helpful. ' +
          'Speak in English, with one to three concise sentences per turn. Use plain spoken text, ' +
          'without markdown or emojis. You can explain ideas and brainstorm, but have no tools ' +
          'and cannot perform external actions. Never claim to have done so.',
      }),
    });
    if (!lifetime.finished)
      session.generateReply({
        instructions: 'Greet the visitor briefly and ask what they would like to explore.',
      });
  },
});

cli.runApp(
  new ServerOptions({
    agent: fileURLToPath(import.meta.url),
    agentName: config.agentName,
    numIdleProcesses: 0,
    port: Number(process.env.LIVEKIT_AGENT_PORT || 8081),
    host: '127.0.0.1',
    logLevel: 'info',
    drainTimeout: 0,
  })
);
