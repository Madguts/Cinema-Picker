import { useState } from 'react';
import { Ban, Check } from 'lucide-react';
import type { CinemaMovie } from '@/lib/types';
import { CertificateBadge } from './CertificateBadge';

interface MoviePosterCardProps {
  movie: CinemaMovie;
  isVetoed: boolean;
  onToggleVeto: (id: string) => void;
  style?: React.CSSProperties;
  animationDelay?: number;
}

export function MoviePosterCard({
  movie,
  isVetoed,
  onToggleVeto,
  style,
  animationDelay = 0,
}: MoviePosterCardProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className="group relative rounded-lg overflow-hidden cursor-default"
      style={{
        background: 'hsl(24 14% 10%)',
        border: isVetoed ? '1px solid hsl(0 50% 22%)' : '1px solid hsl(30 15% 16%)',
        opacity: isVetoed ? 0.55 : 1,
        transition: 'opacity 0.3s ease, border-color 0.3s ease, transform 0.2s ease',
        animationDelay: `${animationDelay}ms`,
        ...style,
      }}
      data-testid={`movie-card-${movie.id}`}
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] overflow-hidden bg-card">
        {movie.posterUrl && !imageError ? (
          <img
            src={movie.posterUrl}
            alt={movie.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImageError(true)}
            data-testid={`img-poster-${movie.id}`}
          />
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center p-4"
            style={{ background: 'linear-gradient(135deg, hsl(24 16% 12%), hsl(24 12% 8%))' }}
          >
            <div
              className="font-serif text-center leading-tight text-sm"
              style={{ color: 'hsl(38 40% 50%)' }}
            >
              {movie.title}
            </div>
          </div>
        )}

        {/* Gradient overlay */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: 'linear-gradient(to top, hsl(24 12% 5% / 0.9) 0%, transparent 60%)',
          }}
        />

        {/* Veto button */}
        <button
          onClick={() => onToggleVeto(movie.id)}
          className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
          style={{
            background: isVetoed ? 'hsl(0 50% 18%)' : 'hsl(24 14% 10% / 0.9)',
            border: `1px solid ${isVetoed ? 'hsl(0 50% 30%)' : 'hsl(30 15% 25%)'}`,
            backdropFilter: 'blur(8px)',
          }}
          title={isVetoed ? 'Remove veto' : 'Veto this movie'}
          data-testid={`veto-btn-${movie.id}`}
        >
          {isVetoed ? (
            <Check size={13} style={{ color: 'hsl(120 60% 55%)' }} />
          ) : (
            <Ban size={13} style={{ color: 'hsl(0 65% 60%)' }} />
          )}
        </button>

        {/* Certificate badge overlay */}
        {movie.certificate && (
          <div className="absolute bottom-2 left-2">
            <CertificateBadge certificate={movie.certificate} size="sm" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3
          className="font-serif text-sm font-medium leading-snug line-clamp-2 mb-1"
          style={{ color: 'hsl(38 60% 88%)' }}
          data-testid={`text-title-${movie.id}`}
        >
          {movie.title}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          {movie.durationMinutes && (
            <span
              className="font-mono text-xs"
              style={{ color: 'hsl(34 20% 45%)', fontSize: '10px' }}
            >
              {movie.durationMinutes}m
            </span>
          )}
          {!movie.certificate && !movie.durationMinutes && (
            <span
              className="font-mono text-xs"
              style={{ color: 'hsl(34 20% 35%)', fontSize: '10px' }}
            >
              {movie.showtimes.length} show{movie.showtimes.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="text-xs mt-1" style={{ color: 'hsl(34 20% 40%)', fontSize: '10px' }}>
          <span className="opacity-60">
            {movie.showtimes.length} showing{movie.showtimes.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Vetoed overlay label */}
      {isVetoed && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: 'hsl(0 30% 5% / 0.4)', backdropFilter: 'blur(1px)' }}
        >
          <div
            className="font-serif italic text-xs uppercase tracking-widest px-3 py-1 rounded"
            style={{
              background: 'hsl(0 40% 12%)',
              color: 'hsl(0 60% 55%)',
              border: '1px solid hsl(0 40% 22%)',
            }}
          >
            Vetoed
          </div>
        </div>
      )}
    </div>
  );
}
