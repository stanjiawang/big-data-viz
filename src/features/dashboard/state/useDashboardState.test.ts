import { DATASET_SIZES } from '@/features/dashboard/constants/filterOptions';
import {
  resolveInitialCompareDatasetSize,
  resolveInitialCompareEnabled,
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

  it('falls back when storage access throws', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(resolveInitialCompareEnabled()).toBe(false);
    expect(resolveInitialCompareDatasetSize()).toEqual(DATASET_SIZES[2]);
  });

  it('reads compare dataset size from storage when valid', () => {
    window.localStorage.setItem('bdv_compare_dataset_size', String(DATASET_SIZES[1].value));

    expect(resolveInitialCompareDatasetSize()).toEqual(DATASET_SIZES[1]);
  });
});
