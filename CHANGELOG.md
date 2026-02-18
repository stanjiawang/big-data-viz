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

## Release Procedure

1. Update `## Unreleased` entries.
2. Run required checks from `docs/runbook.md`.
3. Complete `docs/release-checklist.md`.
4. Confirm rollback readiness via `docs/rollback-checklist.md`.
5. Tag and publish release artifact.
