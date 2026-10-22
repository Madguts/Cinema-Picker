import * as cheerio from "cheerio";
import { logger } from "./logger";

const BASE_URL = "https://www.omniplexcinemas.co.uk";
const CINEMA_SLUG = "lisburn";
const SHOWTIMES_URL = `${BASE_URL}/cinema/showtimes/${CINEMA_SLUG}`;
const MOVIE_DETAIL_LABELS = new Set([
  "director",
  "starring",
  "cast",
  "actor",
  "actors",
  "genre",
  "genres",
  "runtime",
  "release date",
  "released",
  "certificate",
  "certification",
  "rating",
  "language",
  "country",
  "format",
  "classification",
]);

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
  genres: string[];
  synopsis: string | null;
  director?: string | null;
  starring?: string | null;
  additionalInfo?: Array<{ label: string; value: string }>;
  trailerUrl: string | null;
  showtimes: ScrapedShowtime[];
}

export interface ScrapedMovieDetails {
  posterUrl: string | null;
  synopsis: string | null;
  director: string | null;
  starring: string | null;
  additionalInfo: Array<{ label: string; value: string }>;
}

type JsonObject = Record<string, unknown>;

function findMovieSchema(value: unknown): JsonObject | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findMovieSchema(item);
      if (found) return found;
    }
    return null;
  }

  if (typeof value !== "object" || value === null) return null;
  const object = value as JsonObject;
  const type = object["@type"];
  if (
    (typeof type === "string" && type.toLowerCase().includes("movie")) ||
    (Array.isArray(type) &&
      type.some((item) => typeof item === "string" && item.toLowerCase().includes("movie")))
  ) {
    return object;
  }

  for (const child of Object.values(object)) {
    const found = findMovieSchema(child);
    if (found) return found;
  }
  return null;
}

function structuredText(value: unknown): string | null {
  if (typeof value === "string") return value.trim() || null;
  if (Array.isArray(value)) {
    const parts = value.map(structuredText).filter((part): part is string => Boolean(part));
    return parts.length > 0 ? parts.join(", ") : null;
  }
  if (typeof value === "object" && value !== null) {
    const object = value as JsonObject;
    return structuredText(object.name ?? object.value);
  }
  return null;
}

function extractMovieDetailRows(
  $: cheerio.CheerioAPI
): Array<{ label: string; value: string }> {
  const rows = new Map<string, { label: string; value: string }>();
  const addRow = (rawLabel: string, rawValue: string) => {
    const label = rawLabel.trim().replace(/\s+/g, " ").replace(/:$/, "");
    const value = rawValue.trim().replace(/\s+/g, " ");
    if (
      !label ||
      !value ||
      label.length > 60 ||
      value.length > 500 ||
      !MOVIE_DETAIL_LABELS.has(label.toLowerCase())
    ) {
      return;
    }
    rows.set(label.toLowerCase(), { label, value });
  };

  $("dt").each((_index, element) => {
    const $term = $(element);
    addRow($term.text(), $term.nextAll("dd").first().text());
  });
  $("th").each((_index, element) => {
    const $heading = $(element);
    addRow($heading.text(), $heading.nextAll("td").first().text());
  });
  $("p, li, div, span").each((_index, element) => {
    const text = $(element).text().trim().replace(/\s+/g, " ");
    if (text.length > 600) return;
    const match = text.match(/^([a-z][a-z /&-]{0,59})\s*:\s*(.+)$/i);
    if (match) addRow(match[1], match[2]);
  });

  return [...rows.values()];
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseDuration(text: string): number | null {
  // Handle "2hrs 52min", "1hr 30min", "52min", "2h 52m", etc.
  const hrsMin = text.match(/(\d+)\s*h(?:r|rs)?\s*(\d+)\s*min/i);
  if (hrsMin) {
    return parseInt(hrsMin[1], 10) * 60 + parseInt(hrsMin[2], 10);
  }
  const minsOnly = text.match(/(\d+)\s*min/i);
  if (minsOnly) {
    return parseInt(minsOnly[1], 10);
  }
  const hrsOnly = text.match(/(\d+)\s*h(?:r|rs)?/i);
  if (hrsOnly) {
    return parseInt(hrsOnly[1], 10) * 60;
  }
  return null;
}

function parseCertificateFromSrc(src: string): string | null {
  // e.g. /images/ratings/UK_15.png → 15
  const match = src.match(/UK_([^.]+)\.png/i);
  if (!match) return null;
  const raw = match[1].replace(/_/g, "");
  return raw.toUpperCase();
}

async function fetchOmniplexPage(date?: string): Promise<string> {
  if (date) {
    // Omniplex uses a POST form to change the date
    const body = new URLSearchParams({
      action: "processFilters",
      filterDate: date,
    });
    const response = await fetch(SHOWTIMES_URL, {
      method: "POST",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Content-Type": "application/x-www-form-urlencoded",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-GB,en;q=0.9",
      },
      body: body.toString(),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} fetching Omniplex for date ${date}`);
    }
    return response.text();
  } else {
    const response = await fetch(SHOWTIMES_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-GB,en;q=0.9",
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} fetching Omniplex showtimes`);
    }
    return response.text();
  }
}

export async function scrapeShowtimes(date?: string): Promise<ScrapedMovie[]> {
  logger.info({ date, url: SHOWTIMES_URL }, "Fetching Omniplex showtimes");

  const html = await fetchOmniplexPage(date);
  const $ = cheerio.load(html);

  const movies: ScrapedMovie[] = [];
  const seenIds = new Set<string>();

  // Find all movie title links — these are unique per movie card
  // Structure: <a href="/cinema/movie/lisburn/slug">Title</a>
  const titleLinks = $('a[href*="/cinema/movie/"]').filter((_i, el) => {
    const href = $(el).attr("href") || "";
    return href.includes(`/${CINEMA_SLUG}/`) || href.includes("/movie/");
  });

  titleLinks.each((_i, linkEl) => {
    const $link = $(linkEl);
    const href = $link.attr("href") || "";
    const title = $link.text().trim();

    if (!title || !href) return;

    // Deduplicate by title slug
    const id = slugify(title);
    if (seenIds.has(id)) return;

    // Build detail URL
    const detailUrl = href.startsWith("http") ? href : BASE_URL + href;

    // Traverse up to find the info column (col-span-2 md:col-span-5)
    // Structure: a → p.font-medium → div.flex → div.w-full → div.col-span-2 → [outer grid]
    const infoCol = $link.closest('[class*="col-span-2"]');
    if (!infoCol.length) return;

    // The outer movie card grid is infoCol's parent
    const outerGrid = infoCol.parent();

    // ---- Certificate ----
    let certificate: string | null = null;
    outerGrid.find('img[src*="/images/ratings/"]').each((_j, imgEl): false | void => {
      const src = $(imgEl).attr("src") || "";
      const cert = parseCertificateFromSrc(src);
      if (cert) {
        certificate = cert;
        return false;
      }
    });

    // ---- Genres ----
    let genres: string[] = [];
    // The genres text is next to the rating image, in a <p> sibling
    outerGrid.find('img[src*="/images/ratings/"]').each((_j, imgEl): false | void => {
      const $parent = $(imgEl).parent();
      const genreText = $parent.find("p").text().trim();
      if (genreText) {
        genres = genreText.split(",").map((g) => g.trim()).filter(Boolean);
        return false;
      }
    });

    // ---- Duration ----
    let durationMinutes: number | null = null;
    // Duration text looks like "2hrs 52min" and is near the genres
    outerGrid.find("p").each((_j, pEl): false | void => {
      const text = $(pEl).text().trim();
      const dur = parseDuration(text);
      if (dur && dur > 30) {
        durationMinutes = dur;
        return false;
      }
    });

    // ---- Synopsis ----
    const synopsisEl = outerGrid.find(".synopsis-short, span.synopsis-short");
    const synopsis = synopsisEl.text().trim() || null;

    // ---- Trailer YouTube ID ----
    let trailerUrl: string | null = null;
    outerGrid.find("[onclick]").each((_j, el): false | void => {
      const onclick = $(el).attr("onclick") || "";
      const match = onclick.match(/playYoutubeVideo\(['"]([a-zA-Z0-9_-]{11})['"]\)/);
      if (match) {
        trailerUrl = `https://www.youtube.com/watch?v=${match[1]}`;
        return false;
      }
    });
    // Also check img tags' onclick
    if (!trailerUrl) {
      outerGrid.find("img[onclick]").each((_j, el): false | void => {
        const onclick = $(el).attr("onclick") || "";
        const match = onclick.match(/playYoutubeVideo\(['"]([a-zA-Z0-9_-]{11})['"]\)/);
        if (match) {
          trailerUrl = `https://www.youtube.com/watch?v=${match[1]}`;
          return false;
        }
      });
    }

    // ---- Poster ----
    // The poster image is in the first column (A), look for img not SVG
    let posterUrl: string | null = null;
    outerGrid.find("img").each((_j, imgEl): false | void => {
      const src = $(imgEl).attr("src") || $(imgEl).attr("data-src") || "";
      // Skip SVG icons, rating images, and favicon-like images
      if (
        src.includes("/svgs/") ||
        src.includes("/images/ratings/") ||
        src.includes("/images/icons/") ||
        !src ||
        src.endsWith(".svg")
      ) {
        return;
      }
      posterUrl = src.startsWith("http") ? src : BASE_URL + src;
      return false;
    });

    // ---- Showtimes ----
    const showtimes: ScrapedShowtime[] = [];

    outerGrid.find(".showTimeBox").each((_j, boxEl) => {
      const $box = $(boxEl);

      // Time: <h4 class="bigText">20:30</h4>
      const startText = $box.find("h4.bigText, h4[class*='bigText']").first().text().trim();
      const startMatch = startText.match(/(\d{1,2}:\d{2})/);
      if (!startMatch) return;
      const time = startMatch[1];

      // End time: <p class="smallText">- 23:22</p>
      const endText = $box.find("p.smallText, p[class*='smallText']").first().text().trim();
      const endMatch = endText.match(/(\d{1,2}:\d{2})/);
      const endTime = endMatch ? endMatch[1] : undefined;

      // Booking URL: the <a> wrapping this showTimeBox
      const $parentLink = $box.parent("a");
      let bookingUrl = $parentLink.attr("href") || "";
      if (bookingUrl && !bookingUrl.startsWith("http")) {
        bookingUrl = BASE_URL + bookingUrl;
      }
      if (!bookingUrl) {
        bookingUrl = detailUrl;
      }

      showtimes.push({ time, endTime, bookingUrl });
    });

    if (showtimes.length === 0) return; // Skip movies with no showtimes

    seenIds.add(id);

    movies.push({
      id,
      title,
      posterUrl,
      detailUrl,
      durationMinutes,
      certificate,
      genres,
      synopsis,
      trailerUrl,
      showtimes,
    });
  });

  logger.info({ count: movies.length, date }, "Scraped movies");
  return movies;
}

export async function scrapeMovieDetails(
  detailUrl: string
): Promise<ScrapedMovieDetails> {
  logger.info({ detailUrl }, "Fetching movie detail page");

  const response = await fetch(detailUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching movie detail`);
  }
  const html = await response.text();
  const $ = cheerio.load(html);

  let movieSchema: JsonObject | null = null;
  $('script[type="application/ld+json"]').each((_index, element) => {
    try {
      const parsed: unknown = JSON.parse($(element).text());
      movieSchema ??= findMovieSchema(parsed);
    } catch {
      // Ignore malformed structured data and continue with the page markup.
    }
  });

  let posterUrl: string | null = null;

  // Look for the main movie poster image
  const posterSelectors = [
    ".film-poster img",
    ".movie-poster img",
    ".poster img",
    '[class*="poster"] img',
    'img[alt*="poster" i]',
    'img[alt*="movie" i]',
  ];
  for (const sel of posterSelectors) {
    const img = $(sel).first();
    if (img.length) {
      const src = img.attr("src") || img.attr("data-src") || "";
      if (src && !src.includes("/svgs/") && !src.includes("/images/icons/")) {
        posterUrl = src.startsWith("http") ? src : BASE_URL + src;
        break;
      }
    }
  }

  // Fallback: first meaningful img on the page
  if (!posterUrl) {
    $("img").each((_i, el): false | void => {
      const src = $(el).attr("src") || "";
      if (
        src &&
        !src.includes("/svgs/") &&
        !src.includes("/images/icons/") &&
        !src.includes("/images/ratings/") &&
        !src.endsWith(".svg")
      ) {
        posterUrl = src.startsWith("http") ? src : BASE_URL + src;
        return false;
      }
    });
  }

  const synopsisSelectors = [
    '[itemprop="description"]',
    ".synopsis-long",
    ".film-synopsis",
    ".movie-synopsis",
    ".synopsis",
    '[class*="synopsis"]',
  ];
  let synopsis: string | null = null;
  for (const selector of synopsisSelectors) {
    const text = $(selector).not(".synopsis-short").first().text().trim();
    if (text) {
      synopsis = text;
      break;
    }
  }
  synopsis ??= structuredText(movieSchema?.description);
  synopsis ??=
    $('meta[property="og:description"]').attr("content")?.trim() ||
    $('meta[name="description"]').attr("content")?.trim() ||
    null;

  const detailRows = extractMovieDetailRows($);
  const schemaGenres = structuredText(movieSchema?.genre);
  if (schemaGenres && !detailRows.some((row) => row.label.toLowerCase() === "genres")) {
    detailRows.push({ label: "Genres", value: schemaGenres });
  }
  const schemaDetails: Array<{ label: string; value: string | null }> = [
    { label: "Release date", value: structuredText(movieSchema?.datePublished) },
    { label: "Runtime", value: structuredText(movieSchema?.duration) },
    { label: "Certificate", value: structuredText(movieSchema?.contentRating) },
    { label: "Language", value: structuredText(movieSchema?.inLanguage) },
    { label: "Country", value: structuredText(movieSchema?.countryOfOrigin) },
  ];
  for (const row of schemaDetails) {
    if (
      row.value &&
      !detailRows.some((detail) => detail.label.toLowerCase() === row.label.toLowerCase())
    ) {
      detailRows.push({ label: row.label, value: row.value });
    }
  }

  const rowValue = (...labels: string[]) =>
    detailRows.find((row) => labels.includes(row.label.toLowerCase()))?.value ?? null;
  const itempropValue = (property: string) => {
    const values = $(`[itemprop="${property}"]`)
      .map((_index, element) => {
        const $element = $(element);
        return (
          $element.attr("content")?.trim() ||
          $element.attr("name")?.trim() ||
          $element.text().trim()
        );
      })
      .get()
      .filter(Boolean);
    return values.length > 0 ? values.join(", ") : null;
  };
  const director =
    structuredText(movieSchema?.director) ?? rowValue("director") ?? itempropValue("director");
  const starring =
    structuredText(movieSchema?.actor) ??
    rowValue("starring", "cast", "actor", "actors") ??
    itempropValue("actor");
  const additionalInfo = detailRows.filter(
    (row) => !["director", "starring", "cast", "actor", "actors"].includes(row.label.toLowerCase())
  );

  return { posterUrl, synopsis, director, starring, additionalInfo };
}
