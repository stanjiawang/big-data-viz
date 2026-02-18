import {
  useCallback,
  useDeferredValue,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from 'react';
import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/PageHeader';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { UI_BUTTON_GHOST_SM, UI_LABEL_CLASS } from '@/components/ui/styleTokens';
import { invalidateDashboardQueries } from '@/features/dashboard/constants/queryInvalidation';
import type {
  CrossFilterPatch,
  DashboardAnnotationContext,
  DetailView,
} from '@/features/dashboard/sections/types';
import type { RealtimeStatus } from '@/features/realtime/useRealtimeStream';
import type {
  DashboardSavedView,
  DashboardAnnotation,
  DashboardInteractionMode,
  DashboardSnapshot,
} from '@/features/dashboard/state/useDashboardState';
import { DashboardHeaderBadges } from '@/features/dashboard/ui/DashboardHeaderBadges';
import { FiltersPanel } from '@/features/dashboard/ui/FiltersPanel';
import { DashboardControlPanel } from '@/features/dashboard/ui/DashboardControlPanel';
import { DashboardDataSections } from '@/features/dashboard/ui/DashboardDataSections';
import type { DatasetSizeOption } from '@/features/dashboard/ui/types';
import { useI18n } from '@/i18n/useI18n';
import type { MockFilters } from '@/lib/types';

const ACTION_BUTTON_CLASS = UI_BUTTON_GHOST_SM;

type DashboardOverviewViewProps = {
  runtimeEnableAuth: boolean;
  isAuthenticated: boolean;
  onSignOut: () => Promise<void>;
  datasetSize: DatasetSizeOption;
  setDatasetSize: Dispatch<SetStateAction<DatasetSizeOption>>;
  filters: MockFilters;
  setFilters: Dispatch<SetStateAction<MockFilters>>;
  compareEnabled: boolean;
  setCompareEnabled: Dispatch<SetStateAction<boolean>>;
  compareDatasetSize: DatasetSizeOption;
  setCompareDatasetSize: Dispatch<SetStateAction<DatasetSizeOption>>;
  canUseCompareMode: boolean;
  realtimeEnabled: boolean;
  setRealtimeEnabled: Dispatch<SetStateAction<boolean>>;
  realtimePaused: boolean;
  setRealtimePaused: Dispatch<SetStateAction<boolean>>;
  realtimeStatus: RealtimeStatus;
  interactionMode: DashboardInteractionMode;
  setInteractionMode: Dispatch<SetStateAction<DashboardInteractionMode>>;
  savedViews: DashboardSavedView[];
  activeSavedViewId: string | null;
  setActiveSavedViewId: Dispatch<SetStateAction<string | null>>;
  snapshots: DashboardSnapshot[];
  activeSnapshotId: string | null;
  setActiveSnapshotId: Dispatch<SetStateAction<string | null>>;
  annotations: DashboardAnnotation[];
  activeAnnotationContext: DashboardAnnotationContext;
  setActiveAnnotationContext: Dispatch<SetStateAction<DashboardAnnotationContext>>;
  onApplySavedView: (_viewId: string) => boolean;
  onSaveCurrentAsNewView: (_name: string) => string | null;
  onCaptureSnapshot: (_name?: string) => string;
  onReplaySnapshot: (_snapshotId: string) => boolean;
  onDeleteActiveSnapshot: () => boolean;
  onClearSnapshots: () => boolean;
  onCreateAnnotation: (_context: DashboardAnnotationContext, _message: string) => string | null;
  onDeleteAnnotation: (_annotationId: string) => boolean;
  onClearAnnotationsForContext: (_context: DashboardAnnotationContext) => boolean;
  onUpdateActiveSavedView: () => boolean;
  onDeleteActiveSavedView: () => boolean;
  onOpenDetail: (_view: DetailView) => void;
  isFilterOpen: boolean;
  onOpenFilters: () => void;
  onCloseFilters: () => void;
  summaryCardRef: RefObject<HTMLElement | null>;
  summaryVisualizationRef: RefObject<HTMLDivElement | null>;
  defaultWeightMin: number;
  defaultWeightMax: number;
};

export function DashboardOverviewView({
  runtimeEnableAuth,
  isAuthenticated,
  onSignOut,
  datasetSize,
  setDatasetSize,
  filters,
  setFilters,
  compareEnabled,
  setCompareEnabled,
  compareDatasetSize,
  setCompareDatasetSize,
  canUseCompareMode,
  realtimeEnabled,
  setRealtimeEnabled,
  realtimePaused,
  setRealtimePaused,
  realtimeStatus,
  interactionMode,
  setInteractionMode,
  savedViews,
  activeSavedViewId,
  setActiveSavedViewId,
  snapshots,
  activeSnapshotId,
  setActiveSnapshotId,
  annotations,
  activeAnnotationContext,
  setActiveAnnotationContext,
  onApplySavedView,
  onSaveCurrentAsNewView,
  onCaptureSnapshot,
  onReplaySnapshot,
  onDeleteActiveSnapshot,
  onClearSnapshots,
  onCreateAnnotation,
  onDeleteAnnotation,
  onClearAnnotationsForContext,
  onUpdateActiveSavedView,
  onDeleteActiveSavedView,
  onOpenDetail,
  isFilterOpen,
  onOpenFilters,
  onCloseFilters,
  summaryCardRef,
  summaryVisualizationRef,
  defaultWeightMin,
  defaultWeightMax,
}: DashboardOverviewViewProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const isFetching = useIsFetching() > 0;
  const effectiveCompareEnabled = compareEnabled && canUseCompareMode;
  const deferredFilters = useDeferredValue(filters);

  const selectedLabels = filters.labels ?? [];
  const weightMinValue = filters.weightMin ?? defaultWeightMin;
  const weightMaxValue = filters.weightMax ?? defaultWeightMax;

  const badgeItems = [
    `${t('dashboardBadgeDatasetSize')}: ${datasetSize.label}`,
    `${t('dashboardBadgeLabels')}: ${selectedLabels.length || t('dashboardBadgeAll')}`,
    `${t('dashboardBadgeSource')}: ${filters.source ?? t('dashboardBadgeAll')}`,
    `${t('dashboardBadgeSearch')}: ${filters.search || t('dashboardBadgeEmpty')}`,
  ];
  const realtimeStatusLabel =
    realtimeStatus === 'live'
      ? t('realtimeStatusLive')
      : realtimeStatus === 'paused'
        ? t('realtimeStatusPaused')
        : realtimeStatus === 'stale'
          ? t('realtimeStatusStale')
          : realtimeStatus === 'error'
            ? t('realtimeStatusError')
            : t('realtimeStatusOff');
  const realtimeStatusClass =
    realtimeStatus === 'live'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : realtimeStatus === 'paused'
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : realtimeStatus === 'stale'
          ? 'border-orange-200 bg-orange-50 text-orange-700'
          : realtimeStatus === 'error'
            ? 'border-rose-200 bg-rose-50 text-rose-700'
            : 'border-slate-200 bg-slate-50 text-slate-600';

  const activeFilterChips = [
    ...(selectedLabels.length > 0
      ? [`${t('dashboardActiveLabels')}: ${selectedLabels.join(', ')}`]
      : []),
    ...(filters.source && filters.source !== 'all'
      ? [`${t('dashboardActiveSource')}: ${filters.source}`]
      : []),
    ...(filters.search ? [`${t('dashboardActiveSearch')}: ${filters.search}`] : []),
  ];

  const applyCrossFilter = useCallback(
    (patch: CrossFilterPatch) => {
      if (interactionMode !== 'linked') {
        return;
      }
      setFilters((current) => {
        const nextLabels = patch.labels ?? current.labels;
        const nextLabel =
          patch.label ?? (nextLabels && nextLabels.length > 0 ? nextLabels[0] : undefined);
        return {
          ...current,
          ...patch,
          label: nextLabel,
          labels: nextLabels,
        };
      });
    },
    [interactionMode, setFilters],
  );

  const clearCrossFilters = useCallback(() => {
    if (interactionMode !== 'linked') {
      return;
    }
    setFilters((current) => ({
      ...current,
      label: undefined,
      labels: undefined,
      source: 'all',
      search: '',
    }));
  }, [interactionMode, setFilters]);

  const refreshData = useCallback(() => {
    void invalidateDashboardQueries(queryClient);
  }, [queryClient]);

  return (
    <main
      id="app-main"
      className="mx-auto grid w-full max-w-[1520px] gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
    >
      <section className="space-y-4 rounded-3xl border border-slate-200/90 bg-white/90 p-6 shadow-[0_12px_30px_rgb(15_23_42/8%)] backdrop-blur-[1px]">
        <div className="grid gap-4 xl:grid-cols-12 xl:items-start">
          <div className="xl:col-span-7">
            <PageHeader title={t('dashboardTitle')} subtitle={t('dashboardSubtitle')} />
          </div>
          <div className="flex flex-col gap-2 xl:col-span-5 xl:items-end">
            <div className="flex w-full flex-wrap items-center justify-start gap-2 sm:justify-end">
              <LanguageSwitcher />
              <ThemeToggle />
              {runtimeEnableAuth && isAuthenticated ? (
                <button
                  type="button"
                  className={`${ACTION_BUTTON_CLASS} w-full min-w-0 sm:w-auto sm:min-w-36`}
                  onClick={() => void onSignOut()}
                >
                  {t('authSignOut')}
                </button>
              ) : null}
            </div>
          </div>
        </div>
        <div className="min-h-10 rounded-xl border border-slate-200/80 bg-slate-50/65 p-3">
          <DashboardHeaderBadges items={badgeItems} isLoading={isFetching} />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(320px,380px)_minmax(0,1fr)] xl:items-start">
        <aside className="xl:sticky xl:top-6 xl:max-h-[calc(100vh-3rem)] xl:overflow-y-auto xl:pr-1">
          <DashboardControlPanel
            canUseCompareMode={canUseCompareMode}
            compareEnabled={compareEnabled}
            setCompareEnabled={setCompareEnabled}
            compareDatasetSize={compareDatasetSize}
            setCompareDatasetSize={setCompareDatasetSize}
            effectiveCompareEnabled={effectiveCompareEnabled}
            realtimeEnabled={realtimeEnabled}
            setRealtimeEnabled={setRealtimeEnabled}
            realtimePaused={realtimePaused}
            setRealtimePaused={setRealtimePaused}
            realtimeStatus={realtimeStatus}
            realtimeStatusLabel={realtimeStatusLabel}
            realtimeStatusClass={realtimeStatusClass}
            interactionMode={interactionMode}
            setInteractionMode={setInteractionMode}
            onRefreshData={refreshData}
            onOpenFilters={onOpenFilters}
            activeFilterChips={activeFilterChips}
            onClearCrossFilters={clearCrossFilters}
            savedViews={savedViews}
            activeSavedViewId={activeSavedViewId}
            setActiveSavedViewId={setActiveSavedViewId}
            onApplySavedView={onApplySavedView}
            onSaveCurrentAsNewView={onSaveCurrentAsNewView}
            onUpdateActiveSavedView={onUpdateActiveSavedView}
            onDeleteActiveSavedView={onDeleteActiveSavedView}
            snapshots={snapshots}
            activeSnapshotId={activeSnapshotId}
            setActiveSnapshotId={setActiveSnapshotId}
            onCaptureSnapshot={onCaptureSnapshot}
            onReplaySnapshot={onReplaySnapshot}
            onDeleteActiveSnapshot={onDeleteActiveSnapshot}
            onClearSnapshots={onClearSnapshots}
            annotations={annotations}
            activeAnnotationContext={activeAnnotationContext}
            setActiveAnnotationContext={setActiveAnnotationContext}
            onCreateAnnotation={onCreateAnnotation}
            onDeleteAnnotation={onDeleteAnnotation}
            onClearAnnotationsForContext={onClearAnnotationsForContext}
            datasetSize={datasetSize}
            filters={filters}
          />
        </aside>

        <div className="min-w-0">
          <DashboardDataSections
            datasetSize={datasetSize}
            setDatasetSize={setDatasetSize}
            filters={filters}
            queryFilters={deferredFilters}
            setFilters={setFilters}
            compareDatasetSize={compareDatasetSize}
            effectiveCompareEnabled={effectiveCompareEnabled}
            selectedLabels={selectedLabels}
            weightMinValue={weightMinValue}
            weightMaxValue={weightMaxValue}
            defaultWeightMin={defaultWeightMin}
            defaultWeightMax={defaultWeightMax}
            onCrossFilter={applyCrossFilter}
            onOpenDetail={onOpenDetail}
            summaryCardRef={summaryCardRef}
            summaryVisualizationRef={summaryVisualizationRef}
          />
        </div>
      </section>

      {isFilterOpen ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-4 lg:hidden">
          <button
            type="button"
            aria-label={t('dashboardCloseFilters')}
            className="absolute inset-0"
            onClick={onCloseFilters}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="filters-dialog-title"
            className="relative z-10 w-full max-w-lg rounded-3xl border border-slate-200/90 bg-white/95 p-5 shadow-2xl backdrop-blur-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 id="filters-dialog-title" className={UI_LABEL_CLASS}>
                  {t('dashboardFilters')}
                </h3>
                <p className="text-sm text-slate-600">{t('sectionFiltersDescription')}</p>
              </div>
              <button type="button" className={ACTION_BUTTON_CLASS} onClick={onCloseFilters}>
                {t('dashboardClose')}
              </button>
            </div>
            <div className="mt-4 max-h-[70vh] overflow-y-auto pr-1">
              <FiltersPanel
                datasetSize={datasetSize}
                setDatasetSize={setDatasetSize}
                filters={filters}
                setFilters={setFilters}
                selectedLabels={selectedLabels}
                weightMinValue={weightMinValue}
                weightMaxValue={weightMaxValue}
                defaultWeightMin={defaultWeightMin}
                defaultWeightMax={defaultWeightMax}
              />
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
