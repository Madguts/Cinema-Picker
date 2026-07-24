import { Router, type IRouter } from "express";
import {
  GetShowtimesQueryParams,
  GetMovieDetailsQueryParams,
} from "@workspace/api-zod";
import { scrapeShowtimes, scrapeMovieDetails } from "../lib/omniplex-scraper";

const router: IRouter = Router();

router.get("/showtimes", async (req, res): Promise<void> => {
  const parsed = GetShowtimesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { date } = parsed.data;

  try {
    const movies = await scrapeShowtimes(date ?? undefined);
    const today = date ?? new Date().toISOString().split("T")[0];
    res.json({ date: today, movies });
  } catch (err) {
    req.log.error({ err }, "Failed to scrape showtimes");
    res.status(500).json({ error: "Failed to fetch showtimes from Omniplex" });
  }
});

router.get("/movie-details", async (req, res): Promise<void> => {
  const parsed = GetMovieDetailsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Missing or invalid url parameter" });
    return;
  }

  const { url } = parsed.data;

  if (!url) {
    res.status(400).json({ error: "url parameter is required" });
    return;
  }

  try {
    const details = await scrapeMovieDetails(url);
    res.json(details);
  } catch (err) {
    req.log.error({ err, url }, "Failed to scrape movie details");
    res.status(500).json({ error: "Failed to fetch movie details" });
  }
});

export default router;
