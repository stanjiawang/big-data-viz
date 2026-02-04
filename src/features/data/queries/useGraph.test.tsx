import { Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, renderHook, screen, waitFor } from '@testing-library/react';
import { useGraph, useGraphSuspense } from '@/features/data/queries/useGraph';

const getGraph = jest.fn();

jest.mock('@/lib/apiClient', () => ({
  getGraph: (...args: unknown[]) => getGraph(...args),
}));

describe('useGraph', () => {
  it('calls getGraph', async () => {
    getGraph.mockResolvedValue({ nodes: [], edges: [] });

    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useGraph(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getGraph).toHaveBeenCalled();
  });
});

describe('useGraphSuspense', () => {
  it('renders data with suspense', async () => {
    getGraph.mockResolvedValue({ nodes: [{ id: 'node-1', group: 'g', weight: 1 }], edges: [] });
    const queryClient = new QueryClient();

    const Consumer = () => {
      const { data } = useGraphSuspense();
      return <div>Nodes {data.nodes.length}</div>;
    };

    render(
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<div>Loading</div>}>
          <Consumer />
        </Suspense>
      </QueryClientProvider>,
    );

    expect(await screen.findByText('Nodes 1')).toBeInTheDocument();
  });
});
