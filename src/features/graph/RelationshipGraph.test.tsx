import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { GraphResponse } from '@/lib/types';
import { RelationshipGraph } from '@/features/graph/RelationshipGraph';

const gotoNodeMock = jest.fn();
let registeredEvents: Record<string, (event: any) => void> | null = null;

jest.mock('@react-sigma/core', () => {
  return {
    SigmaContainer: ({ children }: { children?: React.ReactNode }) => (
      <div data-testid="sigma-container">{children}</div>
    ),
    useRegisterEvents: () => (events: Record<string, (event: any) => void>) => {
      registeredEvents = events;
    },
    useSetSettings: () => () => {},
    useSigma: () => ({
      getGraph: () => ({
        hasEdge: () => true,
        source: () => 'node-1',
        target: () => 'node-2',
      }),
    }),
    useCamera: () => ({
      gotoNode: gotoNodeMock,
    }),
  };
});

describe('RelationshipGraph', () => {
  beforeEach(() => {
    registeredEvents = null;
    gotoNodeMock.mockClear();
  });

  it('shows loading state', () => {
    render(<RelationshipGraph isLoading={true} />);
    expect(screen.getByText('Loading graph...')).toBeInTheDocument();
  });

  it('shows error state', () => {
    render(<RelationshipGraph isError={true} />);
    expect(screen.getByText('Failed to load graph.')).toBeInTheDocument();
  });

  it('shows empty state', () => {
    const data: GraphResponse = { nodes: [], edges: [] };
    render(<RelationshipGraph data={data} />);
    expect(screen.getByText('No graph data.')).toBeInTheDocument();
  });

  it('renders cluster filters when data is present', () => {
    const data: GraphResponse = {
      nodes: [
        { id: 'node-1', group: 'cluster-1', weight: 1 },
        { id: 'node-2', group: 'cluster-2', weight: 1 },
      ],
      edges: [],
    };

    render(<RelationshipGraph data={data} />);

    expect(screen.getByRole('button', { name: 'cluster-1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'cluster-2' })).toBeInTheDocument();
  });

  it('toggles edges and cluster filters', async () => {
    const data: GraphResponse = {
      nodes: [{ id: 'node-1', group: 'cluster-1', weight: 1 }],
      edges: [],
    };

    render(<RelationshipGraph data={data} />);

    const edgeButton = screen.getByRole('button', { name: /Hide edges/i });
    await userEvent.click(edgeButton);
    expect(screen.getByRole('button', { name: /Show edges/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'cluster-1' }));
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
  });

  it('shows tooltip and selected node details', async () => {
    const data: GraphResponse = {
      nodes: [{ id: 'node-1', group: 'cluster-1', weight: 2 }],
      edges: [],
    };

    render(<RelationshipGraph data={data} />);

    await waitFor(() => expect(registeredEvents).not.toBeNull());

    await act(async () => {
      registeredEvents?.enterNode?.({
        node: 'node-1',
        event: { x: 10, y: 10 },
      });
    });

    expect(screen.getByText('node-1')).toBeInTheDocument();

    await act(async () => {
      registeredEvents?.clickNode?.({
        node: 'node-1',
        event: { x: 10, y: 10 },
      });
    });

    expect(gotoNodeMock).toHaveBeenCalled();
    expect(screen.getByText('Cluster: cluster-1')).toBeInTheDocument();
  });
});
