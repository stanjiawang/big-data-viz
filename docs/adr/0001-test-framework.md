# ADR-0001: Standardize on Jest for Unit/Integration Tests

## Status

Accepted

## Context

Project documentation referenced Vitest, while implementation and CI use Jest.

## Decision

Adopt Jest as the single test runner for unit/integration tests in the current codebase.

## Consequences

- Documentation and contributor instructions must reference Jest.
- CI remains unchanged for test runner execution.
- Future migration to Vitest requires a separate ADR and migration plan.
