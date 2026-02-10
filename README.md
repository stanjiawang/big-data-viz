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
- Deck.gl + Sigma.js
- Jest + React Testing Library
- Playwright

## Getting Started

```bash
pnpm install
cp .env.example .env
pnpm run dev
```

Open: http://localhost:5173

## Runtime Configuration

The app uses environment-driven runtime config and a resilient API client (timeout + retry + typed errors).

- `VITE_API_BASE_URL`: API origin, for example `https://api.company.com`
- `VITE_API_TIMEOUT_MS`: request timeout in milliseconds
- `VITE_API_RETRY_COUNT`: retry count for retriable failures
- `VITE_ENABLE_MSW`: `true` or `false`, enables mock API worker in development

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

MSW can be enabled in development via `VITE_ENABLE_MSW=true`.

Query params:

- `size`: `100000 | 1000000 | 10000000 | 50000000`
- `label`: `all | class-A | class-B | ...`
- `source`: `all | user | sensor | system | synthetic`

Mock controls (for resilience testing):

- `mockFailure`: `unauthorized | forbidden | rate-limit | server-error | malformed`
- `mockDelayMs`: response delay in milliseconds (clamped to `0..5000`)
- `mockRequireAuth`: `true | false` (requires `Authorization` header)
- `mockRequireTenant`: `true | false` (requires `X-Tenant-Id` header)

Example:

```
http://localhost:5173/?size=1000000&label=all&source=all

# simulate throttling on mock-data endpoint
http://localhost:5173/?size=1000000&mockFailure=rate-limit
```

## Project Structure

```
src/
  app/            App entry, bootstrap, query client
  components/     Reusable UI and layout components
  config/         Runtime config resolution
  features/       Domain features (charts, graph, embeddings, table)
  lib/            Core utilities, API transport, data generators
  mocks/          MSW handlers
  styles/         Tailwind entry
```

## License

MIT
