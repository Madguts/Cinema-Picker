import { useState, useMemo } from 'react';
import { format, startOfDay } from 'date-fns';
import { AlertCircle, Film, Ban, Check } from 'lucide-react';
import type { CinemaMovie } from '@workspace/api-client-react';
import { useShowtimes } from '@/hooks/use-showtimes';
import { useVetoes } from '@/hooks/use-vetoes';
import { DayPicker } from '@/components/DayPicker';
import { MoviePosterCard } from '@/components/MoviePosterCard';

function getDefaultDate(): string {
  return format(startOfDay(new Date()), 'yyyy-MM-dd');
}

function sortTitle(title: string): string {
  return title.replace(/^(The |A |An )/i, '').trim().toLowerCase();
}

export default function MoviesPage() {
  const [selectedDate, setSelectedDate] = useState(getDefaultDate);
  const { isVetoed, toggleVeto, vetoes } = useVetoes();

  const { data, isLoading, error } = useShowtimes(selectedDate);

  const sortedMovies = useMemo(() => {
    if (!data?.movies) return [];
    return [...data.movies].sort((a, b) => sortTitle(a.title).localeCompare(sortTitle(b.title)));
  }, [data?.movies]);

  const vetoedCount = useMemo(
    () => sortedMovies.filter((m) => isVetoed(m.id)).length,
    [sortedMovies, vetoes, isVetoed]
  );

  const clearAllVetoes = () => {
    const toRemove = sortedMovies.map((m) => m.id).filter((id) => isVetoed(id));
    toRemove.forEach((id) => {
      if (isVetoed(id)) toggleVeto(id);
    });
  };

  return (
    <div
      className="min-h-[100dvh] flex flex-col"
      style={{ background: 'hsl(24 12% 7%)' }}
    >
      {/* Ambient glow */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 0%, hsl(38 60% 20% / 0.08), transparent)',
        }}
      />

      {/* Header */}
      <div
        className="relative pt-24 pb-10 px-6"
        style={{ background: 'linear-gradient(to bottom, hsl(24 12% 6%), hsl(24 12% 7%))' }}
      >
        <div
          aria-hidden="true"
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, hsl(38 85% 55% / 0.25), transparent)' }}
        />

        <div className="max-w-6xl mx-auto">
          <div
            className="inline-block mb-3 font-mono uppercase tracking-widest text-xs px-3 py-1 rounded-full"
            style={{
              background: 'hsl(38 85% 55% / 0.1)',
              border: '1px solid hsl(38 85% 55% / 0.2)',
              color: 'hsl(38 70% 55%)',
              fontSize: '10px',
            }}
          >
            Omniplex Lisburn
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1
                className="font-serif text-4xl md:text-5xl font-bold leading-tight"
                style={{ color: 'hsl(38 60% 92%)' }}
              >
                All Films
              </h1>
              {!isLoading && data?.movies && (
                <p
                  className="mt-1 text-sm font-mono"
                  style={{ color: 'hsl(34 20% 45%)' }}
                >
                  {sortedMovies.length} film{sortedMovies.length !== 1 ? 's' : ''} showing
                  {vetoedCount > 0 && (
                    <span style={{ color: 'hsl(0 55% 48%)' }}>
                      {' '}— {vetoedCount} vetoed
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* Veto controls */}
            {vetoedCount > 0 && (
              <button
                onClick={clearAllVetoes}
                className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 self-start sm:self-auto hover:opacity-80"
                style={{
                  background: 'hsl(0 40% 12%)',
                  border: '1px solid hsl(0 40% 20%)',
                  color: 'hsl(0 60% 55%)',
                  fontSize: '13px',
                }}
                data-testid="button-clear-vetoes"
              >
                <Check size={13} />
                <span className="font-medium">Clear {vetoedCount} veto{vetoedCount !== 1 ? 'es' : ''}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Day picker */}
      <div className="max-w-6xl mx-auto w-full px-4 md:px-6 mb-8">
        <DayPicker selectedDate={selectedDate} onDateChange={setSelectedDate} />
      </div>

      {/* Veto legend */}
      <div className="max-w-6xl mx-auto w-full px-4 md:px-6 mb-6">
        <div
          className="flex items-center gap-4 text-xs font-mono py-3 px-4 rounded-lg"
          style={{
            background: 'hsl(24 14% 10%)',
            border: '1px solid hsl(30 15% 16%)',
            color: 'hsl(34 20% 45%)',
          }}
        >
          <div className="flex items-center gap-1.5">
            <Ban size={12} style={{ color: 'hsl(0 65% 55%)' }} />
            <span>Hover a card to veto it — vetoed films are excluded from roulette</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto w-full px-4 md:px-6 pb-20 flex-1">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg overflow-hidden"
                style={{
                  background: 'hsl(24 14% 10%)',
                  border: '1px solid hsl(30 15% 14%)',
                  animationDelay: `${i * 50}ms`,
                }}
              >
                <div
                  className="aspect-[2/3] animate-amber-pulse"
                  style={{ background: 'hsl(24 14% 12%)' }}
                />
                <div className="p-3 space-y-2">
                  <div
                    className="h-3 rounded animate-amber-pulse"
                    style={{ background: 'hsl(24 14% 14%)', width: '80%' }}
                  />
                  <div
                    className="h-2 rounded animate-amber-pulse"
                    style={{ background: 'hsl(24 14% 12%)', width: '50%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div
            className="flex flex-col items-center justify-center py-24 rounded-xl text-center"
            style={{
              background: 'hsl(0 30% 8%)',
              border: '1px solid hsl(0 30% 14%)',
            }}
          >
            <AlertCircle size={40} className="mb-4" style={{ color: 'hsl(0 60% 45%)' }} />
            <p className="font-serif text-xl mb-2" style={{ color: 'hsl(0 50% 60%)' }}>
              The reel has snapped.
            </p>
            <p className="text-sm" style={{ color: 'hsl(0 30% 40%)' }}>
              Failed to load showtimes. Try again later.
            </p>
          </div>
        ) : sortedMovies.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-24 rounded-xl text-center"
            style={{
              background: 'hsl(24 14% 9%)',
              border: '1px solid hsl(30 15% 14%)',
            }}
          >
            <Film size={40} className="mb-4" style={{ color: 'hsl(34 20% 30%)' }} />
            <p className="font-serif text-xl mb-2" style={{ color: 'hsl(34 20% 45%)' }}>
              Nothing on the schedule.
            </p>
            <p className="text-sm" style={{ color: 'hsl(34 20% 35%)' }}>
              Try a different day.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {sortedMovies.map((movie: CinemaMovie, index: number) => (
              <MoviePosterCard
                key={movie.id}
                movie={movie}
                isVetoed={isVetoed(movie.id)}
                onToggleVeto={toggleVeto}
                style={{ opacity: 0, animation: `reveal-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${index * 40}ms forwards` }}
                animationDelay={index * 40}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
