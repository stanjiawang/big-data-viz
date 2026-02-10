# Runbook

## Local Development

1. `pnpm install`
2. `cp .env.example .env`
3. `pnpm run dev`

## Required Checks Before Merge

1. `pnpm run lint`
2. `pnpm run typecheck`
3. `pnpm run stylelint`
4. `pnpm test`
5. `pnpm test:e2e`

## Common Failures

### Environment validation failed

- Run `pnpm run check:env`
- Verify `.env` values match `.env.example`

### Unit tests failing due watchman in restricted environments

- Run `pnpm exec jest --runInBand`

### E2E instability

- Re-run with traces: `pnpm exec playwright test --trace on`
- Inspect artifacts under `test-results/`

## Incident Triage (Frontend)

1. Confirm blast radius (single feature vs global outage)
2. Capture failing request paths and request IDs
3. Roll back to previous known good deployment if needed
4. Open incident doc with timeline and owner
5. Publish post-incident action items
