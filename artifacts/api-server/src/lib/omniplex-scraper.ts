import * as cheerio from "cheerio";
import { logger } from "./logger";

const BASE_URL = "https://www.omniplexcinemas.co.uk";
const CINEMA_SLUG = "lisburn";

export interface ScrapedShowtime {
  time: string;
  endTime?: string;
  bookingUrl: string;
}

export interface ScrapedMovie {
  id: string;
  title: string;
  posterUrl: string | null;
  detailUrl: string;
  durationMinutes: number | null;
  certificate: string | null;
  showtimes: ScrapedShowtime[];
}

export interface ScrapedMovieDetails {
  trailerUrl: string | null;
  posterUrl: string | null;
  synopsis: string | null;
  certificate: string | null;
  durationMinutes: number | null;
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function addMinutesToTime(time: string, minutes: number): string {
  const base = parseTimeToMinutes(time);
  const total = base + minutes;
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function extractYouTubeUrl(html: string): string | null {
  // Look for YouTube iframe embeds
  const iframeMatch = html.match(
    /(?:youtube\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (iframeMatch) {
    return `https://www.youtube.com/watch?v=${iframeMatch[1]}`;
  }
  // Look for data attributes
  const dataMatch = html.match(/data-(?:trailer|video)[^"]*"([^"]*youtube[^"]*)/);
  if (dataMatch) {
    return dataMatch[1];
  }
  return null;
}

async function fetchWithHeaders(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-GB,en;q=0.9",
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching ${url}`);
  }
  return response.text();
}

export async function scrapeShowtimes(date?: string): Promise<ScrapedMovie[]> {
  const url = date
    ? `${BASE_URL}/cinema/showtimes/${CINEMA_SLUG}?date=${date}`
    : `${BASE_URL}/cinema/showtimes/${CINEMA_SLUG}`;

  logger.info({ url }, "Fetching Omniplex showtimes");
  const html = await fetchWithHeaders(url);
  const $ = cheerio.load(html);

  const movies: ScrapedMovie[] = [];
  const seenIds = new Set<string>();

  // Try multiple selectors for different page layouts
  // Omniplex typically wraps each film in a card/article element
  const filmSelectors = [
    ".film-card",
    ".movie-card",
    ".film-listing",
    ".film",
    "[data-film]",
    ".schedule-item",
    ".listing-item",
    "article",
  ];

  let filmElements = $();
  for (const sel of filmSelectors) {
    const found = $(sel);
    if (found.length > 0) {
      filmElements = found;
      logger.info({ selector: sel, count: found.length }, "Found film elements");
      break;
    }
  }

  // If no specific selectors work, try to find elements by structure
  if (filmElements.length === 0) {
    // Look for elements that contain both an img and multiple time-like links
    $("section, div").each((_i, el) => {
      const $el = $(el);
      const hasTitle =
        $el.find("h2, h3, h4").length > 0 ||
        $el.find(".title, .film-title, .movie-title").length > 0;
      const hasShowtimes =
        $el.find('a[href*="booking"], a[href*="book"]').length > 0 ||
        $el.find(".showtime, .session, .time").length > 0;
      if (hasTitle && hasShowtimes) {
        filmElements = filmElements.add(el);
      }
    });
  }

  filmElements.each((_i, el) => {
    const $el = $(el);

    // Extract title
    const titleEl = $el
      .find("h2, h3, h4, .film-title, .movie-title, .title")
      .first();
    const title = titleEl.text().trim() || $el.find("[itemprop='name']").text().trim();
    if (!title) return;

    // Extract poster
    const imgEl = $el.find("img").first();
    let posterUrl: string | null =
      imgEl.attr("src") ||
      imgEl.attr("data-src") ||
      imgEl.attr("data-lazy-src") ||
      null;
    if (posterUrl && !posterUrl.startsWith("http")) {
      posterUrl = BASE_URL + posterUrl;
    }

    // Extract detail URL
    const linkEl = $el.find('a[href*="/film/"], a[href*="/movie/"], a.film-link, a.movie-link').first();
    let detailUrl =
      linkEl.attr("href") ||
      $el.find("a").first().attr("href") ||
      "";
    if (detailUrl && !detailUrl.startsWith("http")) {
      detailUrl = BASE_URL + detailUrl;
    }

    // Extract certificate
    const certEl = $el.find(".certificate, .rating, .cert, [class*='cert'], [class*='rating']").first();
    const certificate = certEl.text().trim() || null;

    // Extract duration
    let durationMinutes: number | null = null;
    const durationText =
      $el.find(".duration, .runtime, [class*='duration'], [class*='runtime']").first().text() ||
      $el.text();
    const durationMatch = durationText.match(/(\d+)\s*(?:min|mins|minutes)/i);
    if (durationMatch) {
      durationMinutes = parseInt(durationMatch[1], 10);
    }

    // Extract showtimes
    const showtimes: ScrapedShowtime[] = [];
    
    // Look for time buttons/links
    const timeSelectors = [
      ".showtime",
      ".session",
      ".time-btn",
      ".time-button",
      'a[href*="booking"]',
      'a[href*="book"]',
      'a[href*="ticket"]',
      ".screening-time",
      "button.time",
    ];

    for (const sel of timeSelectors) {
      $el.find(sel).each((_j, timeEl) => {
        const $time = $(timeEl);
        const timeText = $time.text().trim();
        const timeMatch = timeText.match(/\b(\d{1,2}:\d{2})\b/);
        if (timeMatch) {
          let bookingUrl =
            $time.attr("href") ||
            $time.closest("a").attr("href") ||
            "";
          if (bookingUrl && !bookingUrl.startsWith("http")) {
            bookingUrl = BASE_URL + bookingUrl;
          }
          if (!bookingUrl) {
            bookingUrl = detailUrl;
          }
          const time = timeMatch[1];
          const endTime = durationMinutes
            ? addMinutesToTime(time, durationMinutes + 20)
            : undefined; // +20 for adverts
          showtimes.push({ time, endTime, bookingUrl });
        }
      });
      if (showtimes.length > 0) break;
    }

    // If no showtimes found via specific selectors, scan all links for times
    if (showtimes.length === 0) {
      $el.find("a").each((_j, linkEl) => {
        const $link = $(linkEl);
        const text = $link.text().trim();
        const timeMatch = text.match(/^(\d{1,2}:\d{2})$/);
        if (timeMatch) {
          let bookingUrl = $link.attr("href") || "";
          if (bookingUrl && !bookingUrl.startsWith("http")) {
            bookingUrl = BASE_URL + bookingUrl;
          }
          const time = timeMatch[1];
          const endTime = durationMinutes
            ? addMinutesToTime(time, durationMinutes + 20)
            : undefined;
          showtimes.push({ time, endTime, bookingUrl });
        }
      });
    }

    if (showtimes.length === 0) return; // Skip movies with no showtimes

    const id = slugify(title);
    if (seenIds.has(id)) return;
    seenIds.add(id);

    movies.push({
      id,
      title,
      posterUrl,
      detailUrl,
      durationMinutes,
      certificate,
      showtimes,
    });
  });

  // Fallback: try JSON-LD structured data
  if (movies.length === 0) {
    $('script[type="application/ld+json"]').each((_i, el) => {
      try {
        const data = JSON.parse($(el).html() || "{}");
        const events = Array.isArray(data) ? data : [data];
        for (const event of events) {
          if (event["@type"] === "Movie" || event["@type"] === "ScreeningEvent") {
            // Parse structured data if available
            logger.debug({ event }, "Found JSON-LD movie data");
          }
        }
      } catch {
        // ignore parse errors
      }
    });
  }

  logger.info({ count: movies.length }, "Scraped movies");
  return movies;
}

export async function scrapeMovieDetails(
  detailUrl: string
): Promise<ScrapedMovieDetails> {
  logger.info({ detailUrl }, "Fetching movie details");
  const html = await fetchWithHeaders(detailUrl);
  const $ = cheerio.load(html);

  // Extract trailer URL from YouTube iframes
  let trailerUrl: string | null = null;

  $("iframe").each((_i, el) => {
    const src = $(el).attr("src") || $(el).attr("data-src") || "";
    if (src.includes("youtube") || src.includes("youtu.be")) {
      const match = src.match(/embed\/([a-zA-Z0-9_-]{11})/);
      if (match) {
        trailerUrl = `https://www.youtube.com/watch?v=${match[1]}`;
      }
    }
  });

  // Try extracting from inline scripts / data attributes
  if (!trailerUrl) {
    trailerUrl = extractYouTubeUrl(html);
  }

  // Also check for trailer links
  if (!trailerUrl) {
    $('a[href*="youtube"], a[href*="youtu.be"]').each((_i, el): false | void => {
      const href = $(el).attr("href") || "";
      if (href.includes("youtube") || href.includes("youtu.be")) {
        trailerUrl = href;
        return false; // break
      }
    });
  }

  // Extract poster (larger image than on listing page)
  let posterUrl: string | null = null;
  const posterSelectors = [
    ".film-poster img",
    ".movie-poster img",
    ".poster img",
    ".hero-image img",
    "[class*='poster'] img",
    "[class*='hero'] img",
  ];
  for (const sel of posterSelectors) {
    const img = $(sel).first();
    if (img.length) {
      posterUrl =
        img.attr("src") || img.attr("data-src") || img.attr("data-lazy-src") || null;
      if (posterUrl && !posterUrl.startsWith("http")) {
        posterUrl = BASE_URL + posterUrl;
      }
      break;
    }
  }

  // Extract synopsis
  const synopsisSelectors = [
    ".synopsis",
    ".description",
    ".film-description",
    ".movie-description",
    "[class*='synopsis']",
    "[class*='description']",
    "p.lead",
  ];
  let synopsis: string | null = null;
  for (const sel of synopsisSelectors) {
    const text = $(sel).first().text().trim();
    if (text.length > 50) {
      synopsis = text;
      break;
    }
  }

  // Extract certificate & duration
  let certificate: string | null = null;
  let durationMinutes: number | null = null;

  $(".certificate, .rating, .cert, [class*='cert']").each((_i, el): false | void => {
    const text = $(el).text().trim();
    if (/^(U|PG|12A?|15|18|TBC)$/i.test(text)) {
      certificate = text.toUpperCase();
      return false;
    }
  });

  const bodyText = $("body").text();
  const durationMatch = bodyText.match(/(\d+)\s*(?:min|mins|minutes)/i);
  if (durationMatch) {
    durationMinutes = parseInt(durationMatch[1], 10);
  }

  return { trailerUrl, posterUrl, synopsis, certificate, durationMinutes };
}
