import { memo, useCallback, useState, type Dispatch, type SetStateAction } from 'react';
import {
  UI_BUTTON_GHOST_SM,
  UI_CHIP_INTERACTIVE,
  UI_INPUT_MD,
  UI_LABEL_CLASS,
  UI_SELECT_MD,
} from '@/components/ui/styleTokens';
import { DATASET_SIZES } from '@/features/dashboard/constants/filterOptions';
import { AnnotationPanel } from '@/features/dashboard/ui/AnnotationPanel';
import { buildDashboardSearchParams } from '@/features/dashboard/state/urlState';
import type { DashboardAnnotationContext } from '@/features/dashboard/sections/types';
import type {
  DashboardAnnotation,
  DashboardSavedView,
  DashboardSnapshot,
} from '@/features/dashboard/state/useDashboardState';
import type { RealtimeStatus } from '@/features/realtime/useRealtimeStream';
import { useI18n } from '@/i18n/useI18n';
import type { MockFilters } from '@/lib/types';
import type { DatasetSizeOption } from './types';

const ACTION_BUTTON_CLASS = UI_BUTTON_GHOST_SM;

type DashboardControlPanelProps = {
  canUseCompareMode: boolean;
  compareEnabled: boolean;
  setCompareEnabled: Dispatch<SetStateAction<boolean>>;
  compareDatasetSize: DatasetSizeOption;
  setCompareDatasetSize: Dispatch<SetStateAction<DatasetSizeOption>>;
  effectiveCompareEnabled: boolean;
  realtimeEnabled: boolean;
  setRealtimeEnabled: Dispatch<SetStateAction<boolean>>;
  realtimePaused: boolean;
  setRealtimePaused: Dispatch<SetStateAction<boolean>>;
  realtimeStatus: RealtimeStatus;
  realtimeStatusLabel: string;
  realtimeStatusClass: string;
  onRefreshData: () => void;
  onOpenFilters: () => void;
  activeFilterChips: string[];
  onClearCrossFilters: () => void;
  savedViews: DashboardSavedView[];
  activeSavedViewId: string | null;
  setActiveSavedViewId: Dispatch<SetStateAction<string | null>>;
  onApplySavedView: (_viewId: string) => boolean;
  onSaveCurrentAsNewView: (_name: string) => string | null;
  onUpdateActiveSavedView: () => boolean;
  onDeleteActiveSavedView: () => boolean;
  snapshots: DashboardSnapshot[];
  activeSnapshotId: string | null;
  setActiveSnapshotId: Dispatch<SetStateAction<string | null>>;
  onCaptureSnapshot: (_name?: string) => string;
  onReplaySnapshot: (_snapshotId: string) => boolean;
  onDeleteActiveSnapshot: () => boolean;
  onClearSnapshots: () => boolean;
  annotations: DashboardAnnotation[];
  activeAnnotationContext: DashboardAnnotationContext;
  setActiveAnnotationContext: Dispatch<SetStateAction<DashboardAnnotationContext>>;
  onCreateAnnotation: (_context: DashboardAnnotationContext, _message: string) => string | null;
  onDeleteAnnotation: (_annotationId: string) => boolean;
  onClearAnnotationsForContext: (_context: DashboardAnnotationContext) => boolean;
  datasetSize: DatasetSizeOption;
  filters: MockFilters;
};

export const DashboardControlPanel = memo(function DashboardControlPanel({
  canUseCompareMode,
  compareEnabled,
  setCompareEnabled,
  compareDatasetSize,
  setCompareDatasetSize,
  effectiveCompareEnabled,
  realtimeEnabled,
  setRealtimeEnabled,
  realtimePaused,
  setRealtimePaused,
  realtimeStatus,
  realtimeStatusLabel,
  realtimeStatusClass,
  onRefreshData,
  onOpenFilters,
  activeFilterChips,
  onClearCrossFilters,
  savedViews,
  activeSavedViewId,
  setActiveSavedViewId,
  onApplySavedView,
  onSaveCurrentAsNewView,
  onUpdateActiveSavedView,
  onDeleteActiveSavedView,
  snapshots,
  activeSnapshotId,
  setActiveSnapshotId,
  onCaptureSnapshot,
  onReplaySnapshot,
  onDeleteActiveSnapshot,
  onClearSnapshots,
  annotations,
  activeAnnotationContext,
  setActiveAnnotationContext,
  onCreateAnnotation,
  onDeleteAnnotation,
  onClearAnnotationsForContext,
  datasetSize,
  filters,
}: DashboardControlPanelProps) {
  const { t } = useI18n();
  const [newViewName, setNewViewName] = useState('');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'done' | 'failed'>('idle');

  const handleApplySavedView = useCallback(() => {
    if (!activeSavedViewId) {
      return;
    }
    onApplySavedView(activeSavedViewId);
  }, [activeSavedViewId, onApplySavedView]);

  const handleSaveCurrentAsView = useCallback(() => {
    const viewId = onSaveCurrentAsNewView(newViewName);
    if (!viewId) {
      return;
    }
    setActiveSavedViewId(viewId);
    setNewViewName('');
  }, [newViewName, onSaveCurrentAsNewView, setActiveSavedViewId]);

  const handleReplaySnapshot = useCallback(() => {
    if (!activeSnapshotId) {
      return;
    }
    onReplaySnapshot(activeSnapshotId);
  }, [activeSnapshotId, onReplaySnapshot]);

  const copyShareLink = useCallback(async () => {
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
  }, [compareDatasetSize, compareEnabled, datasetSize, filters]);

  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white/90 px-5 py-4 text-xs text-slate-500 shadow-[0_8px_24px_rgb(15_23_42/7%)] backdrop-blur-[1px]">
      <div className="flex min-h-10 flex-col gap-3 border-b border-slate-200/80 pb-3 md:flex-row md:flex-wrap md:items-center lg:flex-nowrap">
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
        <span className="hidden h-4 w-px bg-slate-300/80 md:inline" />
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
        <span className="hidden h-4 w-px bg-slate-300/80 md:inline" />
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
        <div className="flex w-full flex-wrap items-center gap-2 md:ml-auto md:w-auto lg:flex-nowrap">
          <button
            type="button"
            className={`${ACTION_BUTTON_CLASS} w-full min-w-0 md:w-auto md:min-w-36`}
            onClick={onRefreshData}
          >
            {t('dashboardRefreshData')}
          </button>
          <button
            type="button"
            onClick={onOpenFilters}
            className={`${ACTION_BUTTON_CLASS} w-full min-w-0 md:w-auto md:min-w-36 lg:hidden`}
          >
            {t('dashboardFilters')}
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-3">
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
          onClick={onClearCrossFilters}
          disabled={activeFilterChips.length === 0}
        >
          {t('dashboardClearCrossFilters')}
        </button>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(240px,300px)_1fr_auto] xl:items-center">
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

        <div className="grid gap-2 md:grid-cols-[minmax(160px,220px)_repeat(4,minmax(0,1fr))] md:items-end">
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

      <div className="mt-3 grid gap-3 border-t border-slate-200/80 pt-3 xl:grid-cols-[minmax(240px,300px)_1fr] xl:items-center">
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

        <div className="grid gap-2 md:grid-cols-4 md:items-end">
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

      <div className="mt-3 border-t border-slate-200/80 pt-3">
        <AnnotationPanel
          annotations={annotations}
          activeContext={activeAnnotationContext}
          onContextChange={setActiveAnnotationContext}
          onCreateAnnotation={onCreateAnnotation}
          onDeleteAnnotation={onDeleteAnnotation}
          onClearContext={onClearAnnotationsForContext}
        />
      </div>
      {realtimeStatus === 'error' ? <p className="sr-only">{t('realtimeStatusError')}</p> : null}
    </section>
  );
});
