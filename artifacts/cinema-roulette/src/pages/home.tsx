import { useState, useMemo, useCallback } from 'react';
import { format, startOfDay } from 'date-fns';
import { AlertCircle, Film, Ban } from 'lucide-react';
import { useGetShowtimes, getGetShowtimesQueryKey } from '@workspace/api-client-react';
import type { CinemaMovie } from '@workspace/api-client-react';
import { useVetoes } from '@/hooks/use-vetoes';
import { useTimeFilter } from '@/hooks/use-time-filter';
import { DayPicker } from '@/components/DayPicker';
import { TimeRangeSlider } from '@/components/TimeRangeSlider';
import { SpinButton } from '@/components/SpinButton';
import { MovieResult } from '@/components/MovieResult';
import { VetoModal } from '@/components/VetoModal';

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
  const [vetoModalOpen, setVetoModalOpen] = useState(false);

  const { vetoes, isVetoed, addVeto, toggleVeto, clearVetoes } = useVetoes();
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
    const picked = pickRandom(pickedMovie?.id);
    setTimeout(() => {
      setPickedMovie(picked);
      setIsSpinning(false);
    }, 700);
  }, [isSpinning, eligibleMovies, pickRandom, pickedMovie]);

  const handleVeto = useCallback(
    (id: string) => {
      addVeto(id);
      if (pickedMovie?.id === id) {
        const pool = eligibleMovies.filter((m) => m.id !== id);
        if (pool.length > 0) {
          setIsSpinning(true);
          setTimeout(() => {
            setPickedMovie(pool[Math.floor(Math.random() * pool.length)]);
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
  const vetoedCount = (data?.movies ?? []).filter(m => isVetoed(m.id)).length;

  return (
    <div className="min-h-[100dvh] flex flex-col" style={{ background: '#0a0a0a' }}>
      {/* Subtle radial glow */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 100%, rgba(255,234,0,0.04), transparent)',
        }}
      />

      {/* Hero */}
      <div className="relative pt-24 pb-10 px-6 text-center">
        <div
          className="inline-block mb-3 uppercase tracking-widest text-xs px-3 py-1 rounded-full font-medium"
          style={{
            background: 'rgba(255,234,0,0.08)',
            border: '1px solid rgba(255,234,0,0.15)',
            color: 'rgba(255,234,0,0.7)',
            fontSize: '10px',
          }}
        >
          Your Personal Film Decider
        </div>
        <h1
          className="text-5xl md:text-6xl font-bold leading-tight mb-3 tracking-tight"
          style={{ color: '#fff' }}
        >
          Get a random movie
        </h1>
        <p className="text-sm max-w-sm mx-auto" style={{ color: '#555' }}>
          Pick a day and time window. Let chance decide the rest.
        </p>
      </div>

      {/* Main controls */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 md:px-6 pb-20">
        {/* Day picker */}
        <div className="mb-8">
          <div className="text-xs uppercase tracking-widest mb-3 font-medium" style={{ color: '#444' }}>
            Select a day
          </div>
          <DayPicker selectedDate={selectedDate} onDateChange={setSelectedDate} />
        </div>

        {/* Time range */}
        <div
          className="mb-6 p-5 rounded-xl"
          style={{ background: '#111', border: '1px solid #1e1e1e' }}
        >
          <div className="text-xs uppercase tracking-widest mb-5 font-medium" style={{ color: '#444' }}>
            Time window
          </div>
          <TimeRangeSlider
            startTime={startTime}
            endTime={endTime}
            onStartChange={setStartTime}
            onEndChange={setEndTime}
          />
        </div>

        {/* Availability + veto row */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            {!isLoading && !error && eligibleCount > 0 && (
              <>
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: '#FFEA00', boxShadow: '0 0 6px rgba(255,234,0,0.6)' }}
                />
                <span className="text-xs font-mono" style={{ color: '#555' }}>
                  {eligibleCount} film{eligibleCount !== 1 ? 's' : ''} available
                  {totalMovies > eligibleCount && ` of ${totalMovies}`}
                </span>
              </>
            )}
            {!isLoading && !error && eligibleCount === 0 && totalMovies > 0 && (
              <>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#ff4444' }} />
                <span className="text-xs font-mono" style={{ color: '#ff4444' }}>
                  No films match this window
                </span>
              </>
            )}
          </div>

          {/* Veto movies button */}
          {!isLoading && totalMovies > 0 && (
            <button
              onClick={() => setVetoModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
              style={{
                background: vetoedCount > 0 ? 'rgba(255,234,0,0.08)' : '#111',
                border: `1px solid ${vetoedCount > 0 ? 'rgba(255,234,0,0.2)' : '#222'}`,
                color: vetoedCount > 0 ? '#FFEA00' : '#555',
              }}
            >
              <Ban size={12} />
              <span>Veto movies{vetoedCount > 0 ? ` (${vetoedCount})` : ''}</span>
            </button>
          )}
        </div>

        {/* Spin button */}
        <div className="mb-10">
          {isLoading ? (
            <div
              className="w-full rounded-lg flex items-center justify-center py-5"
              style={{ background: '#111', border: '1px solid #1e1e1e', color: '#444' }}
            >
              <span className="font-mono text-sm" style={{ animation: 'amber-pulse 1.5s ease-in-out infinite' }}>
                Loading showtimes...
              </span>
            </div>
          ) : error ? (
            <div
              className="w-full rounded-lg flex items-center justify-center gap-3 py-5"
              style={{ background: '#110000', border: '1px solid #2a0000', color: '#ff6666' }}
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
              className="text-xs uppercase tracking-widest mb-4 font-medium text-center"
              style={{ color: 'rgba(255,234,0,0.5)' }}
            >
              Your film
            </div>
            <div style={{ animation: 'reveal-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
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

        {/* Empty state */}
        {!isLoading && !error && eligibleCount === 0 && !pickedMovie && (
          <div
            className="text-center py-16 rounded-xl"
            style={{ background: '#0d0d0d', border: '1px solid #1a1a1a' }}
          >
            <Film size={40} className="mx-auto mb-4" style={{ color: '#2a2a2a' }} />
            <p className="text-lg mb-1 font-medium" style={{ color: '#444' }}>
              Nothing showing in that window.
            </p>
            <p className="text-sm" style={{ color: '#333' }}>
              Try widening your time range or choosing a different day.
            </p>
          </div>
        )}
      </div>

      {/* Veto modal */}
      <VetoModal
        isOpen={vetoModalOpen}
        onClose={() => setVetoModalOpen(false)}
        movies={data?.movies ?? []}
        isLoading={isLoading}
        isVetoed={isVetoed}
        onToggleVeto={toggleVeto}
        onClearVetoes={(ids) => clearVetoes(ids)}
      />
    </div>
  );
}
