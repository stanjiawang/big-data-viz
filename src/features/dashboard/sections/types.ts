import type { MockFilters } from '@/lib/types';
import type { DATASET_SIZES } from '@/features/dashboard/constants/filterOptions';

export type DetailView = 'summary' | 'timeSeries' | 'embedding' | 'graph' | 'd3' | 'table';

export type DashboardSectionProps = {
  datasetSize: (typeof DATASET_SIZES)[number];
  compareDatasetSize: (typeof DATASET_SIZES)[number];
  compareEnabled: boolean;
  filters: MockFilters;
  expanded?: boolean;
  onOpenDetail?: (_view: DetailView) => void;
  focusView?: Extract<DetailView, 'timeSeries' | 'embedding' | 'graph' | 'd3'>;
  draggable?: boolean;
};
