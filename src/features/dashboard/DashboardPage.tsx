import { useContext, useEffect, useState } from 'react';
import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import { AuthContext } from '@/auth/AuthContext';
import { canAccessFeature } from '@/auth/useAuth';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { AsyncBoundary } from '@/components/ui/AsyncBoundary';
import { UI_BUTTON_GHOST_SM, UI_INPUT_MD, UI_LABEL_CLASS } from '@/components/ui/styleTokens';
import { getRuntimeConfig } from '@/config/runtimeConfig';
import type { MockFilters } from '@/lib/types';
import { FiltersPanel } from '@/features/dashboard/FiltersPanel';
import { DATASET_SIZES } from '@/features/dashboard/dashboardFilters';
import {
  ChartsSection,
  type DetailView,
  KpiSection,
  SummarySection,
  TableSection,
} from '@/features/dashboard/DashboardSections';
import {
  ChartsRowSkeleton,
  FiltersSkeleton,
  KpiSkeletonGrid,
  SummarySkeleton,
  TableSkeleton,
} from '@/features/dashboard/DashboardSkeletons';
import { DashboardHeaderBadges } from '@/features/dashboard/DashboardHeaderBadges';

const DEFAULT_WEIGHT_MIN = 0.5;
const DEFAULT_WEIGHT_MAX = 2.5;
const MOCK_CONTROL_PARAMS = [
  'mockFailure',
  'mockDelayMs',
  'mockRequireAuth',
  'mockRequireTenant',
  'mockTenantId',
];

const ACTION_BUTTON_CLASS = UI_BUTTON_GHOST_SM;

function toDetailLabel(view: DetailView) {
  if (view === 'timeSeries') return 'Time Series';
  if (view === 'embedding') return 'Embedding Cloud';
  if (view === 'graph') return 'Relationship Graph';
  if (view === 'table') return 'Large Table';
  return 'Summary';
}

function parseSearchParams() {
  const params = new URLSearchParams(window.location.search);
  const sizeValue = Number(params.get('size'));
  const datasetSize =
    DATASET_SIZES.find((option) => option.value === sizeValue) ?? DATASET_SIZES[1];

  const label = params.get('label') ?? undefined;
  const labels = params.get('labels')
    ? params
        .get('labels')
        ?.split(',')
        .map((value) => value.trim())
        .filter(Boolean)
    : undefined;
  const source = (params.get('source') ?? 'all') as MockFilters['source'];
  const search = params.get('search') ?? '';
  const weightMin = params.get('weightMin') ? Number(params.get('weightMin')) : undefined;
  const weightMax = params.get('weightMax') ? Number(params.get('weightMax')) : undefined;

  return {
    datasetSize,
    detail: (params.get('detail') as DetailView | null) ?? null,
    filters: {
      label,
      labels,
      source,
      search,
      weightMin,
      weightMax,
    } satisfies MockFilters,
  };
}

export function DashboardPage() {
  const [datasetSize, setDatasetSize] = useState(() => parseSearchParams().datasetSize);
  const [detailView, setDetailView] = useState<DetailView | null>(() => parseSearchParams().detail);
  const [filters, setFilters] = useState<MockFilters>(() => parseSearchParams().filters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [compareDatasetSize, setCompareDatasetSize] = useState(DATASET_SIZES[2]);

  const runtimeConfig = getRuntimeConfig();
  const authContext = useContext(AuthContext);
  const canUseCompareMode = canAccessFeature(
    authContext?.session ?? null,
    'compare_mode',
    runtimeConfig.enableAuth,
  );

  const queryClient = useQueryClient();
  const isFetching = useIsFetching() > 0;
  const effectiveCompareEnabled = compareEnabled && canUseCompareMode;

  useEffect(() => {
    const params = new URLSearchParams();
    const currentParams = new URLSearchParams(window.location.search);

    params.set('size', String(datasetSize.value));
    if (filters.label) {
      params.set('label', filters.label);
    }
    if (filters.labels && filters.labels.length > 0) {
      params.set('labels', filters.labels.join(','));
    }
    params.set('source', filters.source ?? 'all');
    if (filters.search) {
      params.set('search', filters.search);
    }
    if (filters.weightMin !== undefined) {
      params.set('weightMin', String(filters.weightMin));
    }
    if (filters.weightMax !== undefined) {
      params.set('weightMax', String(filters.weightMax));
    }
    if (detailView) {
      params.set('detail', detailView);
    }

    MOCK_CONTROL_PARAMS.forEach((key) => {
      const value = currentParams.get(key);
      if (value !== null) {
        params.set(key, value);
      }
    });

    const url = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', url);
  }, [datasetSize, filters, detailView]);

  const selectedLabels = filters.labels ?? [];
  const weightMinValue = filters.weightMin ?? DEFAULT_WEIGHT_MIN;
  const weightMaxValue = filters.weightMax ?? DEFAULT_WEIGHT_MAX;

  const badgeItems = [
    `Dataset Size: ${datasetSize.label}`,
    `Labels: ${selectedLabels.length || 'all'}`,
    `Source: ${filters.source ?? 'all'}`,
    `Search: ${filters.search || '—'}`,
  ];

  if (detailView) {
    return (
      <main className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Detailed View: {toDetailLabel(detailView)}
          </h2>
          <button type="button" className={ACTION_BUTTON_CLASS} onClick={() => setDetailView(null)}>
            Back to dashboard
          </button>
        </section>

        {detailView === 'summary' ? (
          <Card
            title="Summary (Detailed)"
            description="Adjust chart ranges and inspect distribution deeply."
            subtitle="Tech stack: ECharts + React Query"
          >
            <SummarySection
              datasetSize={datasetSize}
              compareDatasetSize={compareDatasetSize}
              compareEnabled={effectiveCompareEnabled}
              filters={filters}
              expanded
            />
          </Card>
        ) : null}

        {detailView === 'timeSeries' ? (
          <ChartsSection
            datasetSize={datasetSize}
            compareDatasetSize={compareDatasetSize}
            compareEnabled={effectiveCompareEnabled}
            filters={filters}
            expanded
            focusView="timeSeries"
          />
        ) : null}

        {detailView === 'embedding' ? (
          <ChartsSection
            datasetSize={datasetSize}
            compareDatasetSize={compareDatasetSize}
            compareEnabled={effectiveCompareEnabled}
            filters={filters}
            expanded
            focusView="embedding"
          />
        ) : null}

        {detailView === 'graph' ? (
          <ChartsSection
            datasetSize={datasetSize}
            compareDatasetSize={compareDatasetSize}
            compareEnabled={effectiveCompareEnabled}
            filters={filters}
            expanded
            focusView="graph"
          />
        ) : null}

        {detailView === 'table' ? (
          <TableSection
            datasetSize={datasetSize}
            compareDatasetSize={compareDatasetSize}
            compareEnabled={effectiveCompareEnabled}
            filters={filters}
          />
        ) : null}
      </main>
    );
  }

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-7">
            <PageHeader
              title="Big Data Viz Lab"
              subtitle="Enterprise-ready workspace for large-scale AI training data analytics."
            />
          </div>
          <div className="flex flex-wrap items-center justify-start gap-2 lg:col-span-5 lg:justify-end">
            <button
              type="button"
              className={ACTION_BUTTON_CLASS}
              onClick={() => void queryClient.invalidateQueries()}
            >
              Refresh data
            </button>
            {runtimeConfig.enableAuth && authContext?.isAuthenticated ? (
              <button
                type="button"
                className={ACTION_BUTTON_CLASS}
                onClick={() => void authContext.signOut()}
              >
                Sign out
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setIsFilterOpen(true)}
              className={`${ACTION_BUTTON_CLASS} lg:hidden`}
            >
              Filters
            </button>
          </div>
        </div>
        <div className="border-t border-slate-100 pt-3">
          <DashboardHeaderBadges items={badgeItems} isLoading={isFetching} />
        </div>
      </section>

      <section className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs text-slate-500 shadow-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={effectiveCompareEnabled}
            onChange={(event) => setCompareEnabled(event.target.checked)}
            disabled={!canUseCompareMode}
          />
          Compare mode
        </label>
        {!canUseCompareMode ? (
          <span className="text-xs font-semibold uppercase tracking-wide text-amber-600">
            Requires analyst or admin role
          </span>
        ) : null}
        <span className="hidden h-4 w-px bg-slate-200 sm:inline" />
        <div className="flex flex-wrap items-center gap-2">
          <span className={UI_LABEL_CLASS}>Compare dataset</span>
          <select
            className={`${UI_INPUT_MD} h-9 w-28 px-2 text-xs`}
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
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-12">
        <Card
          title="Filters"
          description="Global filters for time range, labels, source, and quality."
          subtitle="Tech stack: React State + URL Params"
          className="hidden lg:block lg:col-span-5"
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
              defaultWeightMin={DEFAULT_WEIGHT_MIN}
              defaultWeightMax={DEFAULT_WEIGHT_MAX}
            />
          )}
        </Card>

        <Card
          title="Summary"
          description="Quick glance of ingestion health and distribution."
          subtitle="Tech stack: ECharts + React Query"
          className="lg:col-span-7"
          actions={
            <button
              type="button"
              className={ACTION_BUTTON_CLASS}
              onClick={() => setDetailView('summary')}
            >
              Open detail
            </button>
          }
        >
          <AsyncBoundary
            fallback={<SummarySkeleton />}
            errorTitle="Summary failed"
            errorMessage="We couldn't load summary charts."
          >
            <SummarySection
              datasetSize={datasetSize}
              compareDatasetSize={compareDatasetSize}
              compareEnabled={effectiveCompareEnabled}
              filters={filters}
            />
          </AsyncBoundary>
        </Card>
      </section>

      <AsyncBoundary
        fallback={<KpiSkeletonGrid />}
        errorTitle="Metrics failed"
        errorMessage="We couldn't load KPI metrics."
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
        errorTitle="Charts failed"
        errorMessage="We couldn't load chart data."
      >
        <ChartsSection
          datasetSize={datasetSize}
          compareDatasetSize={compareDatasetSize}
          compareEnabled={effectiveCompareEnabled}
          filters={filters}
          onOpenDetail={(view) => setDetailView(view)}
        />
      </AsyncBoundary>

      <AsyncBoundary
        fallback={<TableSkeleton />}
        errorTitle="Table failed"
        errorMessage="We couldn't load table data."
      >
        <TableSection
          datasetSize={datasetSize}
          compareDatasetSize={compareDatasetSize}
          compareEnabled={effectiveCompareEnabled}
          filters={filters}
          onOpenDetail={(view) => setDetailView(view)}
        />
      </AsyncBoundary>

      {isFilterOpen ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-4 lg:hidden">
          <button
            type="button"
            aria-label="Close filters"
            className="absolute inset-0"
            onClick={() => setIsFilterOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className={UI_LABEL_CLASS}>Filters</h3>
                <p className="text-sm text-slate-600">
                  Global filters for time range, labels, source, and quality.
                </p>
              </div>
              <button
                type="button"
                className={ACTION_BUTTON_CLASS}
                onClick={() => setIsFilterOpen(false)}
              >
                Close
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
                defaultWeightMin={DEFAULT_WEIGHT_MIN}
                defaultWeightMax={DEFAULT_WEIGHT_MAX}
              />
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
