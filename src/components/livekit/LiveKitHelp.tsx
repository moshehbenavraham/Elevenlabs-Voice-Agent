import { CircleHelp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

/** Present keyboard-accessible usage and troubleshooting guidance for the voice demo. */
export function LiveKitHelp() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost">
          <CircleHelp data-icon="inline-start" />
          Help
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-950 text-zinc-100 border-zinc-800">
        <DialogHeader>
          <DialogTitle>Make yourself heard</DialogTitle>
          <DialogDescription>A few tips for your LiveKit conversation.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 text-sm text-zinc-300 leading-relaxed">
          <p>
            Allow microphone access when you start. Headphones help prevent your assistant from
            hearing its own voice.
          </p>
          <p>
            Speak naturally, and interrupt whenever you want to change direction. Use Mute to pause
            your microphone or End conversation to disconnect.
          </p>
          <p>
            If you cannot hear the assistant, choose Enable audio and check your browser sound
            permissions. If it cannot connect, ask your demo host to check the local agent.
          </p>
          <p>
            Transcripts stay in this page until you clear them or leave. This demo does not enable
            session recording.
          </p>
          <a
            href="https://docs.livekit.io/agents/"
            target="_blank"
            rel="noreferrer"
            className="text-cyan-300 underline underline-offset-4"
          >
            About LiveKit voice agents
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
