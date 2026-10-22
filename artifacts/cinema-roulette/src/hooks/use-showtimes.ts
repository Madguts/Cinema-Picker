import { useQuery } from '@tanstack/react-query';
import type { ShowtimesResponse } from '@/lib/types';

export function useShowtimes(date: string) {
  return useQuery({
    queryKey: ['showtimes', date],
    queryFn: async ({ signal }) => {
      const response = await fetch(
        `${import.meta.env.BASE_URL}data/showtimes/${date}.json`,
        { signal },
      );

      if (!response.ok) {
        throw new Error(`Failed to load showtimes for ${date}: HTTP ${response.status}`);
      }

      return (await response.json()) as ShowtimesResponse;
    },
  });
}
