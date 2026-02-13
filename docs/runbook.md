# Runbook

## Local Development

1. `pnpm install`
2. `cp .env.example .env`
3. `pnpm run dev`

## Required Checks Before Merge

1. `pnpm run lint`
2. `pnpm run typecheck`
3. `pnpm run stylelint`
4. `pnpm run test:contracts`
5. `pnpm run test:perf`
6. `pnpm run test:render-perf`
7. `pnpm run test:reliability`
8. `pnpm run test:release-governance`
9. `pnpm test`
10. `pnpm test:e2e`
11. `pnpm run test:e2e:auth`
12. `pnpm run test:e2e:a11y`

## Common Failures

### Environment validation failed

- Run `pnpm run check:env`
- Verify `.env` values match `.env.example`

### Unit tests failing due watchman in restricted environments

- Run `pnpm exec jest --runInBand`

### E2E instability

- Re-run with traces: `pnpm exec playwright test --trace on`
- Inspect artifacts under `test-results/`
- Run accessibility-only suite for fast iteration: `pnpm run test:e2e:a11y`

### Render performance failures

- Run `pnpm run test:render-perf` locally to reproduce.
- If failure is mount/readiness related, check detail-mode and lazy-load timing in `tests/render-performance.spec.ts`.
- If failure is budget related, inspect latest `test:perf` output before changing thresholds.

## Incident Triage (Frontend)

1. Confirm blast radius (single feature vs global outage)
2. Capture failing request paths and request IDs
3. Roll back to previous known good deployment if needed
4. Open incident doc with timeline and owner:
   - `pnpm run incident:new -- --severity SEV2 --title "Short summary"`
   - Fill in generated doc under `docs/incidents/YYYY/MM/`
5. Publish post-incident action items

## SLO and Error Budget Policy

- Policy source of truth: `config/reliability/slo.json`
- Validate locally: `pnpm run test:reliability`
- Current targets:
  - Availability: 99.9% (30-day window, 0.1% error budget)
  - Page load p95: 1500ms
  - Route transition p95: 1500ms
  - Incident MTTR target: 60 minutes

## Release Governance

- Changelog source: `CHANGELOG.md`
- Release checklist: `docs/release-checklist.md`
- Rollback checklist: `docs/rollback-checklist.md`
- Governance validator: `pnpm run test:release-governance`
