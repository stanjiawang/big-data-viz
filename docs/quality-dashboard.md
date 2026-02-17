# Quality Dashboard

The project publishes a quality dashboard artifact from CI to support public demo validation.

## Generated Artifacts

- `artifacts/quality-dashboard.json`
- `artifacts/quality-dashboard.md`
- `artifacts/performance-budget.json`
- `artifacts/render-benchmark.json`
- `coverage/coverage-summary.json`

## How It Is Generated

CI runs:

1. `pnpm run test:perf`
2. `pnpm run test:render-perf`
3. `pnpm run test:coverage`
4. `pnpm run test:e2e:a11y`
5. `pnpm run quality:dashboard`

The generator script consolidates coverage + perf + render benchmark metrics into a single report:

- `scripts/generate-quality-dashboard.mjs`

## Local Reproduction

```bash
pnpm run test:perf
pnpm run test:render-perf
pnpm run test:coverage
pnpm run quality:dashboard
```
