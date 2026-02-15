# ADR-002: Realtime Transport Abstraction

## Status

Proposed

## Context

Realtime mode is a roadmap requirement, but deployment environments may differ (SSE-only, WebSocket-enabled, or mocked stream).

## Decision

Introduce a transport abstraction with pluggable adapters:

- `mock-stream` for deterministic local/testing.
- `sse-stream` for baseline production compatibility.
- `ws-stream` optional adapter for high-throughput deployments.

UI components consume a common stream interface and are transport-agnostic.

## Consequences

Pros:

- Environment flexibility.
- Easier testing and fallback behavior.
- Cleaner future backend integration.

Cons:

- Additional abstraction complexity.
