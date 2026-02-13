import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardDetailView } from '@/features/dashboard/ui/DashboardDetailView';
import { DATASET_SIZES } from '@/features/dashboard/constants/filterOptions';
import type { MockFilters } from '@/lib/types';

jest.mock('@/features/dashboard/ui/lazySections', () => ({
  SummarySection: () => <div>SummarySectionMock</div>,
  ChartsSection: ({ focusView }: { focusView?: string }) => (
    <div>ChartsSectionMock:{focusView ?? 'none'}</div>
  ),
  TableSection: () => <div>TableSectionMock</div>,
}));

jest.mock('@/features/dashboard/sections/shared', () => ({
  SectionCardActions: () => <div>SectionCardActionsMock</div>,
}));

describe('DashboardDetailView', () => {
  const filters: MockFilters = { source: 'all', search: '' };
  const baseProps = {
    datasetSize: DATASET_SIZES[1],
    compareDatasetSize: DATASET_SIZES[2],
    compareEnabled: false,
    filters,
    onBackToDashboard: jest.fn(),
    summaryCardRef: { current: null },
    summaryVisualizationRef: { current: null },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders summary detail and handles back action', async () => {
    const user = userEvent.setup();
    render(<DashboardDetailView {...baseProps} detailView="summary" />);

    expect(screen.getByText('Detailed View: Summary')).toBeInTheDocument();
    expect(screen.getByText('SummarySectionMock')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Back to dashboard' }));
    expect(baseProps.onBackToDashboard).toHaveBeenCalledTimes(1);
  });

  it('routes graph detail to charts section with graph focus', () => {
    render(<DashboardDetailView {...baseProps} detailView="graph" />);

    expect(screen.getByText('ChartsSectionMock:graph')).toBeInTheDocument();
    expect(screen.queryByText('SummarySectionMock')).not.toBeInTheDocument();
  });

  it('routes table detail to table section', () => {
    render(<DashboardDetailView {...baseProps} detailView="table" />);

    expect(screen.getByText('TableSectionMock')).toBeInTheDocument();
  });
});
