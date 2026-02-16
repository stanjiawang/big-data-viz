import { DATASET_SIZES } from '@/features/dashboard/constants/filterOptions';
import {
  resolveInitialCompareDatasetSize,
  resolveInitialCompareEnabled,
  resolveInitialRealtimeEnabled,
  resolveInitialRealtimePaused,
  resolveSavedViews,
} from '@/features/dashboard/state/useDashboardState';

describe('useDashboardState storage resolvers', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    window.localStorage.clear();
  });

  it('reads compare-enabled flag from storage', () => {
    window.localStorage.setItem('bdv_compare_enabled', '1');

    expect(resolveInitialCompareEnabled()).toBe(true);
  });

  it('reads realtime flags from storage', () => {
    window.localStorage.setItem('bdv_realtime_enabled', '1');
    window.localStorage.setItem('bdv_realtime_paused', '1');

    expect(resolveInitialRealtimeEnabled()).toBe(true);
    expect(resolveInitialRealtimePaused()).toBe(true);
  });

  it('falls back when storage access throws', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(resolveInitialCompareEnabled()).toBe(false);
    expect(resolveInitialCompareDatasetSize()).toEqual(DATASET_SIZES[2]);
    expect(resolveInitialRealtimeEnabled()).toBe(false);
    expect(resolveInitialRealtimePaused()).toBe(false);
    expect(resolveSavedViews()).toEqual([]);
  });

  it('reads compare dataset size from storage when valid', () => {
    window.localStorage.setItem('bdv_compare_dataset_size', String(DATASET_SIZES[1].value));

    expect(resolveInitialCompareDatasetSize()).toEqual(DATASET_SIZES[1]);
  });

  it('reads saved views from storage and sanitizes invalid dataset sizes', () => {
    window.localStorage.setItem(
      'bdv_saved_views',
      JSON.stringify([
        {
          id: 'view-1',
          name: 'Baseline',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
          state: {
            datasetSizeValue: 123,
            compareDatasetSizeValue: 456,
            compareEnabled: true,
            filters: {
              source: 'all',
              search: '',
            },
          },
        },
      ]),
    );

    const views = resolveSavedViews();
    expect(views).toHaveLength(1);
    expect(views[0].state.datasetSizeValue).toBe(DATASET_SIZES[1].value);
    expect(views[0].state.compareDatasetSizeValue).toBe(DATASET_SIZES[2].value);
  });
});
