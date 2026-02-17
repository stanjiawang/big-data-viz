# Phase 06: Productionization and Interview Demo Packaging

## Objective

Ship a public-ready demo posture with repeatable deployment and safe runtime defaults.

## Slice Plan

### Slice 1: Deploy + Demo Profile Baseline

- Add one-click deployment docs for Vercel and Cloudflare Pages.
- Introduce runtime profile switch (`standard` / `demo`) with safe demo defaults.
- Add dedicated demo scripts (`dev:demo`, `build:demo`).
- Update env validation to guard runtime profile values.

### Slice 2: Public Quality Dashboard

- Add public-friendly quality status summary (tests, perf budgets, accessibility).
- Publish benchmark snapshots generated from CI artifacts.
- Link quality dashboard and release evidence in docs.

### Slice 3: Packaging and Handoff

- Finalize interview demo runbook with scripted setup and troubleshooting.
- Add release-note summary for demo capabilities and constraints.
- Validate complete CI + deployment path from `main`.

## Success Metrics

- Demo build can be produced with `pnpm run build:demo` with no config edits.
- New contributors can deploy with docs only in under 15 minutes.
- CI remains green while demo profile is enabled.

## Delivery Notes

- Slice 1 delivered demo runtime profile (`standard`/`demo`) and deployment docs.
- Slice 2 delivered CI quality dashboard artifact generation and publication.
- Slice 3 delivered demo handoff guide and scripted demo package verification.
