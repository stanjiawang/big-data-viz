# Engineering Rules (Enterprise Baseline)

## Stack Contract (must remain consistent)

- Build/runtime: Vite + React + TypeScript
- Styling: Tailwind CSS v4 (+ PostCSS)
- Data/state: TanStack Query for server state
- Mock backend: MSW
- Visualization: ECharts, deck.gl, Sigma.js, D3
- Virtualization: TanStack Virtual
- i18n: `react-intl` with typed message keys
- Quality: ESLint, Prettier, Stylelint, Husky, lint-staged
- Testing: Jest + Testing Library, Playwright, axe-core Playwright

## Core Engineering Principles

- Ship small, reviewable, low-risk diffs.
- Do not reformat or refactor unrelated code.
- Keep strict type safety; avoid `any` unless justified and localized.
- Prefer determinism over convenience in test and mock behavior.
- All user-facing copy must be localization-ready.
- Accessibility is a release requirement, not an optional enhancement.

## Architecture Boundaries

- `src/app`: bootstrap, top-level providers, runtime wiring
- `src/config`: env/runtime config parsing and validation
- `src/lib`: API transport, schemas, contracts, telemetry helpers
- `src/features`: domain modules and feature UIs
- `src/components`: reusable UI primitives only
- `src/i18n`: locale catalogs, i18n provider/hook
- `src/mocks`: MSW handlers only

Do not move logic across boundaries without a clear architectural reason.

## React + TypeScript Rules

- Function components and hooks only.
- Prefer `type` aliases for props and local model types.
- Extract complex inline JSX types into named types.
- Keep side effects in hooks; keep render functions pure.
- Memoize only when profiling or known hotspots justify it.
- Lazy-load heavy feature modules where it improves bundle composition.

## Data and API Rules

- All HTTP calls go through `src/lib/httpClient.ts` and `src/lib/apiClient.ts`.
- Maintain schema validation for API payloads (`zod` contracts).
- Preserve error taxonomy (`ApiError` codes) and telemetry context.
- Query keys must be stable and colocated with query hooks.
- Handle loading, empty, and error states explicitly in UI.

## i18n Rules

- New UI strings must use `useI18n().t(...)`.
- Do not hardcode user-facing English strings in feature components.
- Add keys to `src/i18n/messages.ts` for all supported locales.
- Preserve fallback behavior (`defaultMessage`) for resilience.

## Accessibility Rules

- Require semantic landmarks (`main`, labeled `section`, dialog semantics).
- All interactive controls need accessible names.
- Scrollable custom regions must be keyboard-focusable when required.
- Maintain color contrast at WCAG AA minimum for default text sizes.
- Keep axe serious/critical violations at zero for covered flows.

## Visualization and Table Rules

- Keep chart rendering encapsulated in feature-level components.
- Avoid unnecessary full re-renders of heavy chart layers.
- Virtualized table interactions must remain keyboard and screen-reader aware.
- Export/download features must capture visualization content only.

## Performance Rules

- Keep production bundle budgets green (`test:perf`).
- Keep render budgets green (`test:render-perf`).
- Prefer code-splitting for large vendor/features over budget inflation.
- Avoid increasing main entry chunk unless justified and approved.

## Security and Auth Rules

- Auth behavior must remain feature-flagged and runtime-configurable.
- Do not log secrets, tokens, or PII in client logs/tests.
- Preserve RBAC and tenant-context checks for privileged workflows.
- Keep auth lifecycle telemetry and failure handling intact.

## Testing and CI Rules

- Update or add tests whenever behavior changes.
- Unit/integration tests:
  - Test user-observable behavior.
  - Prefer role-based queries and `userEvent`.
- E2E tests:
  - Use resilient selectors (`role`, `text`, `data-testid`).
  - Keep i18n-safe checks where possible.
- Required local pass before handoff:
  - `pnpm run lint`
  - `pnpm run typecheck`
  - `pnpm test`
  - `pnpm run test:e2e`
  - `pnpm run test:e2e:a11y`
  - `pnpm run test:perf`
  - `pnpm run test:render-perf`

## Dependency and Tooling Policy

- No new dependencies without clear benefit and validation impact analysis.
- Keep lockfile updates intentional and scoped.
- If a dependency affects Jest/Playwright runtime semantics, add coverage.

## Documentation Policy

- When behavior, scripts, or gates change, update:
  - `README.md`
  - `CONTRIBUTING.md`
  - `docs/runbook.md`
  - relevant checklists/changelog entries
