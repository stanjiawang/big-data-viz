# Phase 01: Product Foundation Hardening

## Goal

Create a stable, testable state and interaction foundation so later features (saved views, realtime, collaboration) can be added without regressions.

## Scope

In:

- Dashboard state contract normalization.
- Storage + URL synchronization hardening.
- Card/detail interaction consistency.
- Tests for state restore and cross-page consistency.

Out:

- Realtime transport.
- Backend persistence.
- Multi-user collaboration.

## Delivery Slices

### Slice 1: State Contract Baseline

- Define canonical dashboard state shape and defaults.
- Add parser/serializer invariants and edge-case tests.
- Ensure storage availability failures degrade gracefully.

Acceptance:

- All parse/sync tests pass.
- No runtime exceptions when storage is unavailable.

### Slice 2: UX Contract Normalization

- Normalize action button behavior across overview/detail cards.
- Align open-detail, export-image, and reset action semantics.

Acceptance:

- E2E confirms all cards support consistent action flows.

### Slice 3: Stability Hardening

- Eliminate flaky selectors in e2e for locale/label-sensitive text.
- Add deterministic test helpers for dashboard cards.

Acceptance:

- CI e2e pass-rate >= 99% over repeated runs.

## Risks

- Existing tests depend on exact text; normalizing contracts may require broad test updates.

## Dependencies

- ADR-001 (state strategy).
