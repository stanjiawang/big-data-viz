import { render, screen } from '@testing-library/react';
import type { DataChunk, MockFilters } from '@/lib/types';
import {
  ChartsSection,
  KpiSection,
  SummarySection,
  TableSection,
} from '@/features/dashboard/DashboardSections';
import { DATASET_SIZES } from '@/features/dashboard/dashboardFilters';

jest.mock('@/features/charts/BarChart', () => ({
  BarChart: ({ title }: { title: string }) => <div>{title}</div>,
}));

jest.mock('@/features/charts/PieChart', () => ({
  PieChart: ({ title }: { title: string }) => <div>{title}</div>,
}));

jest.mock('@/features/charts/TimeSeriesChart', () => ({
  TimeSeriesChart: () => <div>TimeSeriesChart</div>,
}));

jest.mock('@/features/embeddings/EmbeddingCloud', () => ({
  EmbeddingCloud: () => <div>EmbeddingCloud</div>,
}));

jest.mock('@/features/graph/RelationshipGraph', () => ({
  RelationshipGraph: () => <div>RelationshipGraph</div>,
}));

jest.mock('@/features/table/LargeDataTable', () => ({
  LargeDataTable: ({ total }: { total: number }) => <div>Table {total}</div>,
}));

const mockChunk: DataChunk = {
  total: 1000,
  offset: 0,
  limit: 1000,
  records: [
    {
      id: 'rec_1',
      timestamp: '2024-01-01T00:00:00Z',
      source: 'user',
      label: 'class-A',
      features: [0.1, 0.2, 0.3],
      weight: 1.2,
    },
  ],
};

jest.mock('@/features/data/queries/useMockData', () => ({
  useMockDataSuspense: () => ({ data: mockChunk, isLoading: false }),
  useMockData: () => ({ data: mockChunk, isLoading: false }),
}));

jest.mock('@/features/data/queries/useTimeSeries', () => ({
  useTimeSeriesSuspense: () => ({ data: { metric: 'ingestion', points: [] } }),
}));

jest.mock('@/features/data/queries/useGraph', () => ({
  useGraphSuspense: () => ({ data: { nodes: [], edges: [] } }),
}));

describe('DashboardSections', () => {
  const filters: MockFilters = { source: 'all', search: '' };
  const baseProps = {
    datasetSize: DATASET_SIZES[1],
    compareDatasetSize: DATASET_SIZES[2],
    compareEnabled: false,
    filters,
  };

  it('renders KPI section', () => {
    render(<KpiSection {...baseProps} />);
    expect(screen.getByText('Total Records')).toBeInTheDocument();
    expect(screen.getByText('Active Labels')).toBeInTheDocument();
  });

  it('renders summary section charts', () => {
    render(<SummarySection {...baseProps} />);
    expect(screen.getByText('Label Distribution')).toBeInTheDocument();
    expect(screen.getByText('Source Volume')).toBeInTheDocument();
  });

  it('renders charts section content', () => {
    render(<ChartsSection {...baseProps} />);
    expect(screen.getByText('TimeSeriesChart')).toBeInTheDocument();
    expect(screen.getByText('EmbeddingCloud')).toBeInTheDocument();
    expect(screen.getByText('RelationshipGraph')).toBeInTheDocument();
  });

  it('renders table section', () => {
    render(<TableSection {...baseProps} />);
    expect(screen.getByText('Table 1000000')).toBeInTheDocument();
  });

  it('renders compare tables when enabled', () => {
    render(<TableSection {...baseProps} compareEnabled={true} />);
    expect(screen.getByText('Table 1000000')).toBeInTheDocument();
    expect(screen.getByText('Table 10000000')).toBeInTheDocument();
  });
});
