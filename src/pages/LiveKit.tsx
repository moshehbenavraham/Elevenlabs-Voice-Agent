import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LiveKitDemo from '@/components/livekit/LiveKitDemo';
import { LiveKitHelp } from '@/components/livekit/LiveKitHelp';

export default function LiveKit() {
  return (
    <div className="lk-page">
      <header className="lk-header">
        <Link to="/" className="lk-brand">
          PuPuPlatter
        </Link>
        <span className="lk-brand-provider">LiveKit Cloud</span>
        <nav aria-label="Demo navigation">
          <Button variant="ghost" asChild>
            <Link to="/">
              <ArrowLeft />
              Back to providers
            </Link>
          </Button>
          <LiveKitHelp />
        </nav>
      </header>
      <main>
        <LiveKitDemo />
      </main>
    </div>
  );
}
