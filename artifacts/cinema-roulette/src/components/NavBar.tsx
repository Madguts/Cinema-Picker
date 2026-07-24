import { Link, useLocation } from 'wouter';
import { Clapperboard, LayoutGrid } from 'lucide-react';

export function NavBar() {
  const [location] = useLocation();

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
      style={{
        background: 'linear-gradient(to bottom, hsl(24 12% 6%), hsl(24 12% 6% / 0.0))',
        backdropFilter: 'blur(0px)',
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
            background: 'linear-gradient(135deg, hsl(38 85% 55%), hsl(32 70% 40%))',
            boxShadow: '0 0 20px hsl(38 85% 55% / 0.3)',
          }}
        >
          <Clapperboard size={16} style={{ color: 'hsl(24 20% 8%)' }} />
        </div>
        <div>
          <div
            className="font-serif font-bold text-base leading-none"
            style={{ color: 'hsl(38 60% 88%)' }}
          >
            Cinema Roulette
          </div>
          <div
            className="text-xs leading-none mt-0.5"
            style={{ color: 'hsl(34 20% 42%)', fontSize: '9px', letterSpacing: '0.1em' }}
          >
            OMNIPLEX LISBURN
          </div>
        </div>
      </Link>

      {/* Nav links */}
      <div className="flex items-center gap-1">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 no-underline text-sm font-medium"
          style={{
            background: location === '/' ? 'hsl(38 85% 55% / 0.15)' : 'transparent',
            border: `1px solid ${location === '/' ? 'hsl(38 85% 55% / 0.3)' : 'transparent'}`,
            color: location === '/' ? 'hsl(38 85% 65%)' : 'hsl(34 20% 50%)',
          }}
          data-testid="link-nav-home"
        >
          <Clapperboard size={14} />
          <span>Roulette</span>
        </Link>
        <Link
          href="/movies"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 no-underline text-sm font-medium"
          style={{
            background: location === '/movies' ? 'hsl(38 85% 55% / 0.15)' : 'transparent',
            border: `1px solid ${location === '/movies' ? 'hsl(38 85% 55% / 0.3)' : 'transparent'}`,
            color: location === '/movies' ? 'hsl(38 85% 65%)' : 'hsl(34 20% 50%)',
          }}
          data-testid="link-nav-movies"
        >
          <LayoutGrid size={14} />
          <span>All Films</span>
        </Link>
      </div>
    </nav>
  );
}
