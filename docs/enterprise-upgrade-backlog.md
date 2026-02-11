# Enterprise Upgrade Backlog

## Prioritization Model

- P0: blocks production readiness
- P1: required for reliable enterprise operation
- P2: important scale and operability improvements

## Epic A: Governance and Standards (P0)

- A1. Add `SECURITY.md` and vulnerability disclosure process
  - Estimate: 0.5d
  - Acceptance: documented workflow and response SLA
- A2. Add `CODEOWNERS` for core paths
  - Estimate: 0.5d
  - Acceptance: ownership required on PR reviews
- A3. Align testing standard docs with actual framework (Jest)
  - Estimate: 0.5d
  - Acceptance: no Vitest/Jest contradiction in repo docs

## Epic B: Auth and Authorization (P0)

- B1. Integrate OIDC login flow
  - Estimate: 3d
  - Acceptance: unauthenticated users redirected to login
- B2. Add RBAC guards for privileged actions
  - Estimate: 2d
  - Acceptance: role-based UI and API request behavior
- B3. Add tenant context propagation in API client
  - Estimate: 2d
  - Acceptance: requests include tenant scope metadata

## Epic C: Observability (P1)

- C1. Add error tracking with release metadata
  - Estimate: 2d
  - Acceptance: uncaught exceptions visible with commit/version tags
- C2. Add frontend performance telemetry (Web Vitals)
  - Estimate: 1d
  - Acceptance: dashboard for p50/p95 metrics
- C3. Add structured client logging for API failures
  - Estimate: 1d
  - Acceptance: requestId/errorCode/status captured

## Epic D: Reliability and API Hardening (P1)

- D1. Distinguish timeout vs user-cancelled request errors
  - Estimate: 1d
  - Acceptance: error code taxonomy separates cancellation
- D2. Add exponential backoff + jitter retries
  - Estimate: 1d
  - Acceptance: retry strategy configurable and tested
- D3. Add centralized query error boundary policy
  - Estimate: 1d
  - Acceptance: user-safe fallback + retry UX standardized

## Epic E: CI/CD and Security Gates (P1)

- E1. Add dependency vulnerability scan in CI
  - Estimate: 1d
  - Acceptance: PR fails on critical vulnerabilities
- E2. Add coverage threshold gate
  - Estimate: 1d
  - Acceptance: CI enforces minimum lines/branches
- E3. Add branch protection policy documentation
  - Estimate: 0.5d
  - Acceptance: required checks and reviewer rules documented

## Epic F: Testing Maturity (P1)

- F1. Expand Playwright critical-flow suite (>=8 scenarios)
  - Estimate: 3d
  - Acceptance: key user journeys covered in CI
- F2. Add API contract tests for schemas
  - Estimate: 2d
  - Acceptance: schema mismatch fails CI early
- F3. Add test data fixtures for reproducibility
  - Estimate: 1d
  - Acceptance: deterministic snapshots and stable assertions

## Epic G: Operability and Performance (P2)

- G1. Define and enforce bundle-size budgets
  - Estimate: 1d
  - Acceptance: CI gate on JS/CSS asset growth
- G2. Add render-performance benchmarks for large table/graph
  - Estimate: 2d
  - Acceptance: benchmark report tracked per release
- G3. Add incident playbook and release rollback procedure
  - Estimate: 1d
  - Acceptance: documented runbook exercised once

## Completed Foundation Items

- F1 completed: Playwright critical-flow suite expanded to 10 scenarios in CI
- F2 completed: API contract tests with schema-version CI gate
- F3 completed: deterministic mock-data fixtures and stable assertions for test reproducibility
- G1 completed: bundle-size performance budgets enforced in CI
- G2 completed: deterministic render-performance benchmark gate for large table and graph flows
- G3 foundation completed: incident template, generator script, and runbook wiring
- E3 completed: release governance docs and CI validation gate

## Suggested Delivery Sequence

1. Epic A
2. Epic B + C (parallel tracks)
3. Epic D + E
4. Epic F
5. Epic G
