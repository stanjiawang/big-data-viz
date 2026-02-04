import {
  DATASET_SIZES,
  LABEL_OPTIONS,
  SOURCE_OPTIONS,
} from '@/features/dashboard/dashboardFilters';

describe('dashboardFilters', () => {
  it('exposes dataset sizes', () => {
    expect(DATASET_SIZES.length).toBeGreaterThan(0);
    expect(DATASET_SIZES.map((item) => item.label)).toContain('1M');
  });

  it('exposes label options', () => {
    expect(LABEL_OPTIONS).toContain('class-A');
    expect(LABEL_OPTIONS).toContain('class-E');
  });

  it('exposes source options', () => {
    expect(SOURCE_OPTIONS).toContain('all');
    expect(SOURCE_OPTIONS).toContain('user');
  });
});
