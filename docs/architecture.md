# Architecture (Target State)

## Purpose

Big Data Viz Lab is a frontend analytics console for large-scale AI training data exploration.

## Current Topology

- Client: React + Vite + TypeScript
- Server state: TanStack Query
- API transport: `src/lib/httpClient.ts` and `src/lib/apiClient.ts`
- Mock backend: MSW handlers in `src/mocks/handlers.ts`
- Rendering: ECharts, deck.gl, Sigma

## Target Enterprise Topology

- Identity: OIDC/SSO provider (Entra/Okta/Auth0)
- Authorization: RBAC plus tenant-aware data access
- API gateway: authenticated backend APIs, rate limiting, audit logs
- Observability: error tracking, traces, frontend performance metrics
- Delivery: protected CI gates, staged deploys, rollback path

## Architectural Boundaries

- `src/app`: app bootstrap, provider wiring
- `src/config`: runtime config and validation
- `src/lib`: API transport, schemas, error model
- `src/features`: feature modules (dashboards/charts/table/graph)
- `src/components`: reusable UI primitives

## RBAC Feature Policy (Current)

- `viewer`: access dashboard, filters, and read-only analytics views
- `analyst`: viewer permissions plus compare mode workflows
- `admin`: analyst permissions plus future admin controls

Current enforced feature mapping:

- `compare_mode`: `analyst` or `admin` (`src/auth/useAuth.ts`, `src/features/dashboard/DashboardPage.tsx`)

## Performance Gates (Current)

- CI runs `pnpm run test:perf`, which builds production assets and enforces gzip budgets.
- Gate script: `scripts/check-performance.mjs`
- Default budgets (override via env):
  - `PERF_MAX_MAIN_JS_GZIP_KB=550`
  - `PERF_MAX_TOTAL_JS_GZIP_KB=700`
  - `PERF_MAX_TOTAL_CSS_GZIP_KB=30`
  - `PERF_MAX_TOTAL_ASSETS_GZIP_KB=760`

## Non-Functional Targets

- Availability: 99.9% monthly target for production UI
- Performance: p95 route transition < 1.5s on baseline dataset
- Security: SSO required, role-based actions, vulnerability SLA
- Quality: deterministic tests, contract checks, CI policy gates
