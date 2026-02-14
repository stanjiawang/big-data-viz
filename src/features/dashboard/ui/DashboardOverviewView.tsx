import type { Dispatch, RefObject, SetStateAction } from 'react';
import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/PageHeader';
import { AsyncBoundary } from '@/components/ui/AsyncBoundary';
import { Card } from '@/components/ui/Card';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { UI_BUTTON_GHOST_SM, UI_LABEL_CLASS, UI_SELECT_MD } from '@/components/ui/styleTokens';
import { FiltersPanel } from '@/features/dashboard/FiltersPanel';
import {
  ChartsRowSkeleton,
  FiltersSkeleton,
  KpiSkeletonGrid,
  SummarySkeleton,
  TableSkeleton,
} from '@/features/dashboard/SectionSkeletons';
import { DashboardHeaderBadges } from '@/features/dashboard/DashboardHeaderBadges';
import { DATASET_SIZES } from '@/features/dashboard/constants/filterOptions';
import { KpiSection } from '@/features/dashboard/sections/KpiSection';
import type { DetailView } from '@/features/dashboard/sections/types';
import { SectionCardActions } from '@/features/dashboard/sections/shared';
import { ChartsSection, SummarySection, TableSection } from '@/features/dashboard/ui/lazySections';
import { useDragReorder } from '@/features/dashboard/ui/useDragReorder';
import { useI18n } from '@/i18n/useI18n';
import type { MockFilters } from '@/lib/types';

const ACTION_BUTTON_CLASS = UI_BUTTON_GHOST_SM;
const TOP_CARD_IDS = ['filters', 'summary'] as const;
type DatasetSizeOption = (typeof DATASET_SIZES)[number];

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
  const topCardReorder = useDragReorder(TOP_CARD_IDS, 'bdv_overview_top_cards_order');

  const selectedLabels = filters.labels ?? [];
  const weightMinValue = filters.weightMin ?? defaultWeightMin;
  const weightMaxValue = filters.weightMax ?? defaultWeightMax;

  const badgeItems = [
    `${t('dashboardBadgeDatasetSize')}: ${datasetSize.label}`,
    `${t('dashboardBadgeLabels')}: ${selectedLabels.length || t('dashboardBadgeAll')}`,
    `${t('dashboardBadgeSource')}: ${filters.source ?? t('dashboardBadgeAll')}`,
    `${t('dashboardBadgeSearch')}: ${filters.search || t('dashboardBadgeEmpty')}`,
  ];

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
            <div className="flex flex-wrap items-center justify-start gap-2 lg:flex-nowrap lg:justify-end">
              <LanguageSwitcher />
              <ThemeToggle />
              {runtimeEnableAuth && isAuthenticated ? (
                <button
                  type="button"
                  className={`${ACTION_BUTTON_CLASS} w-32`}
                  onClick={() => void onSignOut()}
                >
                  {t('authSignOut')}
                </button>
              ) : null}
            </div>
          </div>
        </div>
        <div className="min-h-10 border-t border-slate-100 pt-3">
          <DashboardHeaderBadges items={badgeItems} isLoading={isFetching} />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs text-slate-500 shadow-sm">
        <div className="flex min-h-10 flex-wrap items-center gap-3 lg:flex-nowrap">
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
            <span className="relative block">
              <select
                aria-label={t('dashboardCompareDataset')}
                className={`${UI_SELECT_MD} h-9 w-28 px-2 pr-7 text-xs`}
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
          <div className="ml-auto flex flex-wrap items-center gap-2 lg:flex-nowrap">
            <button
              type="button"
              className={`${ACTION_BUTTON_CLASS} w-32`}
              onClick={() => void queryClient.invalidateQueries()}
            >
              {t('dashboardRefreshData')}
            </button>
            <button
              type="button"
              onClick={onOpenFilters}
              className={`${ACTION_BUTTON_CLASS} w-32 lg:hidden`}
            >
              {t('dashboardFilters')}
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-12">
        {topCardReorder.order.map((cardId) => {
          if (cardId === 'filters') {
            return (
              <div
                key={cardId}
                className={`hidden lg:col-span-5 lg:block ${topCardReorder.overId === cardId && topCardReorder.draggingId !== cardId ? 'rounded-xl ring-2 ring-blue-200' : ''}`}
                draggable
                onDragStart={() => topCardReorder.onDragStart(cardId)}
                onDragOver={(event) => topCardReorder.onDragOver(event, cardId)}
                onDrop={() => topCardReorder.onDrop(cardId)}
                onDragEnd={topCardReorder.onDragEnd}
              >
                <Card
                  title={t('dashboardFilters')}
                  description={t('sectionFiltersDescription')}
                  subtitle={t('techReactStateUrl')}
                >
                  {isFetching ? (
                    <FiltersSkeleton />
                  ) : (
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
                  )}
                </Card>
              </div>
            );
          }

          return (
            <div
              key={cardId}
              className={`lg:col-span-7 ${topCardReorder.overId === cardId && topCardReorder.draggingId !== cardId ? 'rounded-xl ring-2 ring-blue-200' : ''}`}
              draggable
              onDragStart={() => topCardReorder.onDragStart(cardId)}
              onDragOver={(event) => topCardReorder.onDragOver(event, cardId)}
              onDrop={() => topCardReorder.onDrop(cardId)}
              onDragEnd={topCardReorder.onDragEnd}
            >
              <Card
                sectionRef={summaryCardRef}
                title={t('sectionSummaryTitle')}
                description={t('sectionSummaryDescription')}
                subtitle={t('techEchartsQuery')}
                actions={
                  <SectionCardActions
                    onOpenDetail={() => onOpenDetail('summary')}
                    exportTargetRef={summaryVisualizationRef}
                    exportFileName="summary"
                  />
                }
              >
                <AsyncBoundary
                  fallback={<SummarySkeleton />}
                  errorTitle={t('dashboardSummaryFailedTitle')}
                  errorMessage={t('dashboardSummaryFailedMessage')}
                >
                  <SummarySection
                    datasetSize={datasetSize}
                    compareDatasetSize={compareDatasetSize}
                    compareEnabled={effectiveCompareEnabled}
                    filters={filters}
                    visualizationRef={summaryVisualizationRef}
                  />
                </AsyncBoundary>
              </Card>
            </div>
          );
        })}
      </section>

      <AsyncBoundary
        fallback={<KpiSkeletonGrid />}
        errorTitle={t('dashboardMetricsFailedTitle')}
        errorMessage={t('dashboardMetricsFailedMessage')}
      >
        <KpiSection
          datasetSize={datasetSize}
          compareDatasetSize={compareDatasetSize}
          compareEnabled={effectiveCompareEnabled}
          filters={filters}
        />
      </AsyncBoundary>

      <AsyncBoundary
        fallback={<ChartsRowSkeleton />}
        errorTitle={t('dashboardChartsFailedTitle')}
        errorMessage={t('dashboardChartsFailedMessage')}
      >
        <ChartsSection
          datasetSize={datasetSize}
          compareDatasetSize={compareDatasetSize}
          compareEnabled={effectiveCompareEnabled}
          filters={filters}
          onOpenDetail={onOpenDetail}
          draggable
        />
      </AsyncBoundary>

      <AsyncBoundary
        fallback={<TableSkeleton />}
        errorTitle={t('dashboardTableFailedTitle')}
        errorMessage={t('dashboardTableFailedMessage')}
      >
        <TableSection
          datasetSize={datasetSize}
          compareDatasetSize={compareDatasetSize}
          compareEnabled={effectiveCompareEnabled}
          filters={filters}
          onOpenDetail={onOpenDetail}
          draggable
        />
      </AsyncBoundary>

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
