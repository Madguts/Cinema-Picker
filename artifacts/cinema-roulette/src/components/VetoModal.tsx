import { useMemo } from 'react';
import { Ban, Check, X, Film, Clock } from 'lucide-react';
import type { CinemaMovie } from '@/lib/types';
import { useTimeFilter } from '@/hooks/use-time-filter';
import { CertificateBadge } from './CertificateBadge';

interface VetoModalProps {
  isOpen: boolean;
  onClose: () => void;
  movies: CinemaMovie[];
  isLoading: boolean;
  startTime: string;
  endTime: string;
  isVetoed: (id: string) => boolean;
  onToggleVeto: (id: string) => void;
  onClearVetoes: (ids: string[]) => void;
}

function sortTitle(title: string): string {
  return title.replace(/^(The |A |An )/i, '').trim().toLowerCase();
}

export function VetoModal({
  isOpen,
  onClose,
  movies,
  isLoading,
  startTime,
  endTime,
  isVetoed,
  onToggleVeto,
  onClearVetoes,
}: VetoModalProps) {
  const sortedMovies = useMemo(
    () => [...movies].sort((a, b) => sortTitle(a.title).localeCompare(sortTitle(b.title))),
    [movies]
  );
  const { isShowtimeInWindow } = useTimeFilter();

  const availableMovies = useMemo(
    () =>
      sortedMovies.filter((movie) =>
        movie.showtimes.some(
          (showtime) =>
            Boolean(showtime?.time) &&
            isShowtimeInWindow(showtime, startTime, endTime)
        )
      ),
    [sortedMovies, isShowtimeInWindow, startTime, endTime]
  );

  const unavailableMovies = useMemo(
    () => sortedMovies.filter((movie) => !availableMovies.includes(movie)),
    [sortedMovies, availableMovies]
  );

  const vetoedIds = useMemo(
    () => sortedMovies.filter(m => isVetoed(m.id)).map(m => m.id),
    [sortedMovies, isVetoed]
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Modal panel */}
      <div
        className="fixed inset-x-4 top-16 bottom-8 z-50 flex flex-col rounded-xl overflow-hidden md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg"
        style={{
          background: '#111',
          border: '1px solid #222',
          boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid #222' }}
        >
          <div className="flex items-center gap-3">
            <Ban size={16} style={{ color: '#FFEA00' }} />
            <h2 className="font-semibold text-base" style={{ color: '#fff' }}>
              Veto Movies
            </h2>
            {vetoedIds.length > 0 && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: '#1a1a1a', color: '#999', border: '1px solid #333' }}
              >
                {vetoedIds.length} vetoed
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {vetoedIds.length > 0 && (
              <button
                onClick={() => onClearVetoes(vetoedIds)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
                style={{
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  color: '#aaa',
                }}
              >
                <Check size={12} />
                Clear all
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-opacity hover:opacity-80"
              style={{ background: '#1a1a1a', border: '1px solid #222', color: '#888' }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div
          className="px-5 py-2.5 text-xs flex-shrink-0"
          style={{ background: '#0d0d0d', color: '#555', borderBottom: '1px solid #1a1a1a' }}
        >
          Vetoed films are excluded from the random selection.
        </div>

        {/* Movie list */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-16" style={{ color: '#444' }}>
              <span className="text-sm">Loading films...</span>
            </div>
          ) : sortedMovies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3" style={{ color: '#444' }}>
              <Film size={32} />
              <span className="text-sm">No films found for this day.</span>
            </div>
          ) : (
            <div className="py-2">
              {availableMovies.length > 0 && (
                <div className="px-5 pt-2 pb-1 text-xs uppercase tracking-widest font-medium" style={{ color: '#777' }}>
                  Showing in this window
                </div>
              )}
              {availableMovies.map((movie) => {
                const vetoed = isVetoed(movie.id);
                return (
                  <button
                    key={movie.id}
                    onClick={() => onToggleVeto(movie.id)}
                    className="w-full flex items-center gap-4 px-5 py-3 text-left transition-all"
                    style={{
                      background: vetoed ? 'rgba(255,234,0,0.03)' : 'transparent',
                      borderBottom: '1px solid #1a1a1a',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = vetoed
                        ? 'rgba(255,234,0,0.06)'
                        : '#161616';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = vetoed
                        ? 'rgba(255,234,0,0.03)'
                        : 'transparent';
                    }}
                  >
                    {/* Poster thumbnail */}
                    <div
                      className="w-10 h-14 rounded flex-shrink-0 overflow-hidden"
                      style={{ background: '#1a1a1a' }}
                    >
                      {movie.posterUrl ? (
                        <img
                          src={movie.posterUrl}
                          alt={movie.title}
                          className="w-full h-full object-cover"
                          style={{ opacity: vetoed ? 0.3 : 0.9 }}
                          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Film size={14} style={{ color: '#333' }} />
                        </div>
                      )}
                    </div>

                    {/* Movie info */}
                    <div className="flex-1 min-w-0">
                      <div
                        className="font-medium text-sm leading-snug truncate"
                        style={{ color: vetoed ? '#555' : '#e0e0e0' }}
                      >
                        {movie.title}
                      </div>
                      {movie.durationMinutes && (
                        <div className="flex items-center gap-1 text-xs mt-0.5" style={{ color: '#888' }}>
                          <Clock size={12} />
                          <span>
                            {Math.floor(movie.durationMinutes / 60)}h {movie.durationMinutes % 60}m
                          </span>
                        </div>
                      )}
                    </div>

                    {movie.certificate && (
                      <CertificateBadge certificate={movie.certificate} size="lg" />
                    )}

                    {/* Veto toggle indicator */}
                    <div
                      className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                      style={{
                        background: vetoed ? 'rgba(255,234,0,0.1)' : '#1a1a1a',
                        border: `1px solid ${vetoed ? 'rgba(255,234,0,0.3)' : '#333'}`,
                        color: vetoed ? '#FFEA00' : '#555',
                      }}
                    >
                      {vetoed ? <Ban size={14} /> : <Ban size={14} style={{ opacity: 0.4 }} />}
                    </div>
                  </button>
                );
              })}
              {unavailableMovies.length > 0 && (
                <>
                  <div
                    className="px-5 pt-5 pb-1 text-xs uppercase tracking-widest font-medium"
                    style={{ color: '#555', borderTop: availableMovies.length > 0 ? '1px solid #222' : undefined }}
                  >
                    Outside this window
                  </div>
                  {unavailableMovies.map((movie) => {
                    const vetoed = isVetoed(movie.id);
                    return (
                      <button
                        key={movie.id}
                        onClick={() => onToggleVeto(movie.id)}
                        className="w-full flex items-center gap-4 px-5 py-3 text-left transition-all"
                        style={{
                          background: vetoed ? 'rgba(255,234,0,0.02)' : 'transparent',
                          borderBottom: '1px solid #171717',
                          opacity: 0.58,
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLElement).style.background = vetoed
                            ? 'rgba(255,234,0,0.05)'
                            : '#141414';
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLElement).style.background = vetoed
                            ? 'rgba(255,234,0,0.02)'
                            : 'transparent';
                        }}
                      >
                        <div
                          className="w-10 h-14 rounded flex-shrink-0 overflow-hidden"
                          style={{ background: '#1a1a1a' }}
                        >
                          {movie.posterUrl ? (
                            <img
                              src={movie.posterUrl}
                              alt={movie.title}
                              className="w-full h-full object-cover"
                              style={{ opacity: vetoed ? 0.22 : 0.45, filter: 'grayscale(1)' }}
                              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Film size={14} style={{ color: '#333' }} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div
                            className="font-medium text-sm leading-snug truncate"
                            style={{ color: vetoed ? '#555' : '#888' }}
                          >
                            {movie.title}
                          </div>
                          {movie.durationMinutes && (
                            <div className="flex items-center gap-1 text-xs mt-0.5" style={{ color: '#777' }}>
                              <Clock size={12} />
                              <span>
                                {Math.floor(movie.durationMinutes / 60)}h {movie.durationMinutes % 60}m
                              </span>
                            </div>
                          )}
                        </div>
                        {movie.certificate && (
                          <CertificateBadge certificate={movie.certificate} size="lg" />
                        )}
                        <div
                          className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                          style={{
                            background: vetoed ? 'rgba(255,234,0,0.07)' : '#181818',
                            border: `1px solid ${vetoed ? 'rgba(255,234,0,0.22)' : '#2a2a2a'}`,
                            color: vetoed ? '#FFEA00' : '#666',
                          }}
                        >
                          <Ban size={14} style={{ opacity: vetoed ? 1 : 0.65 }} />
                        </div>
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
