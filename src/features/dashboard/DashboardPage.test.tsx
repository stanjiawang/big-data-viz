import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { DataChunk, GraphResponse, TimeSeriesResponse } from '@/lib/types';
import { DashboardPage } from '@/features/dashboard/DashboardPage';

const mockChunk: DataChunk = {
  total: 1000,
  offset: 0,
  limit: 2,
  records: [
    {
      id: 'rec_00000000',
      timestamp: '2026-01-01T00:00:00.000Z',
      source: 'user',
      label: 'class-A',
      features: [0.1, 0.2],
      weight: 1,
    },
    {
      id: 'rec_00000001',
      timestamp: '2026-01-02T00:00:00.000Z',
      source: 'sensor',
      label: 'class-B',
      features: [0.2, 0.3],
      weight: 1,
    },
  ],
};

const mockTimeSeries: TimeSeriesResponse = {
  metric: 'ingestion',
  points: [
    { timestamp: '2026-01-01T00:00:00.000Z', value: 100 },
    { timestamp: '2026-01-02T00:00:00.000Z', value: 120 },
  ],
};

const mockGraph: GraphResponse = {
  nodes: [{ id: 'node-1', group: 'cluster-1', weight: 1 }],
  edges: [],
};

jest.mock('@/features/data/queries/useMockData', () => ({
  useMockData: () => ({
    data: mockChunk,
    isLoading: false,
    isError: false,
  }),
  useMockDataSuspense: () => ({
    data: mockChunk,
    isLoading: false,
  }),
}));

jest.mock('@/features/data/queries/useTimeSeries', () => ({
  useTimeSeries: () => ({
    data: mockTimeSeries,
    isLoading: false,
    isError: false,
  }),
  useTimeSeriesSuspense: () => ({
    data: mockTimeSeries,
  }),
}));

jest.mock('@/features/data/queries/useGraph', () => ({
  useGraph: () => ({
    data: mockGraph,
    isLoading: false,
    isError: false,
  }),
  useGraphSuspense: () => ({
    data: mockGraph,
  }),
}));

jest.mock('@/features/embeddings/EmbeddingCloud', () => ({
  EmbeddingCloud: () => <div>EmbeddingCloud</div>,
}));

jest.mock('@/features/graph/RelationshipGraph', () => ({
  RelationshipGraph: () => <div>RelationshipGraph</div>,
}));

jest.mock('@/features/table/LargeDataTable', () => ({
  LargeDataTable: () => <div>LargeDataTable</div>,
}));

jest.mock('@/features/charts/TimeSeriesChart', () => ({
  TimeSeriesChart: () => <div>TimeSeriesChart</div>,
}));

jest.mock('@/features/charts/PieChart', () => ({
  PieChart: () => <div>PieChart</div>,
}));

jest.mock('@/features/charts/BarChart', () => ({
  BarChart: () => <div>BarChart</div>,
}));

describe('DashboardPage', () => {
  function renderPage() {
    const queryClient = new QueryClient();
    return render(
      <QueryClientProvider client={queryClient}>
        <DashboardPage />
      </QueryClientProvider>,
    );
  }

  it('renders header and badges', () => {
    renderPage();
    expect(screen.getByText('Big Data Viz Lab')).toBeInTheDocument();
    expect(screen.getByText('Dataset Size: 1M')).toBeInTheDocument();
    expect(screen.getByText('Labels: all')).toBeInTheDocument();
    expect(screen.getByText('Source: all')).toBeInTheDocument();
  });

  it('enables compare mode', async () => {
    const user = userEvent.setup();
    renderPage();

    const checkbox = screen.getByRole('checkbox', { name: /Compare mode/i });
    await user.click(checkbox);

    expect(screen.getByText('Primary dataset')).toBeInTheDocument();
    expect(screen.getAllByText('Compare dataset').length).toBeGreaterThan(0);
  });
});
