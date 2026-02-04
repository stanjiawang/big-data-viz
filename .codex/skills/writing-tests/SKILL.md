---
name: writing-tests
description: Write or update Vitest + Testing Library tests and Playwright e2e tests aligned with the repo’s conventions.
---

## When to use this

Use when the user asks to:

- add unit/integration tests for a component/feature
- update tests after refactors
- add Playwright coverage for a critical flow
- stabilize flaky tests
- test React Query + MSW flows

Common triggers:

- "add tests for this component"
- "write Vitest tests"
- "Playwright e2e for login/checkout/…"
- "fix flaky e2e"
- "test React Query with MSW"

## What to produce

- Unit/integration tests with Vitest + Testing Library:
  - behavior-focused
  - user-event driven where relevant
  - MSW-backed for network cases
- E2E tests with Playwright for critical paths:
  - resilient selectors
  - minimal flake risk
  - clear setup/teardown

## Requirements (Vitest + Testing Library)

- Prefer `screen.getByRole` / `findByRole` and accessible queries
- Avoid testing internal implementation details
- Use MSW for API calls; mock as close to real shape as possible
- Keep tests deterministic; avoid real timers/network

## Requirements (Playwright)

- Prefer role/text/testid selectors (follow repo convention)
- Avoid brittle CSS selectors
- Keep flows short and focused
- If authentication is needed, use storageState or existing fixtures
- Add retries/timeouts only when justified; fix root cause first

## Steps

1. Identify the correct test level:
   - unit/integration (Vitest) vs e2e (Playwright)
2. Mirror existing test patterns in the repo:
   - file placement
   - setup files
   - MSW lifecycle hooks
3. Write tests:
   - cover primary happy path
   - cover one key edge case (error/empty)
4. Run relevant scripts (use repo scripts):
   - unit tests
   - e2e tests if added/changed
5. Improve readability:
   - good test names
   - small helpers instead of repetition

## Definition of done

- Tests pass locally via repo scripts
- New tests are deterministic and readable
- MSW handlers updated if API shape changed
- No unrelated changes
