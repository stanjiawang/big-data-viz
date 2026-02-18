# Changelog

All notable changes to this project are tracked in this file.

## Unreleased

### Added

- CI gates for contracts, performance budgets, and reliability policy.
- Incident document automation and reliability policy validation.
- Accessibility e2e gate using Playwright + axe-core (`pnpm run test:e2e:a11y`).
- Runtime language switcher and locale catalogs (`en`, `zh-CN`).
- Phase 4 security roadmap spec (`docs/roadmap/phase-04-security-governance.md`).
- Deploy-ready security header profiles for Cloudflare-style hosts (`public/_headers`) and Vercel (`vercel.json`).
- Dependency policy gate (`test:dependency-policy`) and SBOM generator (`sbom:generate`) for CI governance.
- Phase 6 productionization spec (`docs/roadmap/phase-06-productionization.md`) and deployment guide (`docs/deploy.md`) for Vercel + Cloudflare Pages.
- Demo runtime profile support (`VITE_RUNTIME_PROFILE=demo`) with dedicated scripts (`pnpm run dev:demo`, `pnpm run build:demo`).
- CI quality dashboard artifacts (`quality-dashboard`) with consolidated coverage, bundle perf, render benchmark, and accessibility gate status.
- Demo handoff packaging docs and verifier script (`docs/demo-handoff.md`, `pnpm run demo:verify`).
- Dashboard routing introduced with lazy-loaded overview/detail route modules and scoped query invalidation for realtime refresh.

### Changed

- Feature-level RBAC enforcement for compare workflows.
- API payload schema contracts now include strict schema versioning.
- i18n runtime migrated to `react-intl` while preserving existing translation hook usage.
- Dashboard semantics improved for accessibility (skip link, labeled regions/dialogs, keyboard-focusable scroll areas, improved contrast).
- Auth session persistence now defaults to safer `sessionStorage` via `VITE_AUTH_SESSION_STORAGE=session`, with migration-safe fallback reads.
- Auth/session header resolution is centralized in auth client storage logic.
- CI now uploads CycloneDX SBOM artifacts and enforces dependency policy before merge.
- Runtime config now includes an explicit `runtimeProfile` contract (`standard` | `demo`) and demo-safe fallback defaults.
- Dashboard sections now lazy-load heavy visualization and table modules behind section-local async boundaries to reduce initial bundle pressure and isolate rendering costs.
- Dashboard overview rendering is split with memoized data-section boundaries so control-panel interactions avoid unnecessary KPI/chart/table rerenders.
- Dashboard control workflows (saved views, snapshots, annotations, share link) are isolated in a memoized control panel to keep parent render scope minimal.
- Dashboard data sections now consume deferred filter values to keep control interactions responsive while heavy KPI/chart/table updates render at lower priority.
- Filter mutation paths in `FiltersPanel` are now centralized in stable callbacks (search/source/weights/labels) to reduce inline render churn and keep update semantics consistent.
- Dashboard data sections are decoupled from global `isFetching` changes so background refetches do not trigger unnecessary chart/table subtree rerenders.
- Dashboard refresh/realtime invalidation now targets dashboard query key prefixes only (`mock-data`, `timeseries`, `graph`) via a shared helper instead of global query invalidation.
- Render-performance e2e now has auth-aware bootstrap and direct graph detail-route measurement (`/detail/graph`) to reduce CI flakiness from auth-gate and legacy redirect timing.
- Added unit coverage to assert the dashboard “Refresh data” action uses scoped dashboard query invalidation helper behavior.
- Added auth-enabled e2e regression for large-dataset bootstrap across overview and direct graph detail routes, matching render-perf sign-in readiness expectations.
- ESLint now ignores generated Playwright/CI artifact directories (`test-results`, `playwright-report`, `coverage`, `artifacts`) to prevent lint/e2e race regressions.
- Added e2e coverage for `Refresh data` behavior across realtime off/live/paused states, and tightened text locators in dashboard interaction tests to avoid strict-mode ambiguity.
- Dashboard feature file layout was normalized for naming/structure consistency: shared dashboard UI files moved under `features/dashboard/ui`, generic section helpers renamed to explicit PascalCase modules (`SectionShared`, `LazySections`, `LazyVisualizations`), and imports/tests updated accordingly.
- Documentation set was audited and normalized:
  - removed redundant legacy backlog doc (`docs/enterprise-upgrade-backlog.md`)
  - added docs index (`docs/README.md`) and missing Phase 05 roadmap spec (`docs/roadmap/phase-05-extensibility.md`)
  - aligned `README.md`, `CONTRIBUTING.md`, `PLAN.md`, `docs/runbook.md`, `docs/architecture.md`, and `docs/quality-dashboard.md` with current scripts/CI/runtime behavior.

## Release Procedure

1. Update `## Unreleased` entries.
2. Run required checks from `docs/runbook.md`.
3. Complete `docs/release-checklist.md`.
4. Confirm rollback readiness via `docs/rollback-checklist.md`.
5. Tag and publish release artifact.
