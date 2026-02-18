# Runbook

## Local Development

1. `pnpm install`
2. `cp .env.example .env`
3. `pnpm run dev`

Demo profile local run:

- `pnpm run dev:demo`
- or `cp .env.demo .env` then `pnpm run dev`

## Required Checks Before Merge

1. `pnpm run lint`
2. `pnpm run typecheck`
3. `pnpm run stylelint`
4. `pnpm run test:security-headers`
5. `pnpm run test:dependency-policy`
6. `pnpm run sbom:generate`
7. `pnpm run test:contracts`
8. `pnpm run test:perf`
9. `pnpm run test:render-perf`
10. `pnpm run test:reliability`
11. `pnpm run test:release-governance`
12. `pnpm test`
13. `pnpm test:e2e`
14. `pnpm run test:e2e:auth`
15. `pnpm run test:e2e:a11y`
16. `pnpm run quality:dashboard`
17. `pnpm run build:demo`
18. `pnpm run demo:verify`

## Common Failures

### Environment validation failed

- Run `pnpm run check:env`
- Verify `.env` values match `.env.example`
- For public demo posture, set `VITE_RUNTIME_PROFILE=demo`

### Unit tests failing due watchman in restricted environments

- Run `pnpm exec jest --runInBand`

### E2E instability

- Re-run with traces: `pnpm exec playwright test --trace on`
- Inspect artifacts under `test-results/`
- Run accessibility-only suite for fast iteration: `pnpm run test:e2e:a11y`

### Render performance failures

- Run `pnpm run test:render-perf` locally to reproduce.
- If failure is mount/readiness related, check detail-mode and lazy-load timing in `tests/e2e/render-performance.e2e.spec.ts`.
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

## Deployment

- Guide: `docs/deploy.md`
- Interview demo handoff: `docs/demo-handoff.md`
