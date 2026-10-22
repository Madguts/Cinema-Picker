export interface Showtime {
  time: string;
  endTime?: string | null;
  bookingUrl: string;
}

export interface CinemaMovie {
  id: string;
  title: string;
  posterUrl?: string | null;
  detailUrl: string;
  durationMinutes?: number | null;
  certificate?: string | null;
  genres: string[];
  synopsis?: string | null;
  director?: string | null;
  starring?: string | null;
  additionalInfo?: Array<{ label: string; value: string }>;
  trailerUrl?: string | null;
  showtimes: Showtime[];
}

export interface ShowtimesResponse {
  date: string;
  movies: CinemaMovie[];
}
