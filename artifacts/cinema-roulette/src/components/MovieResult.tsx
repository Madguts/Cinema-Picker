import { useState, useEffect } from 'react';
import { Ban, ExternalLink, Clock, Film, Play } from 'lucide-react';
import type { CinemaMovie, MovieDetails } from '@workspace/api-client-react';
import { useGetMovieDetails, getGetMovieDetailsQueryKey } from '@workspace/api-client-react';
import { CertificateBadge } from './CertificateBadge';
import { timeToMinutes } from '@/hooks/use-time-filter';

interface ShowtimeButtonProps {
  time: string;
  endTime?: string;
  bookingUrl: string;
  inWindow: boolean;
}

function ShowtimeButton({ time, endTime, bookingUrl, inWindow }: ShowtimeButtonProps) {
  return (
    <a
      href={bookingUrl}
      target="_blank"
      rel="noopener noreferrer"
      data-testid={`booking-link-${time}`}
      className="flex flex-col items-center px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105"
      style={{
        background: inWindow
          ? 'linear-gradient(135deg, hsl(38 85% 55% / 0.2), hsl(32 70% 42% / 0.1))'
          : 'hsl(24 14% 10%)',
        border: `1px solid ${inWindow ? 'hsl(38 85% 55% / 0.4)' : 'hsl(30 15% 18%)'}`,
        textDecoration: 'none',
      }}
    >
      <span
        className="font-mono text-sm font-medium"
        style={{ color: inWindow ? 'hsl(38 85% 65%)' : 'hsl(34 20% 50%)' }}
      >
        {time}
      </span>
      {endTime && (
        <span className="font-mono text-xs mt-0.5" style={{ color: 'hsl(34 20% 40%)', fontSize: '10px' }}>
          ends {endTime}
        </span>
      )}
    </a>
  );
}

interface MovieResultProps {
  movie: CinemaMovie;
  onVeto: (id: string) => void;
  isSpinning: boolean;
  startTime: string;
  endTime: string;
}

export function MovieResult({ movie, onVeto, isSpinning, startTime, endTime }: MovieResultProps) {
  const [imageError, setImageError] = useState(false);
  const [visible, setVisible] = useState(false);

  const { data: details, isLoading: detailsLoading } = useGetMovieDetails(
    { url: movie.detailUrl },
    {
      query: {
        enabled: !!movie.detailUrl,
        queryKey: getGetMovieDetailsQueryKey({ url: movie.detailUrl }),
      },
    }
  );

  useEffect(() => {
    setVisible(false);
    setImageError(false);
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, [movie.id]);

  const posterUrl = details?.posterUrl || movie.posterUrl;
  const certificate = details?.certificate || movie.certificate;
  const durationMinutes = details?.durationMinutes || movie.durationMinutes;
  const synopsis = details?.synopsis;
  const trailerUrl = details?.trailerUrl;

  function getYouTubeId(url: string | null | undefined): string | null {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  }

  const youtubeId = getYouTubeId(trailerUrl);

  const isShowtimeInWindow = (time: string) => {
    const start = timeToMinutes(startTime);
    const end = timeToMinutes(endTime);
    return timeToMinutes(time) >= start && timeToMinutes(time) <= end;
  };

  return (
    <div
      className={`transition-all duration-700 ${isSpinning ? 'animate-card-shuffle' : ''}`}
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}
    >
      {/* Main result card */}
      <div
        className="relative rounded-xl overflow-hidden"
        style={{
          background: 'hsl(24 14% 10%)',
          border: '1px solid hsl(30 15% 18%)',
          boxShadow: '0 32px 64px hsl(24 12% 4% / 0.8), 0 0 60px hsl(38 85% 55% / 0.06)',
        }}
      >
        {/* Cinematic top band */}
        <div
          className="h-1 w-full"
          style={{ background: 'linear-gradient(90deg, hsl(38 85% 55%), hsl(32 70% 42%), hsl(24 50% 30%))' }}
        />

        <div className="flex flex-col md:flex-row gap-0">
          {/* Poster column */}
          <div className="relative md:w-56 lg:w-64 flex-shrink-0">
            <div
              className="aspect-[2/3] md:aspect-auto md:h-full overflow-hidden"
              style={{ minHeight: '300px' }}
            >
              {posterUrl && !imageError ? (
                <img
                  src={posterUrl}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                  style={{
                    filter: 'brightness(0.95) contrast(1.05)',
                    display: 'block',
                  }}
                  data-testid="img-result-poster"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center p-8"
                  style={{
                    background: 'linear-gradient(135deg, hsl(24 16% 12%), hsl(24 12% 8%))',
                    minHeight: '300px',
                  }}
                >
                  <Film size={48} style={{ color: 'hsl(38 40% 30%)' }} />
                </div>
              )}
            </div>

            {/* Poster glow */}
            <div
              className="absolute inset-0 pointer-events-none animate-poster-glow"
              style={{
                boxShadow: 'inset 0 0 40px hsl(38 85% 55% / 0.05)',
              }}
            />
          </div>

          {/* Info column */}
          <div className="flex-1 p-6 lg:p-8 flex flex-col gap-5">
            {/* Title area */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex-1 min-w-0">
                  <h2
                    className="font-serif text-3xl lg:text-4xl font-bold leading-tight"
                    style={{ color: 'hsl(38 60% 92%)' }}
                    data-testid="text-result-title"
                  >
                    {movie.title}
                  </h2>
                </div>
                <button
                  onClick={() => onVeto(movie.id)}
                  className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105"
                  style={{
                    background: 'hsl(0 40% 12%)',
                    border: '1px solid hsl(0 40% 20%)',
                    color: 'hsl(0 65% 58%)',
                    fontSize: '13px',
                  }}
                  data-testid="button-veto-result"
                >
                  <Ban size={14} />
                  <span className="font-medium">Veto</span>
                </button>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-3 flex-wrap">
                {certificate && <CertificateBadge certificate={certificate} size="md" />}
                {durationMinutes && (
                  <div className="flex items-center gap-1.5" style={{ color: 'hsl(34 20% 50%)' }}>
                    <Clock size={13} />
                    <span className="font-mono text-sm">{durationMinutes}m</span>
                  </div>
                )}
                {detailsLoading && (
                  <div
                    className="text-xs font-mono animate-amber-pulse"
                    style={{ color: 'hsl(38 50% 40%)' }}
                  >
                    Loading details...
                  </div>
                )}
              </div>
            </div>

            {/* Synopsis */}
            {synopsis && (
              <p
                className="text-sm leading-relaxed line-clamp-4"
                style={{ color: 'hsl(34 20% 58%)' }}
                data-testid="text-synopsis"
              >
                {synopsis}
              </p>
            )}

            {/* Trailer */}
            {youtubeId && (
              <a
                href={trailerUrl!}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 self-start px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105"
                style={{
                  background: 'hsl(0 80% 18%)',
                  border: '1px solid hsl(0 70% 28%)',
                  color: 'hsl(0 80% 65%)',
                  textDecoration: 'none',
                  fontSize: '13px',
                }}
                data-testid="link-trailer"
              >
                <Play size={14} />
                <span className="font-medium">Watch Trailer</span>
                <ExternalLink size={12} style={{ opacity: 0.7 }} />
              </a>
            )}

            {/* Showtimes */}
            <div>
              <div
                className="text-xs uppercase tracking-widest mb-3 font-medium"
                style={{ color: 'hsl(34 20% 40%)' }}
              >
                Showtimes — Omniplex Lisburn
              </div>
              <div className="flex flex-wrap gap-2" data-testid="showtime-list">
                {movie.showtimes.map((showtime) => (
                  <ShowtimeButton
                    key={showtime.time}
                    time={showtime.time}
                    endTime={showtime.endTime}
                    bookingUrl={showtime.bookingUrl}
                    inWindow={isShowtimeInWindow(showtime.time)}
                  />
                ))}
              </div>
            </div>

            {/* Omniplex detail link */}
            <a
              href={movie.detailUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 self-start"
              style={{ color: 'hsl(34 20% 42%)', textDecoration: 'none', fontSize: '12px' }}
              data-testid="link-omniplex"
            >
              <ExternalLink size={11} />
              <span>View on Omniplex</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
