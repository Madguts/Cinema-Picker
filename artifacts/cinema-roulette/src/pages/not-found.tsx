import { Link } from 'wouter';
import { Clapperboard } from 'lucide-react';

export default function NotFound() {
  return (
    <div
      className="min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center"
      style={{ background: 'hsl(24 12% 7%)' }}
    >
      <div
        className="font-serif text-8xl font-bold mb-4"
        style={{
          background: 'linear-gradient(135deg, hsl(38 85% 55% / 0.3), hsl(32 70% 42% / 0.2))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        404
      </div>
      <Clapperboard size={32} className="mb-4" style={{ color: 'hsl(38 50% 35%)' }} />
      <h1
        className="font-serif text-2xl font-bold mb-2"
        style={{ color: 'hsl(38 60% 80%)' }}
      >
        Scene not found.
      </h1>
      <p className="text-sm mb-8" style={{ color: 'hsl(34 20% 45%)' }}>
        This page has been cut from the reel.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg no-underline font-medium transition-all duration-200 hover:opacity-80"
        style={{
          background: 'linear-gradient(135deg, hsl(38 85% 50%), hsl(32 75% 40%))',
          color: 'hsl(24 20% 8%)',
          fontSize: '14px',
        }}
        data-testid="link-not-found-home"
      >
        Back to the oracle
      </Link>
    </div>
  );
}
