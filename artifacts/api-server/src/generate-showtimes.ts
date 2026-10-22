import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { logger } from './lib/logger';
import { scrapeMovieDetails, scrapeShowtimes } from './lib/omniplex-scraper';

const DAYS_TO_GENERATE = 11;
const outputDirectory = resolve(
  import.meta.dirname,
  '../../cinema-roulette/public/data/showtimes',
);

function getLisburnDate(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((item) => item.type === type)?.value;
  const year = part('year');
  const month = part('month');
  const day = part('day');

  if (!year || !month || !day) {
    throw new Error('Could not determine the current date in Europe/London');
  }

  return `${year}-${month}-${day}`;
}

function addDays(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days))
    .toISOString()
    .slice(0, 10);
}

await mkdir(outputDirectory, { recursive: true });

const firstDate = getLisburnDate();
for (let offset = 0; offset < DAYS_TO_GENERATE; offset += 1) {
  const date = addDays(firstDate, offset);
  const movies = await scrapeShowtimes(date);
  for (const movie of movies) {
    if (movie.posterUrl) continue;

    try {
      movie.posterUrl = (await scrapeMovieDetails(movie.detailUrl)).posterUrl;
    } catch (err) {
      logger.warn({ err, url: movie.detailUrl }, 'Failed to fetch fallback poster');
    }
  }

  const payload = JSON.stringify({ date, movies }, null, 2);
  await writeFile(resolve(outputDirectory, `${date}.json`), `${payload}\n`);
  console.info(`Saved ${movies.length} movies for ${date}`);
}
