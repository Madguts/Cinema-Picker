import { useState, useMemo, useCallback } from 'react';
import { format, startOfDay } from 'date-fns';
import { AlertCircle, Film } from 'lucide-react';
import { useGetShowtimes, getGetShowtimesQueryKey } from '@workspace/api-client-react';
import type { CinemaMovie } from '@workspace/api-client-react';
import { useVetoes } from '@/hooks/use-vetoes';
import { useTimeFilter } from '@/hooks/use-time-filter';
import { DayPicker } from '@/components/DayPicker';
import { TimeRangeSlider } from '@/components/TimeRangeSlider';
import { SpinButton } from '@/components/SpinButton';
import { MovieResult } from '@/components/MovieResult';

function getDefaultDate(): string {
  return format(startOfDay(new Date()), 'yyyy-MM-dd');
}

export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState(getDefaultDate);
  const [startTime, setStartTime] = useState('12:00');
  const [endTime, setEndTime] = useState('22:30');
  const [pickedMovie, setPickedMovie] = useState<CinemaMovie | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinCount, setSpinCount] = useState(0);

  const { vetoes, isVetoed, addVeto } = useVetoes();
  const { isShowtimeInWindow } = useTimeFilter();

  const { data, isLoading, error } = useGetShowtimes(
    { date: selectedDate },
    {
      query: {
        queryKey: getGetShowtimesQueryKey({ date: selectedDate }),
      },
    }
  );

  const eligibleMovies = useMemo(() => {
    if (!data?.movies) return [];
    return data.movies.filter((movie) => {
      if (isVetoed(movie.id)) return false;
      return movie.showtimes.some((st) => isShowtimeInWindow(st, startTime, endTime));
    });
  }, [data?.movies, vetoes, startTime, endTime, isVetoed, isShowtimeInWindow]);

  const pickRandom = useCallback(
    (exclude?: string) => {
      const pool = exclude
        ? eligibleMovies.filter((m) => m.id !== exclude)
        : eligibleMovies;
      if (pool.length === 0) return null;
      return pool[Math.floor(Math.random() * pool.length)];
    },
    [eligibleMovies]
  );

  const handleSpin = useCallback(() => {
    if (isSpinning || eligibleMovies.length === 0) return;

    setIsSpinning(true);
    setSpinCount((c) => c + 1);

    // Theatrical shuffle: cycle through a few movies then land
    const spinDuration = 700;
    const picked = pickRandom(pickedMovie?.id);

    setTimeout(() => {
      setPickedMovie(picked);
      setIsSpinning(false);
    }, spinDuration);
  }, [isSpinning, eligibleMovies, pickRandom, pickedMovie]);

  const handleVeto = useCallback(
    (id: string) => {
      addVeto(id);
      if (pickedMovie?.id === id) {
        // Re-roll immediately
        const pool = eligibleMovies.filter((m) => m.id !== id);
        if (pool.length > 0) {
          setIsSpinning(true);
          setTimeout(() => {
            const next = pool[Math.floor(Math.random() * pool.length)];
            setPickedMovie(next);
            setIsSpinning(false);
          }, 500);
        } else {
          setPickedMovie(null);
        }
      }
    },
    [addVeto, pickedMovie, eligibleMovies]
  );

  const totalMovies = data?.movies?.length ?? 0;
  const eligibleCount = eligibleMovies.length;

  return (
    <div
      className="min-h-[100dvh] flex flex-col"
      style={{ background: 'hsl(24 12% 7%)' }}
    >
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 50% at 50% 100%, hsl(38 60% 20% / 0.12), transparent)',
        }}
      />

      {/* Hero header */}
      <div
        className="relative pt-24 pb-12 px-6 text-center"
        style={{
          background: 'linear-gradient(to bottom, hsl(24 12% 6%), hsl(24 12% 7%))',
        }}
      >
        {/* Decorative film strip lines */}
        <div
          aria-hidden="true"
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, hsl(38 85% 55% / 0.3), transparent)' }}
        />

        <div
          className="inline-block mb-3 font-mono uppercase tracking-widest text-xs px-3 py-1 rounded-full"
          style={{
            background: 'hsl(38 85% 55% / 0.1)',
            border: '1px solid hsl(38 85% 55% / 0.2)',
            color: 'hsl(38 70% 55%)',
            fontSize: '10px',
          }}
        >
          Your Personal Film Oracle
        </div>
        <h1
          className="font-serif text-5xl md:text-6xl font-bold leading-tight mb-3"
          style={{ color: 'hsl(38 60% 92%)' }}
        >
          What shall we
          <br />
          <span
            className="italic"
            style={{
              background: 'linear-gradient(135deg, hsl(38 85% 65%), hsl(32 70% 52%))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            watch tonight?
          </span>
        </h1>
        <p
          className="text-sm max-w-sm mx-auto"
          style={{ color: 'hsl(34 20% 48%)' }}
        >
          Pick a day and time window. Let fate decide the rest.
        </p>
      </div>

      {/* Main controls */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 md:px-6 pb-20">
        {/* Day picker */}
        <div className="mb-8">
          <div
            className="text-xs uppercase tracking-widest mb-3 font-medium"
            style={{ color: 'hsl(34 20% 40%)' }}
          >
            Select a day
          </div>
          <DayPicker selectedDate={selectedDate} onDateChange={setSelectedDate} />
        </div>

        {/* Time range */}
        <div
          className="mb-8 p-5 rounded-xl"
          style={{
            background: 'hsl(24 14% 10%)',
            border: '1px solid hsl(30 15% 16%)',
          }}
        >
          <div
            className="text-xs uppercase tracking-widest mb-5 font-medium"
            style={{ color: 'hsl(34 20% 40%)' }}
          >
            Time window
          </div>
          <TimeRangeSlider
            startTime={startTime}
            endTime={endTime}
            onStartChange={setStartTime}
            onEndChange={setEndTime}
          />
        </div>

        {/* Availability indicator */}
        {!isLoading && !error && (
          <div className="flex items-center gap-2 mb-5">
            {eligibleCount > 0 ? (
              <>
                <div
                  className="w-1.5 h-1.5 rounded-full animate-amber-pulse"
                  style={{ background: 'hsl(38 85% 55%)' }}
                />
                <span
                  className="text-xs font-mono"
                  style={{ color: 'hsl(34 20% 48%)' }}
                >
                  {eligibleCount} film{eligibleCount !== 1 ? 's' : ''} available
                  {totalMovies > eligibleCount && ` of ${totalMovies} showing`}
                </span>
              </>
            ) : totalMovies > 0 ? (
              <>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'hsl(0 60% 50%)' }} />
                <span className="text-xs font-mono" style={{ color: 'hsl(0 50% 50%)' }}>
                  No films match this time window
                </span>
              </>
            ) : null}
          </div>
        )}

        {/* Spin button */}
        <div className="mb-10">
          {isLoading ? (
            <div
              className="w-full rounded-lg flex items-center justify-center py-5"
              style={{
                background: 'hsl(24 14% 10%)',
                border: '1px solid hsl(30 15% 16%)',
                color: 'hsl(34 20% 40%)',
              }}
            >
              <span className="font-mono text-sm animate-amber-pulse">Loading showtimes...</span>
            </div>
          ) : error ? (
            <div
              className="w-full rounded-lg flex items-center justify-center gap-3 py-5"
              style={{
                background: 'hsl(0 30% 10%)',
                border: '1px solid hsl(0 30% 18%)',
                color: 'hsl(0 60% 55%)',
              }}
            >
              <AlertCircle size={16} />
              <span className="text-sm">Failed to load showtimes. Try another day.</span>
            </div>
          ) : (
            <SpinButton
              onClick={handleSpin}
              isSpinning={isSpinning}
              disabled={eligibleCount === 0}
              hasResult={pickedMovie !== null}
            />
          )}
        </div>

        {/* Result */}
        {pickedMovie && !isLoading && (
          <div key={`${pickedMovie.id}-${spinCount}`}>
            <div
              className="text-xs uppercase tracking-widest mb-4 font-medium text-center animate-reveal-fade"
              style={{ color: 'hsl(38 60% 45%)' }}
            >
              Tonight's feature presentation
            </div>
            <div className="animate-reveal-up">
              <MovieResult
                movie={pickedMovie}
                onVeto={handleVeto}
                isSpinning={isSpinning}
                startTime={startTime}
                endTime={endTime}
              />
            </div>
          </div>
        )}

        {/* Empty state — no films, no result */}
        {!isLoading && !error && eligibleCount === 0 && !pickedMovie && (
          <div
            className="text-center py-16 rounded-xl animate-reveal-fade"
            style={{
              background: 'hsl(24 14% 9%)',
              border: '1px solid hsl(30 15% 14%)',
            }}
          >
            <Film size={40} className="mx-auto mb-4" style={{ color: 'hsl(34 20% 30%)' }} />
            <p className="font-serif text-lg mb-1" style={{ color: 'hsl(34 20% 45%)' }}>
              The schedule is dark.
            </p>
            <p className="text-sm" style={{ color: 'hsl(34 20% 35%)' }}>
              Try widening your time window or choosing a different day.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
