import { useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/auth/useAuth';
import { canAccessFeature } from '@/config/featureAccess';
import { getRuntimeConfig } from '@/config/runtimeConfig';
import {
  DEFAULT_WEIGHT_MAX,
  DEFAULT_WEIGHT_MIN,
  useDashboardState,
} from '@/features/dashboard/state/useDashboardState';
import { useRealtimeStream } from '@/features/realtime/useRealtimeStream';
import { DashboardDetailView } from '@/features/dashboard/ui/DashboardDetailView';
import { DashboardOverviewView } from '@/features/dashboard/ui/DashboardOverviewView';

export function DashboardPage() {
  const summaryCardRef = useRef<HTMLElement | null>(null);
  const summaryVisualizationRef = useRef<HTMLDivElement | null>(null);
  const runtimeConfig = getRuntimeConfig();
  const auth = useAuth();
  const queryClient = useQueryClient();

  const {
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
    applySavedView,
    saveCurrentAsNewView,
    updateActiveSavedView,
    deleteActiveSavedView,
  } = useDashboardState();

  const canUseCompareMode = canAccessFeature(
    auth.session,
    'compare_mode',
    runtimeConfig.enableAuth,
  );
  const effectiveCompareEnabled = compareEnabled && canUseCompareMode;

  const realtime = useRealtimeStream({
    enabled: realtimeEnabled,
    paused: realtimePaused,
    onTick: () => void queryClient.invalidateQueries(),
  });

  if (detailView) {
    return (
      <DashboardDetailView
        detailView={detailView}
        datasetSize={datasetSize}
        compareDatasetSize={compareDatasetSize}
        compareEnabled={effectiveCompareEnabled}
        filters={filters}
        onBackToDashboard={() => setDetailView(null)}
        summaryCardRef={summaryCardRef}
        summaryVisualizationRef={summaryVisualizationRef}
      />
    );
  }

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
      onApplySavedView={applySavedView}
      onSaveCurrentAsNewView={saveCurrentAsNewView}
      onUpdateActiveSavedView={updateActiveSavedView}
      onDeleteActiveSavedView={deleteActiveSavedView}
      onOpenDetail={setDetailView}
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
