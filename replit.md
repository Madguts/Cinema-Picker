# Cinema Picker

A movie roulette for choosing a film playing at Omniplex Lisburn.

## Run & Operate

- `pnpm --filter @workspace/cinema-roulette run dev` — refresh showtimes and run the website
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/cinema-roulette/` — React/Vite frontend and static build.
- `artifacts/api-server/src/lib/omniplex-scraper.ts` — showtime scraper reused by the static data generator.
- `artifacts/api-server/src/generate-showtimes.ts` — generates static JSON for the next eleven days.
- `.github/workflows/deploy-pages.yml` — GitHub Pages build, scheduled refresh, and deployment.

## Architecture decisions

- GitHub Pages serves the frontend and generated showtime JSON; it cannot run the Express API.
- Showtimes refresh at deploy time and on a six-hour schedule.
- Browser preferences, including vetoes, stay local to the user's browser.

## Product

Choose a movie by day and time window, browse available movies, veto films,
and follow direct Omniplex booking links.

## User preferences

Preserve the current roulette, showtime filtering, movie details, and veto experience.

## Gotchas

- The static build needs access to Omniplex to generate showtimes for the next eleven days.
- For a project site, Vite's `BASE_PATH` must include the repository name and trailing slash.

## Pointers

- `README.md` contains local run and GitHub Pages deployment instructions.
