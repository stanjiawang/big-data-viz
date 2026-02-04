---
name: building-virtual-table
description: Implement large list/table virtualization using TanStack React Virtual with a performant row renderer and predictable layout.
---

## When to use this

Use when the user asks to:

- render large tables/lists (hundreds+ rows)
- fix scroll jank
- add virtualization
- migrate a heavy list to TanStack Virtual

Common triggers:

- "virtualize this table"
- "large list performance"
- "scroll is laggy"
- "use TanStack React Virtual"

## What to produce

A virtualized list/table implementation that:

- uses TanStack React Virtual
- keeps row rendering light
- supports dynamic row heights if needed (otherwise fixed)
- has a clean separation:
  - container/virtualizer logic
  - row renderer

## Requirements

- Default to virtualization when row count can exceed ~200 or row rendering is heavy
- Keep `estimateSize` stable and realistic
- Use `overscan` thoughtfully (small but safe)
- Avoid recreating row components; memoize when meaningful
- Maintain accessibility and keyboard navigation if the table supports it
- Do not introduce new table libraries unless explicitly asked

## Steps

1. Inspect existing table/list rendering and data flow.
2. Decide:
   - fixed row height (simpler) vs dynamic measurement (only if needed)
3. Implement:
   - a scroll container with a single inner spacer element
   - map virtual items to positioned rows
4. Optimize:
   - memoize row renderer
   - avoid inline heavy computations in render
5. Add tests:
   - smoke test rendering a subset
   - optional: verify row count rendered is less than total (implementation-dependent)
6. If requested, add a small perf note:
   - what changed, why it helps, and how to validate

## Definition of done

- Scrolling is smooth for large datasets
- Rendered DOM row count is bounded by viewport + overscan
- No broken layout (headers/sticky behavior preserved if present)
- Tests pass (or updated appropriately)
