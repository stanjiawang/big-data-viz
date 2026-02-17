# Big Data Viz Lab Roadmap

## Planning Model

This project uses a 3-layer planning model:

- `PLAN.md`: executive phase roadmap and sequencing.
- `docs/roadmap/phase-XX-*.md`: implementable phase specs.
- `docs/adr/ADR-XXX-*.md`: major architecture decisions.

## Current State

- Frontend-only platform with mock APIs (MSW).
- Strong CI quality gates (lint, typecheck, unit/e2e, perf, reliability, release governance).
- Enterprise foundations present: auth modes, RBAC gate for compare mode, i18n, a11y baseline, rendering/perf checks.

## Phase Roadmap

### Phase 1: Product Foundation Hardening (Now)

Objective:

- Stabilize state model and UX contracts for long-term extension.

Deliverables:

- Unified persisted dashboard state contract (filters, compare mode, card order, density, locale/theme).
- Route-state and storage-state consistency tests.
- Shared interaction contract for card actions and detail views.

Success Metrics:

- No critical/high defects in dashboard state flows for two consecutive releases.
- E2E stability >= 99% pass across 20 reruns in CI.

Spec:

- `docs/roadmap/phase-01-foundation.md`

### Phase 2: Data Workflow Features

Objective:

- Move from passive dashboard to analyst workflow.

Deliverables:

- Saved Views (create/update/delete/default view).
- Shareable deep links for full dashboard context.
- Cross-filter interactions between charts/graph/table.

Success Metrics:

- 80% of interactions reproducible via share link.
- Saved view restore latency < 300ms p95.

Spec:

- `docs/roadmap/phase-02-data-experience.md`

### Phase 3: Realtime and Collaboration

Objective:

- Add live operations and team collaboration.

Deliverables:

- Realtime stream mode (SSE/WebSocket abstraction).
- In-dashboard annotations and review comments.
- Snapshot compare timeline.

Success Metrics:

- Realtime update render p95 < 500ms at target event rate.
- Annotation create/read success >= 99.9%.

Spec:

- `docs/roadmap/phase-03-collaboration.md`

### Phase 4: Enterprise Security and Governance

Objective:

- Prepare for production-grade regulated environments.

Deliverables:

- Security headers/CSP hardening plan for deploy targets.
- Session storage risk controls and token-handling hardening.
- Dependency and SBOM policy automation in CI.

Success Metrics:

- Zero high/critical dependency vulnerabilities on default branch.
- Security review checklist green for every release candidate.

Spec:

- `docs/roadmap/phase-04-security-governance.md`

### Phase 5: Platform Extensibility

Objective:

- Enable modular growth of domain-specific visuals.

Deliverables:

- Pluggable visualization registry.
- Typed extension API contracts.
- Feature-level access policy integration for plugins.

Success Metrics:

- New visualization module integration < 1 day engineering effort.

### Phase 6: Productionization and Interview Demo Packaging

Objective:

- Ship polished public demo and deployment posture.

Deliverables:

- One-click deployment docs (Vercel + Cloudflare Pages).
- Demo-mode runtime profile (safe defaults).
- Public benchmark and quality dashboard.

Success Metrics:

- Green CI + successful deploy from main in < 15 minutes.

Spec:

- `docs/roadmap/phase-06-productionization.md`

## Execution Rules

- Deliver each phase in vertical slices: `UI + state + tests + docs + telemetry` in one PR.
- No feature is considered complete without e2e coverage updates.
- Every phase starts with a phase spec and ends with release-note updates.

## Immediate Next Step

- Start Phase 6, Slice 3: demo packaging handoff and release-note finalization.
