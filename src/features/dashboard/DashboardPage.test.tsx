import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '@/auth/AuthProvider';
import { AUTH_SESSION_STORAGE_KEY } from '@/auth/authClient';
import { API_SCHEMA_VERSION } from '@/lib/contracts';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import type { DataChunk, GraphResponse, TimeSeriesResponse } from '@/lib/types';

const mockChunk: DataChunk = {
  schemaVersion: API_SCHEMA_VERSION,
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
  schemaVersion: API_SCHEMA_VERSION,
  metric: 'ingestion',
  points: [
    { timestamp: '2026-01-01T00:00:00.000Z', value: 100 },
    { timestamp: '2026-01-02T00:00:00.000Z', value: 120 },
  ],
};

const mockGraph: GraphResponse = {
  schemaVersion: API_SCHEMA_VERSION,
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

jest.mock('@/features/charts/D3EmbeddingScatter', () => ({
  D3EmbeddingScatter: () => <div>D3EmbeddingScatter</div>,
}));

jest.mock('@/features/dashboard/ui/lazySections', () => ({
  SummarySection: () => <div>SummarySection</div>,
  ChartsSection: () => <div>ChartsSection</div>,
  TableSection: () => <div>TableSection</div>,
}));

type RenderOptions = {
  enableAuth?: boolean;
  roles?: string[];
};

describe('DashboardPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    (globalThis as { __APP_ENABLE_AUTH__?: string }).__APP_ENABLE_AUTH__ = undefined;
  });

  afterEach(() => {
    window.localStorage.clear();
    (globalThis as { __APP_ENABLE_AUTH__?: string }).__APP_ENABLE_AUTH__ = undefined;
  });

  function seedSession(roles: string[]) {
    window.localStorage.setItem(
      AUTH_SESSION_STORAGE_KEY,
      JSON.stringify({
        accessToken: 'test-token',
        expiresAt: Date.now() + 60_000,
        user: {
          id: 'demo-user',
          name: 'Demo User',
          roles,
          tenantId: 'tenant-demo',
        },
      }),
    );
  }

  function renderPage(options: RenderOptions = {}) {
    const { enableAuth = false, roles = ['viewer'] } = options;
    (globalThis as { __APP_ENABLE_AUTH__?: string }).__APP_ENABLE_AUTH__ = enableAuth
      ? 'true'
      : 'false';

    if (enableAuth) {
      seedSession(roles);
    }

    const queryClient = new QueryClient();

    return render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider enabled={enableAuth}>
          <DashboardPage />
        </AuthProvider>
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

  it('enables compare mode in non-auth mode', async () => {
    const user = userEvent.setup();
    renderPage({ enableAuth: false });

    const checkbox = screen.getByRole('checkbox', { name: /Compare mode/i });
    await user.click(checkbox);

    expect(screen.getByText('Primary dataset')).toBeInTheDocument();
    expect(screen.getAllByText('Compare dataset').length).toBeGreaterThan(0);
  });

  it('disables compare mode for viewer role when auth is enabled', async () => {
    renderPage({ enableAuth: true, roles: ['viewer'] });

    await waitFor(() => {
      expect(screen.getByRole('checkbox', { name: /Compare mode/i })).toBeDisabled();
    });
    expect(screen.getByText('Requires analyst or admin role')).toBeInTheDocument();
  });

  it('allows compare mode for analyst role when auth is enabled', async () => {
    const user = userEvent.setup();
    renderPage({ enableAuth: true, roles: ['analyst'] });

    await waitFor(() => {
      expect(screen.getByRole('checkbox', { name: /Compare mode/i })).toBeEnabled();
    });

    await user.click(screen.getByRole('checkbox', { name: /Compare mode/i }));

    expect(screen.getByText('Primary dataset')).toBeInTheDocument();
  });

  it('shows sign out button when authenticated and auth is enabled', async () => {
    renderPage({ enableAuth: true, roles: ['analyst'] });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
    });
  });
});
