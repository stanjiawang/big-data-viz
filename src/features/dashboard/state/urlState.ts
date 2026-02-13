import { DATASET_SIZES } from '@/features/dashboard/constants/filterOptions';
import type { DetailView } from '@/features/dashboard/sections';
import type { MockFilters } from '@/lib/types';

const MOCK_CONTROL_PARAMS = [
  'mockFailure',
  'mockDelayMs',
  'mockRequireAuth',
  'mockRequireTenant',
  'mockTenantId',
] as const;

export type DashboardUrlState = {
  datasetSize: (typeof DATASET_SIZES)[number];
  detailView: DetailView | null;
  filters: MockFilters;
};

export function parseDashboardSearchParams(search: string): DashboardUrlState {
  const params = new URLSearchParams(search);
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
  const searchValue = params.get('search') ?? '';
  const weightMin = params.get('weightMin') ? Number(params.get('weightMin')) : undefined;
  const weightMax = params.get('weightMax') ? Number(params.get('weightMax')) : undefined;

  return {
    datasetSize,
    detailView: (params.get('detail') as DetailView | null) ?? null,
    filters: {
      label,
      labels,
      source,
      search: searchValue,
      weightMin,
      weightMax,
    } satisfies MockFilters,
  };
}

export function buildDashboardSearchParams({
  datasetSize,
  detailView,
  filters,
  currentSearch,
}: {
  datasetSize: (typeof DATASET_SIZES)[number];
  detailView: DetailView | null;
  filters: MockFilters;
  currentSearch: string;
}) {
  const params = new URLSearchParams();
  const currentParams = new URLSearchParams(currentSearch);

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

  return params;
}

export function syncDashboardSearchParams(args: {
  datasetSize: (typeof DATASET_SIZES)[number];
  detailView: DetailView | null;
  filters: MockFilters;
}) {
  const params = buildDashboardSearchParams({
    datasetSize: args.datasetSize,
    detailView: args.detailView,
    filters: args.filters,
    currentSearch: window.location.search,
  });
  const nextUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, '', nextUrl);
}
