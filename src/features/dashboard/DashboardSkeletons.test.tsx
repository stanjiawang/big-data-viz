import { render } from '@testing-library/react';
import {
  ChartsRowSkeleton,
  FiltersSkeleton,
  KpiSkeletonGrid,
  SummarySkeleton,
  TableSkeleton,
} from '@/features/dashboard/DashboardSkeletons';

describe('DashboardSkeletons', () => {
  it('renders KPI skeletons', () => {
    const { container } = render(<KpiSkeletonGrid />);
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('renders summary skeletons', () => {
    const { container } = render(<SummarySkeleton />);
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('renders charts skeletons', () => {
    const { container } = render(<ChartsRowSkeleton />);
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('renders table skeletons', () => {
    const { container } = render(<TableSkeleton />);
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('renders filters skeletons', () => {
    const { container } = render(<FiltersSkeleton />);
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });
});
