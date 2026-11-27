import assert from "node:assert/strict";
import test from "node:test";
import { isGenericOmniplexDescription } from "./omniplex-scraper";

test("rejects generic SEO descriptions for cinema and location pages", () => {
  for (const description of [
    "Focker-In-Law playing at Omniplex Cinemas. Browse showtimes and book your tickets online today!",
    "Doctor Who: The Satan Pit playing at Omniplex Lisburn. Browse showtimes and book your tickets online today!",
  ]) {
    assert.equal(isGenericOmniplexDescription(description), true);
  }
});

test("keeps an actual movie synopsis", () => {
  assert.equal(
    isGenericOmniplexDescription(
      "A family comedy about two households coming together.",
    ),
    false,
  );
});
