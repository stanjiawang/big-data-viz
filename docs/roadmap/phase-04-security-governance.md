# Phase 04: Enterprise Security and Governance

## Goal

Harden client-side security posture and codify release governance controls needed for production deployment.

## Scope

In:

- Deployment security headers and CSP baseline for static hosting targets.
- Auth/session persistence risk controls and safer token storage defaults.
- CI governance automation for dependency and SBOM policy checks.

Out:

- Backend-side WAF/rate-limiter implementation.
- Full SOC2/ISO control mapping.

## Delivery Slices

### Slice 1: Deploy Security Headers Baseline

- Add production-grade headers profile for static deployments (Cloudflare Pages / Vercel).
- Define CSP allowlist aligned with current runtime needs (charts, workers, image export).
- Document header ownership and rollout verification checklist.

### Slice 2: Session and Token Storage Hardening

- Default auth session persistence to `sessionStorage`.
- Keep local-storage fallback compatibility for existing sessions and migration safety.
- Centralize auth session reads so API headers and auth provider use identical storage logic.

### Slice 3: Dependency + SBOM Governance in CI

- Generate SBOM artifact in CI for every release candidate.
- Enforce dependency-risk policy for high/critical vulnerabilities.
- Add release checklist criteria for security gate pass/fail.

## Acceptance

- App builds and runs with strict security header profile in deploy targets.
- Auth sign-in/sign-out and refresh flows remain stable after storage hardening.
- CI security governance gates are visible and auditable for release branches.

## Dependencies

- Existing auth/oidc integration and runtime config model.
- Existing CI workflow foundation in `.github/workflows/ci.yml`.
