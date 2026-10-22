# Cinema Picker

Cinema Picker is a static website for choosing a movie playing at Omniplex
Lisburn. It keeps the time-window picker, random selection, movie details,
showtime booking links, and locally saved vetoes without requiring a running
web server.

## Run locally

Install dependencies with `pnpm install`, then run:

```sh
pnpm --filter @workspace/cinema-roulette run dev
```

The development command refreshes showtimes before starting Vite. A production
build generates an eleven-day range (to cover the ten-day picker) and writes
the website to `artifacts/cinema-roulette/dist/public`.

## GitHub Pages deployment

The `Deploy Cinema Picker to GitHub Pages` workflow builds and deploys the
website when changes are pushed to `main`, and refreshes its showtime data
every six hours. It can also be started manually from the Actions tab.
Enable GitHub Pages for the repository with **GitHub Actions** as the build
and deployment source.

The workflow scrapes the next eleven calendar days for `Europe/London` with
the generator in `scripts/` and packages the resulting JSON files alongside
the static frontend. The browser reads these generated files directly. Live
bookings still open directly on Omniplex.
