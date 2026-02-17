import { useEffect, useMemo, useState } from 'react';
import { DATASET_SIZES } from '@/features/dashboard/constants/filterOptions';
import type { DetailView } from '@/features/dashboard/sections';
import {
  parseDashboardSearchParams,
  syncDashboardSearchParams,
} from '@/features/dashboard/state/urlState';
import type { MockFilters } from '@/lib/types';

export const DEFAULT_WEIGHT_MIN = 0.5;
export const DEFAULT_WEIGHT_MAX = 2.5;
const COMPARE_ENABLED_STORAGE_KEY = 'bdv_compare_enabled';
const COMPARE_SIZE_STORAGE_KEY = 'bdv_compare_dataset_size';
const SAVED_VIEWS_STORAGE_KEY = 'bdv_saved_views';
const REALTIME_ENABLED_STORAGE_KEY = 'bdv_realtime_enabled';
const REALTIME_PAUSED_STORAGE_KEY = 'bdv_realtime_paused';
const SNAPSHOTS_STORAGE_KEY = 'bdv_snapshot_timeline';

export type DashboardSavedState = {
  datasetSizeValue: number;
  filters: MockFilters;
  compareEnabled: boolean;
  compareDatasetSizeValue: number;
};

export type DashboardSavedView = {
  id: string;
  name: string;
  state: DashboardSavedState;
  createdAt: string;
  updatedAt: string;
};

export type DashboardSnapshot = {
  id: string;
  name: string;
  state: DashboardSavedState;
  capturedAt: string;
};

function safeReadStorage(key: string): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeWriteStorage(key: string, value: string) {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore storage write failures in restricted environments
  }
}

function sanitizeSavedState(state: DashboardSavedState): DashboardSavedState {
  const datasetSize =
    DATASET_SIZES.find((option) => option.value === state.datasetSizeValue) ?? DATASET_SIZES[1];
  const compareDatasetSize =
    DATASET_SIZES.find((option) => option.value === state.compareDatasetSizeValue) ??
    DATASET_SIZES[2];

  return {
    datasetSizeValue: datasetSize.value,
    compareDatasetSizeValue: compareDatasetSize.value,
    compareEnabled: state.compareEnabled,
    filters: {
      label: state.filters.label,
      labels: state.filters.labels,
      source: state.filters.source ?? 'all',
      search: state.filters.search ?? '',
      weightMin: state.filters.weightMin,
      weightMax: state.filters.weightMax,
    },
  };
}

export function resolveInitialCompareEnabled() {
  return safeReadStorage(COMPARE_ENABLED_STORAGE_KEY) === '1';
}

export function resolveInitialCompareDatasetSize() {
  const raw = safeReadStorage(COMPARE_SIZE_STORAGE_KEY);
  const parsed = Number(raw);
  return DATASET_SIZES.find((option) => option.value === parsed) ?? DATASET_SIZES[2];
}

export function resolveInitialRealtimeEnabled() {
  return safeReadStorage(REALTIME_ENABLED_STORAGE_KEY) === '1';
}

export function resolveInitialRealtimePaused() {
  return safeReadStorage(REALTIME_PAUSED_STORAGE_KEY) === '1';
}

export function resolveSavedViews() {
  const raw = safeReadStorage(SAVED_VIEWS_STORAGE_KEY);
  if (!raw) {
    return [] as DashboardSavedView[];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [] as DashboardSavedView[];
    }

    return parsed
      .filter((view): view is DashboardSavedView => {
        if (!view || typeof view !== 'object') {
          return false;
        }
        const candidate = view as Partial<DashboardSavedView>;
        return (
          typeof candidate.id === 'string' &&
          typeof candidate.name === 'string' &&
          typeof candidate.createdAt === 'string' &&
          typeof candidate.updatedAt === 'string' &&
          typeof candidate.state === 'object' &&
          candidate.state !== null
        );
      })
      .map((view) => ({
        ...view,
        state: sanitizeSavedState(view.state),
      }));
  } catch {
    return [] as DashboardSavedView[];
  }
}

export function resolveSnapshots() {
  const raw = safeReadStorage(SNAPSHOTS_STORAGE_KEY);
  if (!raw) {
    return [] as DashboardSnapshot[];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [] as DashboardSnapshot[];
    }

    return parsed
      .filter((snapshot): snapshot is DashboardSnapshot => {
        if (!snapshot || typeof snapshot !== 'object') {
          return false;
        }
        const candidate = snapshot as Partial<DashboardSnapshot>;
        return (
          typeof candidate.id === 'string' &&
          typeof candidate.name === 'string' &&
          typeof candidate.capturedAt === 'string' &&
          typeof candidate.state === 'object' &&
          candidate.state !== null
        );
      })
      .map((snapshot) => ({
        ...snapshot,
        state: sanitizeSavedState(snapshot.state),
      }));
  } catch {
    return [] as DashboardSnapshot[];
  }
}

function createSavedState(params: {
  datasetSize: (typeof DATASET_SIZES)[number];
  filters: MockFilters;
  compareEnabled: boolean;
  compareDatasetSize: (typeof DATASET_SIZES)[number];
}): DashboardSavedState {
  return {
    datasetSizeValue: params.datasetSize.value,
    filters: { ...params.filters },
    compareEnabled: params.compareEnabled,
    compareDatasetSizeValue: params.compareDatasetSize.value,
  };
}

function applySavedState(state: DashboardSavedState) {
  const datasetSize =
    DATASET_SIZES.find((option) => option.value === state.datasetSizeValue) ?? DATASET_SIZES[1];
  const compareDatasetSize =
    DATASET_SIZES.find((option) => option.value === state.compareDatasetSizeValue) ??
    DATASET_SIZES[2];

  return {
    datasetSize,
    filters: {
      ...state.filters,
      source: state.filters.source ?? 'all',
      search: state.filters.search ?? '',
    } satisfies MockFilters,
    compareEnabled: state.compareEnabled,
    compareDatasetSize,
  };
}

export function useDashboardState() {
  const [initialUrlState] = useState(() => parseDashboardSearchParams(window.location.search));
  const [datasetSize, setDatasetSize] = useState(initialUrlState.datasetSize);
  const [detailView, setDetailView] = useState<DetailView | null>(initialUrlState.detailView);
  const [filters, setFilters] = useState<MockFilters>(initialUrlState.filters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [compareEnabled, setCompareEnabled] = useState(
    () => initialUrlState.compareEnabled ?? resolveInitialCompareEnabled(),
  );
  const [compareDatasetSize, setCompareDatasetSize] = useState(
    () => initialUrlState.compareDatasetSize ?? resolveInitialCompareDatasetSize(),
  );
  const [realtimeEnabled, setRealtimeEnabled] = useState(() => resolveInitialRealtimeEnabled());
  const [realtimePaused, setRealtimePaused] = useState(() => resolveInitialRealtimePaused());
  const [savedViews, setSavedViews] = useState<DashboardSavedView[]>(() => resolveSavedViews());
  const [activeSavedViewId, setActiveSavedViewId] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState<DashboardSnapshot[]>(() => resolveSnapshots());
  const [activeSnapshotId, setActiveSnapshotId] = useState<string | null>(null);

  useEffect(() => {
    syncDashboardSearchParams({
      datasetSize,
      detailView,
      filters,
      compareEnabled,
      compareDatasetSize,
    });
  }, [datasetSize, detailView, filters, compareEnabled, compareDatasetSize]);

  useEffect(() => {
    safeWriteStorage(COMPARE_ENABLED_STORAGE_KEY, compareEnabled ? '1' : '0');
  }, [compareEnabled]);

  useEffect(() => {
    safeWriteStorage(COMPARE_SIZE_STORAGE_KEY, String(compareDatasetSize.value));
  }, [compareDatasetSize]);

  useEffect(() => {
    safeWriteStorage(SAVED_VIEWS_STORAGE_KEY, JSON.stringify(savedViews));
  }, [savedViews]);

  useEffect(() => {
    safeWriteStorage(REALTIME_ENABLED_STORAGE_KEY, realtimeEnabled ? '1' : '0');
  }, [realtimeEnabled]);

  useEffect(() => {
    safeWriteStorage(REALTIME_PAUSED_STORAGE_KEY, realtimePaused ? '1' : '0');
  }, [realtimePaused]);

  useEffect(() => {
    safeWriteStorage(SNAPSHOTS_STORAGE_KEY, JSON.stringify(snapshots));
  }, [snapshots]);

  const currentStateSnapshot = useMemo(
    () =>
      createSavedState({
        datasetSize,
        filters,
        compareEnabled,
        compareDatasetSize,
      }),
    [datasetSize, filters, compareEnabled, compareDatasetSize],
  );

  const applySavedView = (viewId: string) => {
    const selected = savedViews.find((view) => view.id === viewId);
    if (!selected) {
      return false;
    }

    const nextState = applySavedState(selected.state);
    setDatasetSize(nextState.datasetSize);
    setFilters(nextState.filters);
    setCompareEnabled(nextState.compareEnabled);
    setCompareDatasetSize(nextState.compareDatasetSize);
    setActiveSavedViewId(viewId);
    return true;
  };

  const saveCurrentAsNewView = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      return null;
    }

    const id =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `view-${Date.now()}`;
    const now = new Date().toISOString();

    const nextView: DashboardSavedView = {
      id,
      name: trimmed,
      state: currentStateSnapshot,
      createdAt: now,
      updatedAt: now,
    };

    setSavedViews((current) => [nextView, ...current]);
    setActiveSavedViewId(id);
    return id;
  };

  const captureSnapshot = (name?: string) => {
    const id =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `snapshot-${Date.now()}`;
    const nextName = name?.trim() ? name.trim() : `Snapshot ${snapshots.length + 1}`;
    const capturedAt = new Date().toISOString();

    const nextSnapshot: DashboardSnapshot = {
      id,
      name: nextName,
      state: currentStateSnapshot,
      capturedAt,
    };

    setSnapshots((current) => [nextSnapshot, ...current].slice(0, 20));
    setActiveSnapshotId(id);
    return id;
  };

  const replaySnapshot = (snapshotId: string) => {
    const selected = snapshots.find((snapshot) => snapshot.id === snapshotId);
    if (!selected) {
      return false;
    }

    const nextState = applySavedState(selected.state);
    setDatasetSize(nextState.datasetSize);
    setFilters(nextState.filters);
    setCompareEnabled(nextState.compareEnabled);
    setCompareDatasetSize(nextState.compareDatasetSize);
    setActiveSnapshotId(snapshotId);
    return true;
  };

  const deleteActiveSnapshot = () => {
    if (!activeSnapshotId) {
      return false;
    }

    let didDelete = false;
    setSnapshots((current) =>
      current.filter((snapshot) => {
        if (snapshot.id === activeSnapshotId) {
          didDelete = true;
          return false;
        }
        return true;
      }),
    );

    if (didDelete) {
      setActiveSnapshotId(null);
    }

    return didDelete;
  };

  const clearSnapshots = () => {
    if (snapshots.length === 0) {
      return false;
    }
    setSnapshots([]);
    setActiveSnapshotId(null);
    return true;
  };

  const updateActiveSavedView = () => {
    if (!activeSavedViewId) {
      return false;
    }

    let didUpdate = false;
    setSavedViews((current) =>
      current.map((view) => {
        if (view.id !== activeSavedViewId) {
          return view;
        }
        didUpdate = true;
        return {
          ...view,
          state: currentStateSnapshot,
          updatedAt: new Date().toISOString(),
        };
      }),
    );

    return didUpdate;
  };

  const deleteActiveSavedView = () => {
    if (!activeSavedViewId) {
      return false;
    }

    let didDelete = false;
    setSavedViews((current) =>
      current.filter((view) => {
        if (view.id === activeSavedViewId) {
          didDelete = true;
          return false;
        }
        return true;
      }),
    );

    if (didDelete) {
      setActiveSavedViewId(null);
    }

    return didDelete;
  };

  return {
    datasetSize,
    setDatasetSize,
    detailView,
    setDetailView,
    filters,
    setFilters,
    isFilterOpen,
    setIsFilterOpen,
    compareEnabled,
    setCompareEnabled,
    compareDatasetSize,
    setCompareDatasetSize,
    realtimeEnabled,
    setRealtimeEnabled,
    realtimePaused,
    setRealtimePaused,
    savedViews,
    activeSavedViewId,
    setActiveSavedViewId,
    snapshots,
    activeSnapshotId,
    setActiveSnapshotId,
    currentStateSnapshot,
    applySavedView,
    saveCurrentAsNewView,
    captureSnapshot,
    replaySnapshot,
    deleteActiveSnapshot,
    clearSnapshots,
    updateActiveSavedView,
    deleteActiveSavedView,
  };
}
