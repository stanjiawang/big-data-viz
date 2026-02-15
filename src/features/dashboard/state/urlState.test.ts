import { DATASET_SIZES } from '@/features/dashboard/constants/filterOptions';
import {
  buildDashboardSearchParams,
  parseDashboardSearchParams,
} from '@/features/dashboard/state/urlState';
import type { MockFilters } from '@/lib/types';

describe('dashboard url state', () => {
  it('parses dataset, detail view, compare state and filters from search params', () => {
    const parsed = parseDashboardSearchParams(
      '?size=10000000&detail=graph&label=class-A&labels=class-A,class-C&source=sensor&search=batch&weightMin=0.8&weightMax=2.2&compare=1&compareSize=50000000',
    );

    expect(parsed.datasetSize).toEqual(DATASET_SIZES[2]);
    expect(parsed.detailView).toBe('graph');
    expect(parsed.compareEnabled).toBe(true);
    expect(parsed.compareDatasetSize).toEqual(DATASET_SIZES[3]);
    expect(parsed.filters).toEqual<MockFilters>({
      label: 'class-A',
      labels: ['class-A', 'class-C'],
      source: 'sensor',
      search: 'batch',
      weightMin: 0.8,
      weightMax: 2.2,
    });
  });

  it('falls back to defaults when parameters are missing', () => {
    const parsed = parseDashboardSearchParams('');

    expect(parsed.datasetSize).toEqual(DATASET_SIZES[1]);
    expect(parsed.detailView).toBeNull();
    expect(parsed.compareEnabled).toBeNull();
    expect(parsed.compareDatasetSize).toBeNull();
    expect(parsed.filters).toEqual<MockFilters>({
      label: undefined,
      labels: undefined,
      source: 'all',
      search: '',
      weightMin: undefined,
      weightMax: undefined,
    });
  });

  it('builds params and preserves mock controls', () => {
    const params = buildDashboardSearchParams({
      datasetSize: DATASET_SIZES[3],
      detailView: 'summary',
      filters: {
        label: 'class-B',
        labels: ['class-B'],
        source: 'system',
        search: 'rec_00',
        weightMin: 0.5,
        weightMax: 1.6,
      },
      compareEnabled: false,
      compareDatasetSize: DATASET_SIZES[0],
      currentSearch: '?mockFailure=rate-limit&mockDelayMs=100',
    });

    expect(params.get('size')).toBe('50000000');
    expect(params.get('detail')).toBe('summary');
    expect(params.get('label')).toBe('class-B');
    expect(params.get('labels')).toBe('class-B');
    expect(params.get('compare')).toBe('0');
    expect(params.get('compareSize')).toBe('100000');
    expect(params.get('mockFailure')).toBe('rate-limit');
    expect(params.get('mockDelayMs')).toBe('100');
  });
});
