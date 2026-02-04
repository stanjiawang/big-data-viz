---
name: building-visualizations
description: Build performant visualization components using ECharts or deck.gl with stable props, memoized config, and predictable update behavior.
---

## When to use this

Use when the user asks to:

- add a chart (ECharts)
- add a map/layer visualization (deck.gl)
- optimize rerenders or "chart keeps reinitializing"
- create a reusable visualization component pattern

Common triggers:

- "add an ECharts chart"
- "deck.gl layer"
- "memoize chart options"
- "improve performance of chart rendering"

## What to produce

A dedicated visualization component that:

- encapsulates ECharts or deck.gl usage cleanly
- avoids unnecessary full re-init on each render
- includes loading/empty/error states (when data-driven)
- has a small public API (props)

## Requirements (ECharts)

- Keep `option` stable:
  - build it from data via `useMemo`
  - avoid recreating large objects every render
- Updates:
  - prefer updating minimal parts (follow wrapper/library patterns in repo)
- Handle resize (follow existing approach: ResizeObserver or window listener)

## Requirements (deck.gl)

- Keep `layers` stable via `useMemo`
- Avoid recreating heavy objects each render
- Prefer typed props for data/viewport/layer config
- Keep interactions accessible where possible (tooltips, focus/keyboard if applicable)

## Steps

1. Identify which library is requested (ECharts vs deck.gl).
2. Locate existing wrappers/utilities in the repo (if any) and reuse them.
3. Design a small prop API:
   - `data`, `loading`, `error`, `className`, and a minimal config override when needed
4. Implement memoization:
   - `useMemo` for options/layers
   - `useCallback` for handlers if passed down
5. Add basic tests (as feasible):
   - component renders states
   - if the repo supports mocking chart libs, add a smoke test; otherwise focus on state rendering

## Definition of done

- Component renders correctly for loading/empty/success states
- No obvious full re-init loop caused by unstable props
- Minimal and clean public API
- No unrelated reformatting
