import { Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, renderHook, screen, waitFor } from '@testing-library/react';
import { useTimeSeries, useTimeSeriesSuspense } from '@/features/data/queries/useTimeSeries';

const getTimeSeries = jest.fn();

jest.mock('@/lib/apiClient', () => ({
  getTimeSeries: (...args: unknown[]) => getTimeSeries(...args),
}));

describe('useTimeSeries', () => {
  it('calls getTimeSeries with metric', async () => {
    getTimeSeries.mockResolvedValue({ metric: 'ingestion', points: [] });

    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useTimeSeries('latency'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getTimeSeries).toHaveBeenCalledWith({ metric: 'latency' });
  });
});

describe('useTimeSeriesSuspense', () => {
  it('renders data with suspense', async () => {
    getTimeSeries.mockResolvedValue({ metric: 'ingestion', points: [] });
    const queryClient = new QueryClient();

    const Consumer = () => {
      const { data } = useTimeSeriesSuspense('ingestion');
      return <div>Metric {data.metric}</div>;
    };

    render(
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<div>Loading</div>}>
          <Consumer />
        </Suspense>
      </QueryClientProvider>,
    );

    expect(await screen.findByText('Metric ingestion')).toBeInTheDocument();
  });
});
