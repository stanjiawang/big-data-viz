import { useEffect, useState } from 'react';
import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { AsyncBoundary } from '@/components/ui/AsyncBoundary';
import type { MockFilters } from '@/lib/types';
import { FiltersPanel } from '@/features/dashboard/FiltersPanel';
import { DATASET_SIZES } from '@/features/dashboard/dashboardFilters';
import {
  ChartsSection,
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

const ACTION_BUTTON_CLASS =
  'rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-700 focus-visible:border-blue-400 focus-visible:text-slate-700 focus-visible:ring-2 focus-visible:ring-blue-200';

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
  const [filters, setFilters] = useState<MockFilters>(() => parseSearchParams().filters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [compareDatasetSize, setCompareDatasetSize] = useState(DATASET_SIZES[2]);

  const queryClient = useQueryClient();
  const isFetching = useIsFetching() > 0;

  useEffect(() => {
    const params = new URLSearchParams();
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

    const url = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', url);
  }, [datasetSize, filters]);

  const selectedLabels = filters.labels ?? [];
  const weightMinValue = filters.weightMin ?? DEFAULT_WEIGHT_MIN;
  const weightMaxValue = filters.weightMax ?? DEFAULT_WEIGHT_MAX;

  const badgeItems = [
    `Dataset Size: ${datasetSize.label}`,
    `Labels: ${selectedLabels.length || 'all'}`,
    `Source: ${filters.source ?? 'all'}`,
    `Search: ${filters.search || '—'}`,
  ];

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <section className="grid gap-4 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-6">
          <PageHeader
            title="Big Data Viz Lab"
            subtitle="Enterprise-ready workspace for large-scale AI training data analytics."
          />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3 lg:col-span-6">
          <DashboardHeaderBadges items={badgeItems} isLoading={isFetching} />
          <button
            type="button"
            className={ACTION_BUTTON_CLASS}
            onClick={() => void queryClient.invalidateQueries()}
          >
            Refresh data
          </button>
          <button
            type="button"
            onClick={() => setIsFilterOpen(true)}
            className={`${ACTION_BUTTON_CLASS} lg:hidden`}
          >
            Filters
          </button>
        </div>
      </section>

      <section className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500 shadow-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={compareEnabled}
            onChange={(event) => setCompareEnabled(event.target.checked)}
          />
          Compare mode
        </label>
        <span className="hidden h-4 w-px bg-slate-200 sm:inline" />
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold uppercase tracking-wide">Compare dataset</span>
          <select
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 transition focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-200"
            value={compareDatasetSize.value}
            onChange={(event) => {
              const nextSize = DATASET_SIZES.find(
                (option) => option.value === Number(event.target.value),
              );
              if (nextSize) {
                setCompareDatasetSize(nextSize);
              }
            }}
            disabled={!compareEnabled}
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
          className="lg:col-span-7"
        >
          <AsyncBoundary
            fallback={<SummarySkeleton />}
            errorTitle="Summary failed"
            errorMessage="We couldn't load summary charts."
          >
            <SummarySection
              datasetSize={datasetSize}
              compareDatasetSize={compareDatasetSize}
              compareEnabled={compareEnabled}
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
          compareEnabled={compareEnabled}
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
          compareEnabled={compareEnabled}
          filters={filters}
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
          compareEnabled={compareEnabled}
          filters={filters}
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
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Filters
                </h3>
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
