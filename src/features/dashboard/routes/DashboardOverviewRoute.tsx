import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/auth/useAuth';
import { canAccessFeature } from '@/config/featureAccess';
import { getRuntimeConfig } from '@/config/runtimeConfig';
import {
  DEFAULT_WEIGHT_MAX,
  DEFAULT_WEIGHT_MIN,
  useDashboardAnnotationsState,
  useDashboardActions,
  useDashboardCompareState,
  useDashboardFilterPanelState,
  useDashboardNavigationState,
  useDashboardRealtimeState,
  useDashboardSavedViewsState,
  useDashboardSnapshotsState,
} from '@/features/dashboard/state/useDashboardState';
import type { DetailView } from '@/features/dashboard/sections';
import { useRealtimeStream } from '@/features/realtime/useRealtimeStream';
import { DashboardOverviewView } from '@/features/dashboard/ui/DashboardOverviewView';

const DASHBOARD_QUERY_KEYS = [['mock-data'], ['timeseries'], ['graph']] as const;

export function DashboardOverviewRoute() {
  const navigate = useNavigate();
  const summaryCardRef = useRef<HTMLElement | null>(null);
  const summaryVisualizationRef = useRef<HTMLDivElement | null>(null);
  const runtimeConfig = getRuntimeConfig();
  const auth = useAuth();
  const queryClient = useQueryClient();

  const { datasetSize, setDatasetSize, setDetailView } = useDashboardNavigationState();
  const { filters, setFilters, isFilterOpen, setIsFilterOpen } = useDashboardFilterPanelState();
  const { compareEnabled, setCompareEnabled, compareDatasetSize, setCompareDatasetSize } =
    useDashboardCompareState();
  const { realtimeEnabled, setRealtimeEnabled, realtimePaused, setRealtimePaused } =
    useDashboardRealtimeState();
  const { savedViews, activeSavedViewId, setActiveSavedViewId } = useDashboardSavedViewsState();
  const { snapshots, activeSnapshotId, setActiveSnapshotId } = useDashboardSnapshotsState();
  const { annotations, activeAnnotationContext, setActiveAnnotationContext } =
    useDashboardAnnotationsState();
  const {
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
  } = useDashboardActions();

  const canUseCompareMode = canAccessFeature(
    auth.session,
    'compare_mode',
    runtimeConfig.enableAuth,
  );

  const realtime = useRealtimeStream({
    enabled: realtimeEnabled,
    paused: realtimePaused,
    onTick: () => {
      DASHBOARD_QUERY_KEYS.forEach((queryKey) => {
        void queryClient.invalidateQueries({ queryKey });
      });
    },
  });

  const openDetail = (view: DetailView) => {
    setDetailView(view);
    navigate(`/detail/${view}`);
  };

  return (
    <DashboardOverviewView
      runtimeEnableAuth={runtimeConfig.enableAuth}
      isAuthenticated={auth.isAuthenticated}
      onSignOut={auth.signOut}
      datasetSize={datasetSize}
      setDatasetSize={setDatasetSize}
      filters={filters}
      setFilters={setFilters}
      compareEnabled={compareEnabled}
      setCompareEnabled={setCompareEnabled}
      compareDatasetSize={compareDatasetSize}
      setCompareDatasetSize={setCompareDatasetSize}
      canUseCompareMode={canUseCompareMode}
      realtimeEnabled={realtimeEnabled}
      setRealtimeEnabled={setRealtimeEnabled}
      realtimePaused={realtimePaused}
      setRealtimePaused={setRealtimePaused}
      realtimeStatus={realtime.status}
      savedViews={savedViews}
      activeSavedViewId={activeSavedViewId}
      setActiveSavedViewId={setActiveSavedViewId}
      snapshots={snapshots}
      activeSnapshotId={activeSnapshotId}
      setActiveSnapshotId={setActiveSnapshotId}
      annotations={annotations}
      activeAnnotationContext={activeAnnotationContext}
      setActiveAnnotationContext={setActiveAnnotationContext}
      onApplySavedView={applySavedView}
      onSaveCurrentAsNewView={saveCurrentAsNewView}
      onCaptureSnapshot={captureSnapshot}
      onReplaySnapshot={replaySnapshot}
      onDeleteActiveSnapshot={deleteActiveSnapshot}
      onClearSnapshots={clearSnapshots}
      onCreateAnnotation={createAnnotation}
      onDeleteAnnotation={deleteAnnotation}
      onClearAnnotationsForContext={clearAnnotationsForContext}
      onUpdateActiveSavedView={updateActiveSavedView}
      onDeleteActiveSavedView={deleteActiveSavedView}
      onOpenDetail={openDetail}
      isFilterOpen={isFilterOpen}
      onOpenFilters={() => setIsFilterOpen(true)}
      onCloseFilters={() => setIsFilterOpen(false)}
      summaryCardRef={summaryCardRef}
      summaryVisualizationRef={summaryVisualizationRef}
      defaultWeightMin={DEFAULT_WEIGHT_MIN}
      defaultWeightMax={DEFAULT_WEIGHT_MAX}
    />
  );
}
