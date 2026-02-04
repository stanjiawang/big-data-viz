import { Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, renderHook, screen, waitFor } from '@testing-library/react';
import { useMockData, useMockDataSuspense } from '@/features/data/queries/useMockData';
import type { DataChunk } from '@/lib/types';

const getMockData = jest.fn();

jest.mock('@/lib/apiClient', () => ({
  getMockData: (...args: unknown[]) => getMockData(...args),
}));

describe('useMockData', () => {
  beforeEach(() => {
    getMockData.mockReset();
  });

  it('calls getMockData with params', async () => {
    const chunk: DataChunk = { total: 1, offset: 0, limit: 1, records: [] };
    getMockData.mockResolvedValue(chunk);

    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(
      () =>
        useMockData({
          total: 10,
          offset: 0,
          limit: 1,
          vectorSize: 8,
          filters: { source: 'all' },
        }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getMockData).toHaveBeenCalledWith({
      total: 10,
      offset: 0,
      limit: 1,
      vectorSize: 8,
      filters: { source: 'all' },
    });
  });

  it('respects disabled queries', async () => {
    getMockData.mockResolvedValue({ total: 1, offset: 0, limit: 1, records: [] });

    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(
      () =>
        useMockData({
          total: 10,
          offset: 0,
          limit: 1,
          vectorSize: 8,
          filters: { source: 'all' },
          enabled: false,
        }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isFetched).toBe(false));
    expect(getMockData).not.toHaveBeenCalled();
  });
});

describe('useMockDataSuspense', () => {
  it('renders data with suspense', async () => {
    const chunk: DataChunk = { total: 2, offset: 0, limit: 2, records: [] };
    getMockData.mockResolvedValue(chunk);

    const queryClient = new QueryClient();

    const Consumer = () => {
      const { data } = useMockDataSuspense({
        total: 2,
        offset: 0,
        limit: 2,
        vectorSize: 8,
        filters: { source: 'all' },
      });
      return <div>Total {data.total}</div>;
    };

    render(
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<div>Loading</div>}>
          <Consumer />
        </Suspense>
      </QueryClientProvider>,
    );

    expect(await screen.findByText('Total 2')).toBeInTheDocument();
  });
});
