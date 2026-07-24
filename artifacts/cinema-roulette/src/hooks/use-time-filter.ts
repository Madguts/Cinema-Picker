import { useCallback } from 'react';
import type { Showtime } from '@workspace/api-client-react';

// Convert "HH:MM" to minutes since midnight
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

// Convert minutes since midnight to "HH:MM"
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function useTimeFilter() {
  const isShowtimeInWindow = useCallback(
    (showtime: Showtime, startTime: string, endTime: string): boolean => {
      const start = timeToMinutes(startTime);
      const end = timeToMinutes(endTime);
      const showtimeStart = timeToMinutes(showtime.time);

      if (showtimeStart < start) return false;

      if (showtime.endTime) {
        const showtimeEnd = timeToMinutes(showtime.endTime);
        return showtimeEnd <= end;
      }

      // Fallback: showtime must start at least 90 min before window end
      return showtimeStart <= end - 90;
    },
    []
  );

  return { isShowtimeInWindow };
}
