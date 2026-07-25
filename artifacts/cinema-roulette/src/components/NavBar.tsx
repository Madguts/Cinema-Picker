import { Link } from 'wouter';
import { Clapperboard } from 'lucide-react';

export function NavBar() {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
      style={{
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.9), rgba(0,0,0,0))',
      }}
      data-testid="navbar"
    >
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-2.5 no-underline"
        data-testid="link-home"
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{
            background: '#FFEA00',
          }}
        >
          <Clapperboard size={16} style={{ color: '#000' }} />
        </div>
        <div>
          <div
            className="font-semibold text-base leading-none"
            style={{ color: '#fff' }}
          >
            Cinema Roulette
          </div>
          <div
            className="leading-none mt-0.5 uppercase tracking-widest"
            style={{ color: '#777', fontSize: '9px' }}
          >
            Omniplex Lisburn
          </div>
        </div>
      </Link>
    </nav>
  );
}
