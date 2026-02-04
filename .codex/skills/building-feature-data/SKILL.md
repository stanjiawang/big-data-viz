---
name: building-feature-data
description: Add a React Query data feature with consistent queryKey, API module, MSW handlers, and tests.
---

## When to use this

Use when the user asks to:

- add a new API-backed feature/page/component
- create a React Query hook for fetching/mutations
- update API shape and keep MSW + tests in sync
- add mocking for a new endpoint

Common triggers:

- "useQuery for /xyz"
- "add mutation and update cache"
- "mock this endpoint with MSW"
- "add loading/error/empty states"

## What to produce

A complete, testable data slice for a feature:

- API function(s) in the repo’s API layer (or follow existing convention)
- Query keys + hooks (`useQuery`, `useMutation`, `useInfiniteQuery` when needed)
- UI states (loading/error/empty)
- MSW handler(s) matching the API shape
- Tests using MSW

## Requirements

- Stable `queryKey` pattern:
  - Use an array key with a top-level namespace and params
  - Example: `['orders', 'list', { status, page }]`
- Keep network calls in a single API module (do not fetch directly inside components)
- For mutations:
  - update cache via `setQueryData` when safe, otherwise invalidate precise keys
- Do not add new dependencies
- MSW mocks must be deterministic and reusable

## Steps

1. Locate existing patterns:
   - where API clients live
   - where React Query client/provider is configured
   - where MSW handlers are registered
2. Implement API calls:
   - typed request/response
   - consistent error handling pattern (follow repo)
3. Implement query keys + hooks:
   - `useQuery` for reads
   - `useMutation` for writes
   - handle enabled/placeholderData/staleTime per existing patterns
4. Update UI usage:
   - explicit loading/error/empty rendering
5. Add MSW handlers:
   - mirror the real endpoint path/method
   - return realistic shape
6. Add tests:
   - covers loading -> success
   - covers error state
   - covers empty state (when applicable)
   - for mutation, assert cache update or invalidation behavior

## Definition of done

- Feature works against MSW without real backend
- Tests pass using MSW
- Query keys are stable and scoped (no over-invalidation)
- No direct `fetch`/axios inside UI components unless repo already mandates it
