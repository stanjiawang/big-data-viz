# Big Data Viz Lab

Enterprise-ready workspace for large-scale AI training data analytics, built with Vite + React + TypeScript.

## Highlights

- Scalable dashboard layout with responsive grid + flex patterns
- Mocked big-data APIs via MSW for local development
- Interactive visualizations (time series, embedding cloud, relationship graph)
- Virtualized large table for multi-million row browsing
- Strict linting, formatting, and type-checking
- Unit tests (Jest) and E2E tests (Playwright)

## Tech Stack

- Vite + React + TypeScript
- Tailwind CSS
- React Query
- MSW (Mock Service Worker)
- Recharts + Visx + Deck.gl + Sigma.js
- Jest + React Testing Library
- Playwright

## Getting Started

```bash
pnpm install
pnpm run dev
```

Open: http://localhost:5173

## Scripts

```bash
pnpm run dev
pnpm run build
pnpm run preview
pnpm run lint
pnpm run typecheck
pnpm run format
pnpm run stylelint
pnpm test
pnpm test:e2e
```

## Mock Data

MSW is enabled by default in development. You can control dataset size and filters via query params:

- `size`: `100k | 1m | 10m`
- `label`: `all | class-A | class-B | ...`
- `source`: `all | user | sensor | system | synthetic`

Example:

```
http://localhost:5173/?size=1m&label=all&source=all
```

## Project Structure

```
src/
  app/            App entry, bootstrap, query client
  components/     Reusable UI and layout components
  features/       Domain features (charts, graph, embeddings, table)
  lib/            Core utilities and data generators
  mocks/          MSW handlers
  styles/         Tailwind entry
```

## License

MIT
