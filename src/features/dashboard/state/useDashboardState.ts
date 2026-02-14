import { useEffect, useState } from 'react';
import { DATASET_SIZES } from '@/features/dashboard/constants/filterOptions';
import type { DetailView } from '@/features/dashboard/sections';
import {
  parseDashboardSearchParams,
  syncDashboardSearchParams,
} from '@/features/dashboard/state/urlState';
import type { MockFilters } from '@/lib/types';

export const DEFAULT_WEIGHT_MIN = 0.5;
export const DEFAULT_WEIGHT_MAX = 2.5;
const COMPARE_ENABLED_STORAGE_KEY = 'bdv_compare_enabled';
const COMPARE_SIZE_STORAGE_KEY = 'bdv_compare_dataset_size';

function resolveInitialCompareEnabled() {
  return window.localStorage.getItem(COMPARE_ENABLED_STORAGE_KEY) === '1';
}

function resolveInitialCompareDatasetSize() {
  const raw = window.localStorage.getItem(COMPARE_SIZE_STORAGE_KEY);
  const parsed = Number(raw);
  return DATASET_SIZES.find((option) => option.value === parsed) ?? DATASET_SIZES[2];
}

export function useDashboardState() {
  const [initialUrlState] = useState(() => parseDashboardSearchParams(window.location.search));
  const [datasetSize, setDatasetSize] = useState(initialUrlState.datasetSize);
  const [detailView, setDetailView] = useState<DetailView | null>(initialUrlState.detailView);
  const [filters, setFilters] = useState<MockFilters>(initialUrlState.filters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [compareEnabled, setCompareEnabled] = useState(() => resolveInitialCompareEnabled());
  const [compareDatasetSize, setCompareDatasetSize] = useState(() =>
    resolveInitialCompareDatasetSize(),
  );

  useEffect(() => {
    syncDashboardSearchParams({
      datasetSize,
      detailView,
      filters,
    });
  }, [datasetSize, detailView, filters]);

  useEffect(() => {
    window.localStorage.setItem(COMPARE_ENABLED_STORAGE_KEY, compareEnabled ? '1' : '0');
  }, [compareEnabled]);

  useEffect(() => {
    window.localStorage.setItem(COMPARE_SIZE_STORAGE_KEY, String(compareDatasetSize.value));
  }, [compareDatasetSize]);

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
  };
}
