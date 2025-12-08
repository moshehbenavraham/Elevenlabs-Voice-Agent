import type { FC } from 'react';
import { Settings, ExternalLink, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConfigurationModal: FC<ConfigurationModalProps> = ({ isOpen, onClose }) => {
  const agentId = import.meta.env.VITE_ELEVENLABS_AGENT_ID;
  const isConfigured = agentId && agentId !== 'your_agent_id_here';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-enhanced border-white/20 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Voice Agent Settings
          </DialogTitle>
          <DialogDescription className="text-white/70">
            View your voice agent configuration status and setup instructions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Status Alert */}
          <Alert
            className={`border ${isConfigured ? 'border-green-500/50 bg-green-500/10' : 'border-yellow-500/50 bg-yellow-500/10'}`}
          >
            <Info className="w-4 h-4" />
            <AlertDescription className={isConfigured ? 'text-green-400' : 'text-yellow-400'}>
              {isConfigured
                ? 'Agent ID is configured. You can start voice conversations.'
                : 'Please configure your ElevenLabs Agent ID to enable voice chat.'}
            </AlertDescription>
          </Alert>

          {/* GitHub Link */}
          <div className="space-y-2 text-center">
            <p className="text-sm text-white/70 mb-2">This is an open source project</p>
            <a
              href="https://github.com/moshehbenavraham/Elevenlabs-Voice-Agent"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View on GitHub
            </a>
          </div>

          {/* Instructions */}
          <div className="space-y-3 p-4 glass rounded-lg">
            <h3 className="font-medium text-white/90">Setup Instructions:</h3>
            <ol className="space-y-2 text-sm text-white/70">
              <li>
                1. Create a <code className="px-1 py-0.5 glass rounded">.env</code> file in your
                project root
              </li>
              <li>
                2. Copy the <code className="px-1 py-0.5 glass rounded">.env.example</code> file
                contents
              </li>
              <li>
                3. Replace <code className="px-1 py-0.5 glass rounded">your_agent_id_here</code>{' '}
                with your actual Agent ID
              </li>
              <li>4. Restart your development server</li>
            </ol>
          </div>

          {/* Help Link */}
          <a
            href="https://elevenlabs.io/docs/conversational-ai/quickstart"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            View ElevenLabs Documentation
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
};
