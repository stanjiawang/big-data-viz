---
name: scaffolding-component
description: Scaffold a React + TypeScript component with Tailwind styling and Vitest + Testing Library tests.
---

## When to use this

Use when the user asks to create a new reusable UI component, refactor a component into a clean structure, or wants a component template consistent with this repo.

Common triggers:

- "create a new component"
- "scaffold a component"
- "add a reusable UI component"
- "split component and tests"
- "make a component template for Tailwind + TS"

## What to produce

Create a small, predictable component module using ONLY the existing stack:

- React + TypeScript
- Tailwind CSS (no new CSS files unless required by existing conventions)
- Vitest + Testing Library

### Output structure (prefer this)

- src/components/<ComponentName>/
  - <ComponentName>.tsx
  - index.ts
  - <ComponentName>.test.tsx

If the repo uses a different folder convention, adapt to it, but keep the 3-file pattern.

## Requirements

- Functional component + typed props (`type Props = { ... }`)
- Tailwind classes for styling
- No new dependencies
- Export from `index.ts`
- Include minimal tests:
  - renders without crashing
  - key user-visible text exists
  - basic interaction (if component has callbacks)

## Steps

1. Inspect the repo’s existing component patterns (naming, folder placement, export style).
2. Create the component folder and files.
3. Implement the component with:
   - clear prop types
   - default props behavior (when relevant)
   - accessible semantics (button/label/aria when needed)
4. Write tests with Testing Library:
   - prefer role/text queries
   - avoid implementation-detail assertions
5. Ensure formatting/lint expectations are respected (do not reformat unrelated code).

## Definition of done

- The component can be imported from its `index.ts`
- Tests pass for the new component
- No unrelated files changed
