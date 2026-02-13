# Changelog

All notable changes to this project are tracked in this file.

## Unreleased

### Added

- CI gates for contracts, performance budgets, and reliability policy.
- Incident document automation and reliability policy validation.
- Accessibility e2e gate using Playwright + axe-core (`pnpm run test:e2e:a11y`).
- Runtime language switcher and locale catalogs (`en`, `zh-CN`).

### Changed

- Feature-level RBAC enforcement for compare workflows.
- API payload schema contracts now include strict schema versioning.
- i18n runtime migrated to `react-intl` while preserving existing translation hook usage.
- Dashboard semantics improved for accessibility (skip link, labeled regions/dialogs, keyboard-focusable scroll areas, improved contrast).

## Release Procedure

1. Update `## Unreleased` entries.
2. Run required checks from `docs/runbook.md`.
3. Complete `docs/release-checklist.md`.
4. Confirm rollback readiness via `docs/rollback-checklist.md`.
5. Tag and publish release artifact.
