# ADR-001: Dashboard State Strategy

## Status

Accepted

## Context

The platform currently mixes URL state, local storage, and component-local state. Feature growth requires a clear contract to prevent divergence and regressions.

## Decision

Use a layered state strategy:

1. URL state for shareable analysis context.
2. Local storage for user preferences and persisted dashboard ergonomics.
3. Component local state for transient interaction-only values.

Canonical state serializers/parsers must be unit tested and treated as stable contracts.

## Consequences

Pros:

- Predictable restore behavior.
- Share links remain first-class.
- Lower regression risk as features expand.

Cons:

- More upfront contract discipline.
- Additional test surface.
