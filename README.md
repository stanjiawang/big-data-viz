# Big Data Viz Lab

Enterprise-ready workspace for large-scale AI training data analytics, built with Vite + React + TypeScript.

## Highlights

- Scalable dashboard layout with responsive grid + flex patterns
- Mocked big-data APIs via MSW for local development
- Interactive visualizations (ECharts time series/bar/pie, D3 embedding scatter, Deck.gl embedding cloud, Sigma.js relationship graph)
- Virtualized large table for multi-million row browsing
- Runtime language switcher with `react-intl` (`en`, `zh-CN`)
- Accessibility baseline enforced with Playwright + axe-core
- Strict linting, formatting, and type-checking
- Unit tests (Jest) and E2E tests (Playwright)

## Tech Stack

- Vite + React + TypeScript
- Tailwind CSS
- React Query
- MSW (Mock Service Worker)
- ECharts + D3 + Deck.gl + Sigma.js
- react-intl
- Jest + React Testing Library
- Playwright + @axe-core/playwright

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
- `VITE_ENABLE_AUTH`: `true` or `false`, enables auth gate
- `VITE_AUTH_PROVIDER`: `mock` (default) or `oidc`
- OIDC minimum config: `VITE_AUTH_OIDC_AUTHORIZE_URL`, `VITE_AUTH_OIDC_TOKEN_URL`, `VITE_AUTH_OIDC_CLIENT_ID`

When `VITE_AUTH_PROVIDER=oidc`, the client supports PKCE login callbacks and refresh-token renewal.
If token renewal fails, the session is cleared and the user is prompted to sign in again.

Mock sign-in account (when `VITE_AUTH_PROVIDER=mock`):

- Email: `analyst@example.com`
- Password: `DemoPass!123`

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
pnpm run test:e2e:auth
pnpm run test:e2e:a11y
```

`test:e2e` runs the non-auth functional suite.
`test:e2e:auth` runs auth-enabled end-to-end sign-in/sign-out flows.
`test:e2e:a11y` runs only the axe-core accessibility specs.

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
  app/            Bootstrap, provider composition, query client
  i18n/           Locale catalogs + react-intl provider/hook
  components/     Reusable UI and layout primitives
  config/         Runtime config + feature access policy
  features/       Domain modules (dashboard, charts, graph, embeddings, table)
  lib/            Core utilities, API transport, data generators
  mocks/          MSW handlers
  styles/         Tailwind entry
```

## License

MIT
