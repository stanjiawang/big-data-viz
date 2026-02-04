# Engineering Rules (Vite + React + TypeScript)

## Tech Stack (must follow)

- Build: Vite
- UI: React + TypeScript
- Styling: Tailwind CSS v4 via PostCSS + @tailwindcss/postcss
- Data: TanStack React Query
- Mock: MSW
- Visualization: ECharts, deck.gl
- Perf: TanStack React Virtual for large lists/tables
- Quality: ESLint (flat config), Prettier, Stylelint, Husky + lint-staged
- Test: Vitest + Testing Library
- E2E: Playwright

## General Principles

- Prefer small, incremental diffs. Do not reformat unrelated code.
- Keep changes scoped; if refactor is needed, propose a plan first.
- Ensure type-safety: no `any` unless justified and localized.
- Avoid introducing new dependencies unless explicitly requested.

## TypeScript & React

- Use function components + hooks only.
- Prefer `type` for props, `interface` only when extending.
- Avoid inline complex types in JSX; extract to named types.
- Keep components pure; side effects go in hooks.
- For performance-sensitive components: memoize callbacks (`useCallback`) only when needed and measurable.

## Styling (Tailwind v4)

- Use Tailwind utility classes as default.
- Prefer semantic composition: extract repetitive class strings into small components or helper (`cn`).
- Do NOT add new CSS files unless absolutely necessary.
- If custom CSS is needed, use a dedicated layer and keep it minimal.
- Ensure responsive + dark mode patterns (if project uses them) stay consistent.

## Data Layer (TanStack React Query)

- Use `useQuery`/`useInfiniteQuery` with stable `queryKey` patterns.
- All network calls must go through a single `api` module (or existing convention).
- Prefer server state in React Query; local UI state in component state.
- On mutations: use `useMutation` + invalidate or update cache correctly.
- Handle loading/error/empty states explicitly.

## MSW (Mock Service Worker)

- For new endpoints, add MSW handlers that mirror real API shape.
- Keep mock data deterministic and reusable.
- Tests should use MSW for networked components when appropriate.

## Visualization (ECharts / deck.gl)

- Encapsulate charts in dedicated components.
- Avoid rerendering entire chart on every prop change:
  - Keep option object stable (memoize) and update only changed pieces.
- For deck.gl, keep layers memoized and avoid recreating heavy objects.

## Performance (TanStack React Virtual)

- Use virtualization for lists/tables that can exceed ~200 rows or heavy row rendering.
- Keep row components lightweight and memoized where it matters.
- Measure before/after with React Profiler or simple timing when asked.

## Lint / Format / Style

- ESLint: adhere to flat config. Do not disable rules globally; prefer local, minimal disables with reason.
- Prettier: formatting is enforced; do not fight it.
- Stylelint: run on style changes; follow existing rules.
- Husky/lint-staged: ensure changes pass pre-commit checks.

## Testing Standards

- Unit/integration: Vitest + Testing Library
  - Test behavior, not implementation.
  - Prefer `screen.*` queries, role-based queries, and user flows (`userEvent`).
  - Use MSW for API-dependent components.
- E2E: Playwright
  - Focus on critical flows; keep selectors resilient (role/text/testid).
- When you change behavior, update/add tests.

## Acceptance Checklist (before finishing)

- `pnpm lint` / `npm run lint` / `yarn lint` (use project’s script)
- `pnpm test` (or equivalent) passes
- Typecheck passes
- No new eslint/stylelint/prettier violations
- Update MSW handlers/tests if API shape changed
