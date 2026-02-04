import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { DataChunk, MockFilters } from '@/lib/types';
import { queryKeys } from '@/features/data/queries/queryKeys';
import { LargeDataTable } from '@/features/table/LargeDataTable';

const useMockDataMock = jest.fn();

jest.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: () => ({
    getTotalSize: () => 88,
    getVirtualItems: () => [
      { key: 0, index: 0, start: 0, size: 44 },
      { key: 1, index: 1, start: 44, size: 44 },
    ],
  }),
}));

jest.mock('@/features/data/queries/useMockData', () => ({
  useMockData: (...args: unknown[]) => useMockDataMock(...args),
}));

describe('LargeDataTable', () => {
  const filters: MockFilters = { source: 'all' };

  beforeEach(() => {
    useMockDataMock.mockReset();
  });

  it('renders header and rows', () => {
    const queryClient = new QueryClient();
    const chunk: DataChunk = {
      total: 2,
      offset: 0,
      limit: 2,
      records: [
        {
          id: 'rec_00000000',
          timestamp: '2026-01-01T00:00:00.000Z',
          source: 'user',
          label: 'class-A',
          features: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6],
          weight: 1,
        },
        {
          id: 'rec_00000001',
          timestamp: '2026-01-02T00:00:00.000Z',
          source: 'sensor',
          label: 'class-B',
          features: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6],
          weight: 1,
        },
      ],
    };

    useMockDataMock.mockReturnValue({
      data: {
        total: 2,
        offset: 0,
        limit: 2,
        records: [],
      },
      isLoading: false,
      isError: false,
    });

    queryClient.setQueryData(
      queryKeys.mockData({ offset: 0, limit: 200, total: 2, filters }),
      chunk,
    );

    render(
      <QueryClientProvider client={queryClient}>
        <LargeDataTable total={2} filters={filters} />
      </QueryClientProvider>,
    );

    expect(screen.getByText('Embedding (first 6)')).toBeInTheDocument();
    expect(screen.getByText('rec_00000000')).toBeInTheDocument();
    expect(screen.getByText('rec_00000001')).toBeInTheDocument();
  });

  it('renders error state', () => {
    useMockDataMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    render(
      <QueryClientProvider client={new QueryClient()}>
        <LargeDataTable total={2} filters={filters} />
      </QueryClientProvider>,
    );

    expect(screen.getByText('Failed to load table data.')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    useMockDataMock.mockReturnValue({
      data: {
        total: 0,
        offset: 0,
        limit: 1,
        records: [],
      },
      isLoading: false,
      isError: false,
    });

    render(
      <QueryClientProvider client={new QueryClient()}>
        <LargeDataTable total={0} filters={filters} />
      </QueryClientProvider>,
    );

    expect(screen.getByText('No records match the current filters.')).toBeInTheDocument();
  });

  it('toggles compact view', async () => {
    useMockDataMock.mockReturnValue({
      data: {
        total: 2,
        offset: 0,
        limit: 2,
        records: [],
      },
      isLoading: false,
      isError: false,
    });

    render(
      <QueryClientProvider client={new QueryClient()}>
        <LargeDataTable total={2} filters={filters} />
      </QueryClientProvider>,
    );

    const toggle = screen.getByRole('button', { name: 'Compact view' });
    await userEvent.click(toggle);
    expect(screen.getByRole('button', { name: 'Comfortable view' })).toBeInTheDocument();
  });
});
