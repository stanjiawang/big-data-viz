import { useCallback, useEffect, useMemo, type SetStateAction } from 'react';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { DATASET_SIZES } from '@/features/dashboard/constants/filterOptions';
import type { DashboardAnnotationContext, DetailView } from '@/features/dashboard/sections';
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
const ANNOTATIONS_STORAGE_KEY = 'bdv_dashboard_annotations';
const INTERACTION_MODE_STORAGE_KEY = 'bdv_interaction_mode';

export type DashboardInteractionMode = 'isolated' | 'linked';

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

export type DashboardAnnotation = {
  id: string;
  context: DashboardAnnotationContext;
  message: string;
  createdAt: string;
  updatedAt: string;
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

export function resolveInitialInteractionMode(): DashboardInteractionMode {
  return safeReadStorage(INTERACTION_MODE_STORAGE_KEY) === 'linked' ? 'linked' : 'isolated';
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

export function resolveAnnotations() {
  const raw = safeReadStorage(ANNOTATIONS_STORAGE_KEY);
  if (!raw) {
    return [] as DashboardAnnotation[];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [] as DashboardAnnotation[];
    }

    const allowed = new Set<DashboardAnnotationContext>([
      'summary',
      'timeSeries',
      'embedding',
      'graph',
      'd3',
      'tablePrimary',
      'tableCompare',
    ]);

    return parsed.filter((annotation): annotation is DashboardAnnotation => {
      if (!annotation || typeof annotation !== 'object') {
        return false;
      }
      const candidate = annotation as Partial<DashboardAnnotation>;
      return (
        typeof candidate.id === 'string' &&
        typeof candidate.message === 'string' &&
        typeof candidate.createdAt === 'string' &&
        typeof candidate.updatedAt === 'string' &&
        typeof candidate.context === 'string' &&
        allowed.has(candidate.context as DashboardAnnotationContext)
      );
    });
  } catch {
    return [] as DashboardAnnotation[];
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

function applyStateAction<T>(current: T, next: SetStateAction<T>) {
  return typeof next === 'function' ? (next as (_prev: T) => T)(current) : next;
}

function resolveInitialUrlState() {
  if (typeof window === 'undefined') {
    return {
      datasetSize: DATASET_SIZES[1],
      detailView: null,
      filters: {
        source: 'all',
        search: '',
      } satisfies MockFilters,
      compareEnabled: undefined,
      compareDatasetSize: undefined,
    };
  }
  return parseDashboardSearchParams(window.location.search);
}

type DashboardStoreState = {
  datasetSize: (typeof DATASET_SIZES)[number];
  detailView: DetailView | null;
  filters: MockFilters;
  isFilterOpen: boolean;
  compareEnabled: boolean;
  compareDatasetSize: (typeof DATASET_SIZES)[number];
  realtimeEnabled: boolean;
  realtimePaused: boolean;
  interactionMode: DashboardInteractionMode;
  savedViews: DashboardSavedView[];
  activeSavedViewId: string | null;
  snapshots: DashboardSnapshot[];
  activeSnapshotId: string | null;
  annotations: DashboardAnnotation[];
  activeAnnotationContext: DashboardAnnotationContext;
  setDatasetSize: (_next: SetStateAction<(typeof DATASET_SIZES)[number]>) => void;
  setDetailView: (_next: SetStateAction<DetailView | null>) => void;
  setFilters: (_next: SetStateAction<MockFilters>) => void;
  setIsFilterOpen: (_next: SetStateAction<boolean>) => void;
  setCompareEnabled: (_next: SetStateAction<boolean>) => void;
  setCompareDatasetSize: (_next: SetStateAction<(typeof DATASET_SIZES)[number]>) => void;
  setRealtimeEnabled: (_next: SetStateAction<boolean>) => void;
  setRealtimePaused: (_next: SetStateAction<boolean>) => void;
  setInteractionMode: (_next: SetStateAction<DashboardInteractionMode>) => void;
  setSavedViews: (_next: SetStateAction<DashboardSavedView[]>) => void;
  setActiveSavedViewId: (_next: SetStateAction<string | null>) => void;
  setSnapshots: (_next: SetStateAction<DashboardSnapshot[]>) => void;
  setActiveSnapshotId: (_next: SetStateAction<string | null>) => void;
  setAnnotations: (_next: SetStateAction<DashboardAnnotation[]>) => void;
  setActiveAnnotationContext: (_next: SetStateAction<DashboardAnnotationContext>) => void;
};

const initialUrlState = resolveInitialUrlState();

const useDashboardStore = create<DashboardStoreState>((set) => ({
  datasetSize: initialUrlState.datasetSize,
  detailView: initialUrlState.detailView,
  filters: initialUrlState.filters,
  isFilterOpen: false,
  compareEnabled: initialUrlState.compareEnabled ?? resolveInitialCompareEnabled(),
  compareDatasetSize: initialUrlState.compareDatasetSize ?? resolveInitialCompareDatasetSize(),
  realtimeEnabled: resolveInitialRealtimeEnabled(),
  realtimePaused: resolveInitialRealtimePaused(),
  interactionMode: resolveInitialInteractionMode(),
  savedViews: resolveSavedViews(),
  activeSavedViewId: null,
  snapshots: resolveSnapshots(),
  activeSnapshotId: null,
  annotations: resolveAnnotations(),
  activeAnnotationContext: 'summary',
  setDatasetSize: (next) =>
    set((state) => ({
      datasetSize: applyStateAction(state.datasetSize, next),
    })),
  setDetailView: (next) =>
    set((state) => ({
      detailView: applyStateAction(state.detailView, next),
    })),
  setFilters: (next) =>
    set((state) => ({
      filters: applyStateAction(state.filters, next),
    })),
  setIsFilterOpen: (next) =>
    set((state) => ({
      isFilterOpen: applyStateAction(state.isFilterOpen, next),
    })),
  setCompareEnabled: (next) =>
    set((state) => ({
      compareEnabled: applyStateAction(state.compareEnabled, next),
    })),
  setCompareDatasetSize: (next) =>
    set((state) => ({
      compareDatasetSize: applyStateAction(state.compareDatasetSize, next),
    })),
  setRealtimeEnabled: (next) =>
    set((state) => ({
      realtimeEnabled: applyStateAction(state.realtimeEnabled, next),
    })),
  setRealtimePaused: (next) =>
    set((state) => ({
      realtimePaused: applyStateAction(state.realtimePaused, next),
    })),
  setInteractionMode: (next) =>
    set((state) => {
      const interactionMode = applyStateAction(state.interactionMode, next);
      safeWriteStorage(INTERACTION_MODE_STORAGE_KEY, interactionMode);
      return { interactionMode };
    }),
  setSavedViews: (next) =>
    set((state) => ({
      savedViews: applyStateAction(state.savedViews, next),
    })),
  setActiveSavedViewId: (next) =>
    set((state) => ({
      activeSavedViewId: applyStateAction(state.activeSavedViewId, next),
    })),
  setSnapshots: (next) =>
    set((state) => ({
      snapshots: applyStateAction(state.snapshots, next),
    })),
  setActiveSnapshotId: (next) =>
    set((state) => ({
      activeSnapshotId: applyStateAction(state.activeSnapshotId, next),
    })),
  setAnnotations: (next) =>
    set((state) => ({
      annotations: applyStateAction(state.annotations, next),
    })),
  setActiveAnnotationContext: (next) =>
    set((state) => ({
      activeAnnotationContext: applyStateAction(state.activeAnnotationContext, next),
    })),
}));

export function useDashboardState() {
  const { datasetSize, setDatasetSize, detailView, setDetailView } = useDashboardNavigationState();
  const { filters, setFilters, isFilterOpen, setIsFilterOpen } = useDashboardFilterPanelState();
  const { compareEnabled, setCompareEnabled, compareDatasetSize, setCompareDatasetSize } =
    useDashboardCompareState();
  const { realtimeEnabled, setRealtimeEnabled, realtimePaused, setRealtimePaused } =
    useDashboardRealtimeState();
  const { savedViews, setSavedViews, activeSavedViewId, setActiveSavedViewId } =
    useDashboardSavedViewsState();
  const { snapshots, setSnapshots, activeSnapshotId, setActiveSnapshotId } =
    useDashboardSnapshotsState();
  const { annotations, setAnnotations, activeAnnotationContext, setActiveAnnotationContext } =
    useDashboardAnnotationsState();

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

  useEffect(() => {
    safeWriteStorage(ANNOTATIONS_STORAGE_KEY, JSON.stringify(annotations));
  }, [annotations]);

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

  const createAnnotation = (context: DashboardAnnotationContext, message: string) => {
    const trimmed = message.trim();
    if (!trimmed) {
      return null;
    }

    const id =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `annotation-${Date.now()}`;
    const now = new Date().toISOString();

    const nextAnnotation: DashboardAnnotation = {
      id,
      context,
      message: trimmed,
      createdAt: now,
      updatedAt: now,
    };

    setAnnotations((current) => [nextAnnotation, ...current].slice(0, 100));
    setActiveAnnotationContext(context);
    return id;
  };

  const deleteAnnotation = (annotationId: string) => {
    let didDelete = false;
    setAnnotations((current) =>
      current.filter((annotation) => {
        if (annotation.id === annotationId) {
          didDelete = true;
          return false;
        }
        return true;
      }),
    );
    return didDelete;
  };

  const clearAnnotationsForContext = (context: DashboardAnnotationContext) => {
    let didClear = false;
    setAnnotations((current) => {
      const next = current.filter((annotation) => {
        if (annotation.context === context) {
          didClear = true;
          return false;
        }
        return true;
      });
      return next;
    });
    return didClear;
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
    annotations,
    activeAnnotationContext,
    setActiveAnnotationContext,
    currentStateSnapshot,
    applySavedView,
    saveCurrentAsNewView,
    captureSnapshot,
    replaySnapshot,
    deleteActiveSnapshot,
    clearSnapshots,
    createAnnotation,
    deleteAnnotation,
    clearAnnotationsForContext,
    updateActiveSavedView,
    deleteActiveSavedView,
  };
}

export function useDashboardNavigationState() {
  return useDashboardStore(
    useShallow((state) => ({
      datasetSize: state.datasetSize,
      setDatasetSize: state.setDatasetSize,
      detailView: state.detailView,
      setDetailView: state.setDetailView,
    })),
  );
}

export function useDashboardFilterPanelState() {
  return useDashboardStore(
    useShallow((state) => ({
      filters: state.filters,
      setFilters: state.setFilters,
      isFilterOpen: state.isFilterOpen,
      setIsFilterOpen: state.setIsFilterOpen,
    })),
  );
}

export function useDashboardCompareState() {
  return useDashboardStore(
    useShallow((state) => ({
      compareEnabled: state.compareEnabled,
      setCompareEnabled: state.setCompareEnabled,
      compareDatasetSize: state.compareDatasetSize,
      setCompareDatasetSize: state.setCompareDatasetSize,
    })),
  );
}

export function useDashboardRealtimeState() {
  return useDashboardStore(
    useShallow((state) => ({
      realtimeEnabled: state.realtimeEnabled,
      setRealtimeEnabled: state.setRealtimeEnabled,
      realtimePaused: state.realtimePaused,
      setRealtimePaused: state.setRealtimePaused,
    })),
  );
}

export function useDashboardInteractionModeState() {
  return useDashboardStore(
    useShallow((state) => ({
      interactionMode: state.interactionMode,
      setInteractionMode: state.setInteractionMode,
    })),
  );
}

export function useDashboardSavedViewsState() {
  return useDashboardStore(
    useShallow((state) => ({
      savedViews: state.savedViews,
      setSavedViews: state.setSavedViews,
      activeSavedViewId: state.activeSavedViewId,
      setActiveSavedViewId: state.setActiveSavedViewId,
    })),
  );
}

export function useDashboardSnapshotsState() {
  return useDashboardStore(
    useShallow((state) => ({
      snapshots: state.snapshots,
      setSnapshots: state.setSnapshots,
      activeSnapshotId: state.activeSnapshotId,
      setActiveSnapshotId: state.setActiveSnapshotId,
    })),
  );
}

export function useDashboardAnnotationsState() {
  return useDashboardStore(
    useShallow((state) => ({
      annotations: state.annotations,
      setAnnotations: state.setAnnotations,
      activeAnnotationContext: state.activeAnnotationContext,
      setActiveAnnotationContext: state.setActiveAnnotationContext,
    })),
  );
}

export function useDashboardActions() {
  const applySavedView = useCallback((viewId: string) => {
    const state = useDashboardStore.getState();
    const selected = state.savedViews.find((view) => view.id === viewId);
    if (!selected) {
      return false;
    }

    const nextState = applySavedState(selected.state);
    state.setDatasetSize(nextState.datasetSize);
    state.setFilters(nextState.filters);
    state.setCompareEnabled(nextState.compareEnabled);
    state.setCompareDatasetSize(nextState.compareDatasetSize);
    state.setActiveSavedViewId(viewId);
    return true;
  }, []);

  const saveCurrentAsNewView = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      return null;
    }

    const state = useDashboardStore.getState();
    const id =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `view-${Date.now()}`;
    const now = new Date().toISOString();
    const currentStateSnapshot = createSavedState({
      datasetSize: state.datasetSize,
      filters: state.filters,
      compareEnabled: state.compareEnabled,
      compareDatasetSize: state.compareDatasetSize,
    });

    const nextView: DashboardSavedView = {
      id,
      name: trimmed,
      state: currentStateSnapshot,
      createdAt: now,
      updatedAt: now,
    };

    state.setSavedViews((current) => [nextView, ...current]);
    state.setActiveSavedViewId(id);
    return id;
  }, []);

  const captureSnapshot = useCallback((name?: string) => {
    const state = useDashboardStore.getState();
    const id =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `snapshot-${Date.now()}`;
    const nextName = name?.trim() ? name.trim() : `Snapshot ${state.snapshots.length + 1}`;
    const capturedAt = new Date().toISOString();
    const currentStateSnapshot = createSavedState({
      datasetSize: state.datasetSize,
      filters: state.filters,
      compareEnabled: state.compareEnabled,
      compareDatasetSize: state.compareDatasetSize,
    });

    const nextSnapshot: DashboardSnapshot = {
      id,
      name: nextName,
      state: currentStateSnapshot,
      capturedAt,
    };

    state.setSnapshots((current) => [nextSnapshot, ...current].slice(0, 20));
    state.setActiveSnapshotId(id);
    return id;
  }, []);

  const replaySnapshot = useCallback((snapshotId: string) => {
    const state = useDashboardStore.getState();
    const selected = state.snapshots.find((snapshot) => snapshot.id === snapshotId);
    if (!selected) {
      return false;
    }

    const nextState = applySavedState(selected.state);
    state.setDatasetSize(nextState.datasetSize);
    state.setFilters(nextState.filters);
    state.setCompareEnabled(nextState.compareEnabled);
    state.setCompareDatasetSize(nextState.compareDatasetSize);
    state.setActiveSnapshotId(snapshotId);
    return true;
  }, []);

  const deleteActiveSnapshot = useCallback(() => {
    const state = useDashboardStore.getState();
    const activeSnapshotId = state.activeSnapshotId;
    if (!activeSnapshotId) {
      return false;
    }

    let didDelete = false;
    state.setSnapshots((current) =>
      current.filter((snapshot) => {
        if (snapshot.id === activeSnapshotId) {
          didDelete = true;
          return false;
        }
        return true;
      }),
    );

    if (didDelete) {
      state.setActiveSnapshotId(null);
    }

    return didDelete;
  }, []);

  const clearSnapshots = useCallback(() => {
    const state = useDashboardStore.getState();
    if (state.snapshots.length === 0) {
      return false;
    }
    state.setSnapshots([]);
    state.setActiveSnapshotId(null);
    return true;
  }, []);

  const createAnnotation = useCallback((context: DashboardAnnotationContext, message: string) => {
    const trimmed = message.trim();
    if (!trimmed) {
      return null;
    }

    const state = useDashboardStore.getState();
    const id =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `annotation-${Date.now()}`;
    const now = new Date().toISOString();

    const nextAnnotation: DashboardAnnotation = {
      id,
      context,
      message: trimmed,
      createdAt: now,
      updatedAt: now,
    };

    state.setAnnotations((current) => [nextAnnotation, ...current].slice(0, 100));
    state.setActiveAnnotationContext(context);
    return id;
  }, []);

  const deleteAnnotation = useCallback((annotationId: string) => {
    const state = useDashboardStore.getState();
    let didDelete = false;
    state.setAnnotations((current) =>
      current.filter((annotation) => {
        if (annotation.id === annotationId) {
          didDelete = true;
          return false;
        }
        return true;
      }),
    );
    return didDelete;
  }, []);

  const clearAnnotationsForContext = useCallback((context: DashboardAnnotationContext) => {
    const state = useDashboardStore.getState();
    let didClear = false;
    state.setAnnotations((current) => {
      const next = current.filter((annotation) => {
        if (annotation.context === context) {
          didClear = true;
          return false;
        }
        return true;
      });
      return next;
    });
    return didClear;
  }, []);

  const updateActiveSavedView = useCallback(() => {
    const state = useDashboardStore.getState();
    const activeSavedViewId = state.activeSavedViewId;
    if (!activeSavedViewId) {
      return false;
    }

    const currentStateSnapshot = createSavedState({
      datasetSize: state.datasetSize,
      filters: state.filters,
      compareEnabled: state.compareEnabled,
      compareDatasetSize: state.compareDatasetSize,
    });

    let didUpdate = false;
    state.setSavedViews((current) =>
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
  }, []);

  const deleteActiveSavedView = useCallback(() => {
    const state = useDashboardStore.getState();
    const activeSavedViewId = state.activeSavedViewId;
    if (!activeSavedViewId) {
      return false;
    }

    let didDelete = false;
    state.setSavedViews((current) =>
      current.filter((view) => {
        if (view.id === activeSavedViewId) {
          didDelete = true;
          return false;
        }
        return true;
      }),
    );

    if (didDelete) {
      state.setActiveSavedViewId(null);
    }

    return didDelete;
  }, []);

  return {
    applySavedView,
    saveCurrentAsNewView,
    captureSnapshot,
    replaySnapshot,
    deleteActiveSnapshot,
    clearSnapshots,
    createAnnotation,
    deleteAnnotation,
    clearAnnotationsForContext,
    updateActiveSavedView,
    deleteActiveSavedView,
  };
}
