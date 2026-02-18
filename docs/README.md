# Documentation Index

This folder contains operational and architectural documentation for Big Data Viz Lab.

## Core

- `../README.md`: project overview, setup, scripts, and runtime config.
- `runbook.md`: local/dev/CI operational runbook.
- `architecture.md`: architecture boundaries, topology, and non-functional constraints.
- `deploy.md`: Vercel/Cloudflare deployment steps.
- `quality-dashboard.md`: quality artifact generation and interpretation.

## Release and Incident

- `release-checklist.md`: pre-release checklist.
- `rollback-checklist.md`: rollback execution checklist.
- `auth-rollout-checklist.md`: auth cutover checklist.
- `auth-incident-playbook.md`: auth incident response playbook.
- `templates/incident.md`: incident document template.

## Planning

- `../PLAN.md`: phase roadmap summary.
- `roadmap/phase-01-foundation.md`
- `roadmap/phase-02-data-experience.md`
- `roadmap/phase-03-collaboration.md`
- `roadmap/phase-04-security-governance.md`
- `roadmap/phase-05-extensibility.md`
- `roadmap/phase-06-productionization.md`

## ADRs

- `adr/0001-test-framework.md`
- `adr/ADR-001-state-strategy.md`
- `adr/ADR-002-realtime-transport.md`

## Documentation Rules

- Keep commands aligned with `package.json` scripts.
- Prefer concise, executable instructions over long narrative text.
- When CI gates or runtime flags change, update at least:
  - `../README.md`
  - `../CONTRIBUTING.md`
  - `runbook.md`
  - relevant checklist/ADR/roadmap docs
