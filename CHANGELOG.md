# Changelog

All notable changes to this project are tracked in this file.

## Unreleased

### Added

- CI gates for contracts, performance budgets, and reliability policy.
- Incident document automation and reliability policy validation.

### Changed

- Feature-level RBAC enforcement for compare workflows.
- API payload schema contracts now include strict schema versioning.

## Release Procedure

1. Update `## Unreleased` entries.
2. Run required checks from `docs/runbook.md`.
3. Complete `docs/release-checklist.md`.
4. Confirm rollback readiness via `docs/rollback-checklist.md`.
5. Tag and publish release artifact.
