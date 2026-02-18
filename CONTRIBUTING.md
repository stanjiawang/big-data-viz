# Contributing

Thanks for contributing!

## Setup

```bash
pnpm install
pnpm run dev
# or demo mode
pnpm run dev:demo
```

## Code Quality

Before opening a PR:

```bash
pnpm run lint
pnpm run check:structure
pnpm run typecheck
pnpm run format
pnpm run stylelint
pnpm test
pnpm test:e2e
pnpm run test:e2e:auth
pnpm run test:e2e:a11y
pnpm run test:perf
pnpm run test:render-perf
pnpm run quality:dashboard
pnpm run build:demo
pnpm run demo:verify
```

## i18n and Accessibility Requirements

- All new user-facing copy must be localized via `useI18n().t(...)`.
- Do not merge changes with unresolved serious/critical axe violations.
- Ensure interactive controls have accessible names and keyboard support.

## Performance Requirements

- Keep bundle budgets green (`pnpm run test:perf`).
- Keep render budgets green (`pnpm run test:render-perf`).
- Prefer code-splitting for heavy features over relaxing budgets.

## Branching

- Create feature branches from `main`
- Use concise, descriptive branch names

## Commits

- Use clear, imperative commit messages
- Keep changes scoped and reviewable

## Pull Requests

- Include screenshots for UI changes
- Note any breaking changes
- Ensure tests are green
