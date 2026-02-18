import { useCallback, useState, type Dispatch, type RefObject, type SetStateAction } from 'react';
import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/PageHeader';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import {
  UI_BUTTON_GHOST_SM,
  UI_CHIP_INTERACTIVE,
  UI_INPUT_MD,
  UI_LABEL_CLASS,
  UI_SELECT_MD,
} from '@/components/ui/styleTokens';
import { FiltersPanel } from '@/features/dashboard/FiltersPanel';
import { DATASET_SIZES } from '@/features/dashboard/constants/filterOptions';
import type {
  CrossFilterPatch,
  DashboardAnnotationContext,
  DetailView,
} from '@/features/dashboard/sections/types';
import type { RealtimeStatus } from '@/features/realtime/useRealtimeStream';
import type {
  DashboardSavedView,
  DashboardAnnotation,
  DashboardSnapshot,
} from '@/features/dashboard/state/useDashboardState';
import { buildDashboardSearchParams } from '@/features/dashboard/state/urlState';
import { DashboardHeaderBadges } from '@/features/dashboard/DashboardHeaderBadges';
import { DashboardDataSections } from '@/features/dashboard/ui/DashboardDataSections';
import { AnnotationPanel } from '@/features/dashboard/ui/AnnotationPanel';
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
  const [newViewName, setNewViewName] = useState('');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'done' | 'failed'>('idle');

  const selectedLabels = filters.labels ?? [];
  const weightMinValue = filters.weightMin ?? defaultWeightMin;
  const weightMaxValue = filters.weightMax ?? defaultWeightMax;

  const badgeItems = [
    `${t('dashboardBadgeDatasetSize')}: ${datasetSize.label}`,
    `${t('dashboardBadgeLabels')}: ${selectedLabels.length || t('dashboardBadgeAll')}`,
    `${t('dashboardBadgeSource')}: ${filters.source ?? t('dashboardBadgeAll')}`,
    `${t('dashboardBadgeSearch')}: ${filters.search || t('dashboardBadgeEmpty')}`,
  ];
  const searchBadgePrefix = `${t('dashboardBadgeSearch')}:`;
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

  const focusSearchFilter = useCallback(() => {
    const searchInput = document.getElementById('filters-search-input') as HTMLInputElement | null;
    if (!searchInput) return;
    searchInput.focus();
    searchInput.select();
  }, []);

  const handleSearchBadgeClick = useCallback(() => {
    if (window.matchMedia('(max-width: 1023px)').matches) {
      onOpenFilters();
      window.setTimeout(focusSearchFilter, 0);
      return;
    }
    focusSearchFilter();
  }, [focusSearchFilter, onOpenFilters]);

  const handleApplySavedView = () => {
    if (!activeSavedViewId) {
      return;
    }
    onApplySavedView(activeSavedViewId);
  };

  const handleSaveCurrentAsView = () => {
    const viewId = onSaveCurrentAsNewView(newViewName);
    if (!viewId) {
      return;
    }
    setActiveSavedViewId(viewId);
    setNewViewName('');
  };

  const handleReplaySnapshot = () => {
    if (!activeSnapshotId) {
      return;
    }
    onReplaySnapshot(activeSnapshotId);
  };

  const applyCrossFilter = useCallback(
    (patch: CrossFilterPatch) => {
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
    [setFilters],
  );

  const clearCrossFilters = useCallback(() => {
    setFilters((current) => ({
      ...current,
      label: undefined,
      labels: undefined,
      source: 'all',
      search: '',
    }));
  }, [setFilters]);

  const copyShareLink = async () => {
    const params = buildDashboardSearchParams({
      datasetSize,
      detailView: null,
      filters,
      compareEnabled,
      compareDatasetSize,
      currentSearch: window.location.search,
    });
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopyStatus('done');
      window.setTimeout(() => setCopyStatus('idle'), 1_500);
    } catch {
      setCopyStatus('failed');
      window.setTimeout(() => setCopyStatus('idle'), 2_000);
    }
  };

  return (
    <main
      id="app-main"
      className="mx-auto grid w-full max-w-[1480px] gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
    >
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-7">
            <PageHeader title={t('dashboardTitle')} subtitle={t('dashboardSubtitle')} />
          </div>
          <div className="flex flex-col gap-2 lg:col-span-5 lg:items-end">
            <div className="flex w-full flex-wrap items-center justify-start gap-2 sm:justify-end lg:flex-nowrap lg:justify-end">
              <LanguageSwitcher />
              <ThemeToggle />
              {runtimeEnableAuth && isAuthenticated ? (
                <button
                  type="button"
                  className={`${ACTION_BUTTON_CLASS} w-full min-w-0 sm:w-auto sm:min-w-32`}
                  onClick={() => void onSignOut()}
                >
                  {t('authSignOut')}
                </button>
              ) : null}
            </div>
          </div>
        </div>
        <div className="min-h-10 border-t border-slate-100 pt-3">
          <DashboardHeaderBadges
            items={badgeItems}
            isLoading={isFetching}
            searchBadgePrefix={searchBadgePrefix}
            onSearchBadgeClick={handleSearchBadgeClick}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs text-slate-500 shadow-sm">
        <div className="flex min-h-10 flex-col gap-3 border-b border-slate-100 pb-3 sm:flex-row sm:flex-wrap sm:items-center lg:flex-nowrap">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={effectiveCompareEnabled}
              onChange={(event) => setCompareEnabled(event.target.checked)}
              disabled={!canUseCompareMode}
              aria-describedby={!canUseCompareMode ? 'compare-mode-note' : undefined}
            />
            {t('dashboardCompareMode')}
          </label>
          {!canUseCompareMode ? (
            <span
              id="compare-mode-note"
              className="text-xs font-semibold uppercase tracking-wide text-amber-600"
            >
              {t('dashboardCompareRoleRequired')}
            </span>
          ) : null}
          <span className="hidden h-4 w-px bg-slate-200 sm:inline" />
          <div className="flex flex-wrap items-center gap-2">
            <span className={UI_LABEL_CLASS}>{t('dashboardCompareDataset')}</span>
            <span className="relative block w-28">
              <select
                aria-label={t('dashboardCompareDataset')}
                className={`${UI_SELECT_MD} h-9 w-full px-2 pr-7 text-xs`}
                value={compareDatasetSize.value}
                onChange={(event) => {
                  const nextSize = DATASET_SIZES.find(
                    (option) => option.value === Number(event.target.value),
                  );
                  if (nextSize) {
                    setCompareDatasetSize(nextSize);
                  }
                }}
                disabled={!effectiveCompareEnabled}
              >
                {DATASET_SIZES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              >
                <path
                  d="M5.25 7.75 10 12.25l4.75-4.5"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.75"
                />
              </svg>
            </span>
          </div>
          <span className="hidden h-4 w-px bg-slate-200 sm:inline" />
          <div className="flex flex-wrap items-center gap-2">
            <span className={UI_LABEL_CLASS}>{t('realtimeMode')}</span>
            <span
              className={`inline-flex h-8 items-center rounded-full border px-3 text-[11px] font-semibold uppercase tracking-[0.08em] ${realtimeStatusClass}`}
            >
              {realtimeStatusLabel}
            </span>
            <button
              type="button"
              className={`${ACTION_BUTTON_CLASS} h-8 px-2 text-[11px]`}
              onClick={() => {
                setRealtimeEnabled((current) => {
                  const next = !current;
                  if (next) {
                    setRealtimePaused(false);
                  }
                  return next;
                });
              }}
            >
              {realtimeEnabled ? t('realtimeDisable') : t('realtimeEnable')}
            </button>
            <button
              type="button"
              className={`${ACTION_BUTTON_CLASS} h-8 px-2 text-[11px]`}
              disabled={!realtimeEnabled}
              onClick={() => setRealtimePaused((current) => !current)}
            >
              {realtimePaused ? t('realtimeResume') : t('realtimePause')}
            </button>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto lg:flex-nowrap">
            <button
              type="button"
              className={`${ACTION_BUTTON_CLASS} w-full min-w-0 sm:w-auto sm:min-w-32`}
              onClick={() => void queryClient.invalidateQueries()}
            >
              {t('dashboardRefreshData')}
            </button>
            <button
              type="button"
              onClick={onOpenFilters}
              className={`${ACTION_BUTTON_CLASS} w-full min-w-0 sm:w-auto sm:min-w-32 lg:hidden`}
            >
              {t('dashboardFilters')}
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
          <span className={UI_LABEL_CLASS}>{t('dashboardActiveFilters')}</span>
          {activeFilterChips.length > 0 ? (
            activeFilterChips.map((chip) => (
              <span key={chip} className={UI_CHIP_INTERACTIVE}>
                {chip}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-600">{t('dashboardNoActiveFilters')}</span>
          )}
          <button
            type="button"
            className={`${ACTION_BUTTON_CLASS} ml-auto h-8 px-2 text-[11px]`}
            onClick={clearCrossFilters}
            disabled={activeFilterChips.length === 0}
          >
            {t('dashboardClearCrossFilters')}
          </button>
        </div>

        <div className="mt-3 grid gap-2 xl:grid-cols-[minmax(220px,280px)_1fr_auto] xl:items-center">
          <label className="flex flex-col gap-1">
            <span className={UI_LABEL_CLASS}>{t('dashboardSavedViews')}</span>
            <span className="relative block">
              <select
                aria-label={t('dashboardSavedViews')}
                value={activeSavedViewId ?? ''}
                className={`${UI_SELECT_MD} h-9 w-full px-2 pr-7 text-xs`}
                onChange={(event) =>
                  setActiveSavedViewId(event.target.value ? event.target.value : null)
                }
              >
                <option value="">{t('dashboardNoSavedView')}</option>
                {savedViews.map((view) => (
                  <option key={view.id} value={view.id}>
                    {view.name}
                  </option>
                ))}
              </select>
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              >
                <path
                  d="M5.25 7.75 10 12.25l4.75-4.5"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.75"
                />
              </svg>
            </span>
          </label>

          <div className="grid gap-2 sm:grid-cols-[minmax(140px,200px)_repeat(4,minmax(0,1fr))] sm:items-end">
            <label className="flex flex-col gap-1">
              <span className={UI_LABEL_CLASS}>{t('dashboardSavedViewName')}</span>
              <input
                value={newViewName}
                onChange={(event) => setNewViewName(event.target.value)}
                placeholder={t('dashboardSavedViewNamePlaceholder')}
                className={`${UI_INPUT_MD} h-9 px-2 text-xs`}
              />
            </label>
            <button
              type="button"
              className={`${ACTION_BUTTON_CLASS} h-9 px-2`}
              onClick={handleSaveCurrentAsView}
            >
              {t('dashboardSaveView')}
            </button>
            <button
              type="button"
              className={`${ACTION_BUTTON_CLASS} h-9 px-2`}
              disabled={!activeSavedViewId}
              onClick={handleApplySavedView}
            >
              {t('dashboardApplyView')}
            </button>
            <button
              type="button"
              className={`${ACTION_BUTTON_CLASS} h-9 px-2`}
              disabled={!activeSavedViewId}
              onClick={onUpdateActiveSavedView}
            >
              {t('dashboardUpdateView')}
            </button>
            <button
              type="button"
              className={`${ACTION_BUTTON_CLASS} h-9 px-2`}
              disabled={!activeSavedViewId}
              onClick={onDeleteActiveSavedView}
            >
              {t('dashboardDeleteView')}
            </button>
          </div>

          <div className="flex items-center gap-2 xl:justify-end">
            <button
              type="button"
              className={`${ACTION_BUTTON_CLASS} h-9 px-2`}
              onClick={() => {
                void copyShareLink();
              }}
            >
              {t('dashboardCopyLink')}
            </button>
            <span className={UI_LABEL_CLASS} aria-live="polite">
              {copyStatus === 'done'
                ? t('dashboardCopyLinkDone')
                : copyStatus === 'failed'
                  ? t('dashboardCopyLinkFailed')
                  : ''}
            </span>
          </div>
        </div>

        <div className="mt-3 grid gap-2 border-t border-slate-100 pt-3 xl:grid-cols-[minmax(220px,280px)_1fr] xl:items-center">
          <label className="flex flex-col gap-1">
            <span className={UI_LABEL_CLASS}>{t('snapshotTimelineTitle')}</span>
            <span className="relative block">
              <select
                aria-label={t('snapshotTimelineTitle')}
                value={activeSnapshotId ?? ''}
                className={`${UI_SELECT_MD} h-9 w-full px-2 pr-7 text-xs`}
                onChange={(event) =>
                  setActiveSnapshotId(event.target.value ? event.target.value : null)
                }
              >
                <option value="">{t('snapshotNoItems')}</option>
                {snapshots.map((snapshot) => (
                  <option key={snapshot.id} value={snapshot.id}>
                    {snapshot.name}
                  </option>
                ))}
              </select>
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              >
                <path
                  d="M5.25 7.75 10 12.25l4.75-4.5"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.75"
                />
              </svg>
            </span>
          </label>

          <div className="grid gap-2 sm:grid-cols-4 sm:items-end">
            <button
              type="button"
              className={`${ACTION_BUTTON_CLASS} h-9 px-2`}
              onClick={() => {
                onCaptureSnapshot();
              }}
            >
              {t('snapshotCapture')}
            </button>
            <button
              type="button"
              className={`${ACTION_BUTTON_CLASS} h-9 px-2`}
              disabled={!activeSnapshotId}
              onClick={handleReplaySnapshot}
            >
              {t('snapshotReplay')}
            </button>
            <button
              type="button"
              className={`${ACTION_BUTTON_CLASS} h-9 px-2`}
              disabled={!activeSnapshotId}
              onClick={onDeleteActiveSnapshot}
            >
              {t('snapshotDelete')}
            </button>
            <button
              type="button"
              className={`${ACTION_BUTTON_CLASS} h-9 px-2`}
              disabled={snapshots.length === 0}
              onClick={onClearSnapshots}
            >
              {t('snapshotClear')}
            </button>
          </div>
        </div>
        <div className="mt-3 border-t border-slate-100 pt-3">
          <AnnotationPanel
            annotations={annotations}
            activeContext={activeAnnotationContext}
            onContextChange={setActiveAnnotationContext}
            onCreateAnnotation={onCreateAnnotation}
            onDeleteAnnotation={onDeleteAnnotation}
            onClearContext={onClearAnnotationsForContext}
          />
        </div>
      </section>

      <DashboardDataSections
        datasetSize={datasetSize}
        setDatasetSize={setDatasetSize}
        filters={filters}
        setFilters={setFilters}
        compareDatasetSize={compareDatasetSize}
        effectiveCompareEnabled={effectiveCompareEnabled}
        isFetching={isFetching}
        selectedLabels={selectedLabels}
        weightMinValue={weightMinValue}
        weightMaxValue={weightMaxValue}
        defaultWeightMin={defaultWeightMin}
        defaultWeightMax={defaultWeightMax}
        onCrossFilter={applyCrossFilter}
        onOpenDetail={onOpenDetail}
        setActiveAnnotationContext={setActiveAnnotationContext}
        summaryCardRef={summaryCardRef}
        summaryVisualizationRef={summaryVisualizationRef}
      />

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
            className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl"
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
