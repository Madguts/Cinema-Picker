import { useState, useEffect, useRef } from 'react';
import { Ban, ExternalLink, Clock, Film, Play, Tag } from 'lucide-react';
import type { CinemaMovie } from '@workspace/api-client-react';
import { useGetMovieDetails, getGetMovieDetailsQueryKey } from '@workspace/api-client-react';
import { CertificateBadge } from './CertificateBadge';
import { timeToMinutes } from '@/hooks/use-time-filter';

interface ShowtimeButtonProps {
  time: string;
  endTime?: string | null;
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
        background: inWindow ? 'rgba(255,234,0,0.12)' : '#111',
        border: `1px solid ${inWindow ? 'rgba(255,234,0,0.35)' : '#222'}`,
        textDecoration: 'none',
      }}
    >
      <span
        className="font-mono text-sm font-medium"
        style={{ color: inWindow ? '#FFEA00' : '#666' }}
      >
        {time}
      </span>
      {endTime && (
        <span className="font-mono mt-0.5" style={{ color: '#777', fontSize: '10px' }}>
          ends {endTime}
        </span>
      )}
    </a>
  );
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
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
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);
  const [synopsisCanExpand, setSynopsisCanExpand] = useState(false);
  const synopsisRef = useRef<HTMLParagraphElement>(null);
  const { certificate, durationMinutes, synopsis, trailerUrl, genres } = movie;

  // Only fetch movie-details for the poster; everything else comes from the listing
  const { data: details, isLoading: detailsLoading } = useGetMovieDetails(
    { url: movie.detailUrl },
    {
      query: {
        // Only fetch detail page if the listing didn't already give us a poster
        enabled: !!movie.detailUrl && !movie.posterUrl,
        queryKey: getGetMovieDetailsQueryKey({ url: movie.detailUrl }),
      },
    }
  );

  useEffect(() => {
    setVisible(false);
    setImageError(false);
    setSynopsisExpanded(false);
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, [movie.id]);

  useEffect(() => {
    const element = synopsisRef.current;
    if (!element) {
      setSynopsisCanExpand(false);
      return;
    }

    const measureOverflow = () => {
      if (!synopsisExpanded) {
        setSynopsisCanExpand(element.scrollHeight > element.clientHeight + 1);
      }
    };

    measureOverflow();
    const observer = new ResizeObserver(measureOverflow);
    observer.observe(element);
    return () => observer.disconnect();
  }, [synopsis, synopsisExpanded]);

  // Poster: listing-page poster is more reliable; only use detail-page result
  // if we genuinely have nothing from the listing scrape.
  const posterUrl = movie.posterUrl || details?.posterUrl;

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
      className={`transition-all duration-700 ${isSpinning ? 'opacity-0 scale-95' : ''}`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Main result card */}
      <div
        className="relative rounded-xl overflow-hidden"
        style={{
          background: '#111',
          border: '1px solid #1e1e1e',
          boxShadow: '0 32px 64px rgba(0,0,0,0.8), 0 0 60px rgba(255,234,0,0.04)',
        }}
      >
        {/* Omniplex yellow accent bar */}
        <div className="h-0.5 w-full" style={{ background: '#FFEA00' }} />

        <div className="flex flex-col md:flex-row gap-0">
          {/* Poster column */}
          <div className="relative md:w-56 lg:w-64 flex-shrink-0">
            <div className="aspect-[2/3] md:aspect-auto md:h-full overflow-hidden" style={{ minHeight: '300px' }}>
              {posterUrl && !imageError ? (
                <img
                  src={posterUrl}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                  style={{ filter: 'brightness(0.95) contrast(1.05)', display: 'block' }}
                  data-testid="img-result-poster"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center p-8"
                  style={{ background: '#0d0d0d', minHeight: '300px' }}
                >
                  {detailsLoading ? (
                    <div style={{ color: '#333' }}>
                      <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin mx-auto" style={{ borderColor: '#333', borderTopColor: 'transparent' }} />
                    </div>
                  ) : (
                    <Film size={48} style={{ color: '#2a2a2a' }} />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Info column */}
          <div className="flex-1 p-6 lg:p-8 flex flex-col gap-5">
            {/* Title + veto */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-3">
                <h2
                  className="font-bold text-3xl lg:text-4xl leading-tight"
                  style={{ color: '#fff' }}
                  data-testid="text-result-title"
                >
                  {movie.title}
                </h2>
                <button
                  onClick={() => onVeto(movie.id)}
                  className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 hover:opacity-80"
                  style={{
                    background: 'rgba(255,60,60,0.08)',
                    border: '1px solid rgba(255,60,60,0.2)',
                    color: '#ff6666',
                    fontSize: '13px',
                  }}
                  data-testid="button-veto-result"
                >
                  <Ban size={14} />
                  <span className="font-medium">Veto</span>
                </button>
              </div>

              {/* Meta row: certificate, duration */}
              <div className="flex items-center gap-3 flex-wrap">
                {certificate && <CertificateBadge certificate={certificate} size="md" />}
                {durationMinutes != null && (
                  <div className="flex items-center gap-1.5" style={{ color: '#888' }}>
                    <Clock size={13} />
                    <span className="font-mono text-sm">{formatDuration(durationMinutes)}</span>
                  </div>
                )}
              </div>

              {/* Genres */}
              {genres && genres.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap mt-2">
                  <Tag size={11} style={{ color: '#444' }} />
                  {genres.map((g) => (
                    <span
                      key={g}
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: '#1a1a1a',
                        border: '1px solid #272727',
                        color: '#666',
                      }}
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Synopsis */}
            {synopsis && (
              <div>
                <p
                  ref={synopsisRef}
                  id="movie-synopsis"
                  className={`text-sm leading-relaxed ${synopsisExpanded ? '' : 'line-clamp-4'}`}
                  style={{ color: '#999' }}
                  data-testid="text-synopsis"
                >
                  {synopsis}
                </p>
                {synopsisCanExpand && (
                  <button
                    type="button"
                    aria-expanded={synopsisExpanded}
                    aria-controls="movie-synopsis"
                    onClick={() => setSynopsisExpanded((expanded) => !expanded)}
                    className="mt-2 text-sm font-medium hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                    style={{ color: '#FFEA00' }}
                  >
                    {synopsisExpanded ? 'Show less' : 'Read more'}
                  </button>
                )}
              </div>
            )}

            {/* Trailer */}
            {youtubeId && (
              <a
                href={trailerUrl!}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 self-start px-4 py-2 rounded-lg transition-all duration-200 hover:opacity-80"
                style={{
                  background: 'rgba(255,0,0,0.08)',
                  border: '1px solid rgba(255,0,0,0.2)',
                  color: '#ff6666',
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
                style={{ color: '#666' }}
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
              className="inline-flex items-center gap-1.5 self-start hover:opacity-80 transition-opacity"
              style={{ color: '#666', textDecoration: 'none', fontSize: '12px' }}
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
