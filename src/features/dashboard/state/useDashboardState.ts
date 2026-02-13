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

export function useDashboardState() {
  const [initialUrlState] = useState(() => parseDashboardSearchParams(window.location.search));
  const [datasetSize, setDatasetSize] = useState(initialUrlState.datasetSize);
  const [detailView, setDetailView] = useState<DetailView | null>(initialUrlState.detailView);
  const [filters, setFilters] = useState<MockFilters>(initialUrlState.filters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [compareDatasetSize, setCompareDatasetSize] = useState(DATASET_SIZES[2]);

  useEffect(() => {
    syncDashboardSearchParams({
      datasetSize,
      detailView,
      filters,
    });
  }, [datasetSize, detailView, filters]);

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
