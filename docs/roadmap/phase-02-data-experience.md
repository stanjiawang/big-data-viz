# Phase 02: Data Workflow Features

## Goal

Enable analysts to save, restore, and share dashboard analysis context.

## Scope

In:

- Saved Views UI and state model.
- Share-link generation for full context.
- Cross-filter interactions between summary/time series/graph/table.

Out:

- Team collaboration threads.
- Realtime ingest.

## Delivery Slices

### Slice 1: Saved Views (Local-first)

- Create/update/delete saved views in local storage.
- Mark one default saved view.

### Slice 2: Shareable Context Links

- Serialize full dashboard state into URL-safe form.
- Add copy-link action and restore logic.

### Slice 3: Cross-Filtering

- Click interaction on chart/graph marks updates global filters.
- Show active filter chips and clear-all action.

## Acceptance

- Saved views restore all supported state dimensions.
- Shared links reproduce analysis state end-to-end.
- Cross-filter changes reflect in all affected sections.

## Dependencies

- Phase 01 complete.
- ADR-001 state strategy finalized.
