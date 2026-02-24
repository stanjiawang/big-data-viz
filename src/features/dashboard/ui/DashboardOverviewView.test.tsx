import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardOverviewView } from '@/features/dashboard/ui/DashboardOverviewView';
import { DATASET_SIZES } from '@/features/dashboard/constants/filterOptions';
import { invalidateDashboardQueries } from '@/features/dashboard/constants/queryInvalidation';

jest.mock('@/components/ui/LanguageSwitcher', () => ({
  LanguageSwitcher: () => <div>LanguageSwitcherMock</div>,
}));

jest.mock('@/components/ui/LiquidSkinToggle', () => ({
  LiquidSkinToggle: () => <div>LiquidSkinToggleMock</div>,
}));

jest.mock('@/features/dashboard/ui/FiltersPanel', () => ({
  FiltersPanel: () => <div>FiltersPanelMock</div>,
}));

jest.mock('@/features/dashboard/ui/DashboardHeaderBadges', () => ({
  DashboardHeaderBadges: ({ items }: { items: string[] }) => (
    <div>{`Badges:${items.join('|')}`}</div>
  ),
}));

jest.mock('@/features/dashboard/sections/KpiSection', () => ({
  KpiSection: () => <div>KpiSectionMock</div>,
}));

jest.mock('@/features/dashboard/ui/LazySections', () => ({
  SummarySection: () => <div>SummarySectionMock</div>,
  ChartsSection: () => <div>ChartsSectionMock</div>,
  TableSection: () => <div>TableSectionMock</div>,
}));

jest.mock('@/features/dashboard/sections/SectionShared', () => ({
  SectionCardActions: ({ onOpenDetail }: { onOpenDetail?: () => void }) => (
    <button type="button" onClick={onOpenDetail}>
      Open detail action
    </button>
  ),
}));

jest.mock('@/features/dashboard/constants/queryInvalidation', () => ({
  invalidateDashboardQueries: jest.fn(),
}));

function renderView(overrides: Partial<ComponentProps<typeof DashboardOverviewView>> = {}) {
  const queryClient = new QueryClient();
  const defaultProps: ComponentProps<typeof DashboardOverviewView> = {
    runtimeEnableAuth: false,
    isAuthenticated: false,
    onSignOut: jest.fn().mockResolvedValue(undefined),
    datasetSize: DATASET_SIZES[1],
    setDatasetSize: jest.fn(),
    filters: { source: 'all', search: '' },
    setFilters: jest.fn(),
    compareEnabled: false,
    setCompareEnabled: jest.fn(),
    compareDatasetSize: DATASET_SIZES[2],
    setCompareDatasetSize: jest.fn(),
    canUseCompareMode: true,
    realtimeEnabled: false,
    setRealtimeEnabled: jest.fn(),
    realtimePaused: false,
    setRealtimePaused: jest.fn(),
    realtimeStatus: 'off',
    interactionMode: 'isolated',
    setInteractionMode: jest.fn(),
    savedViews: [],
    activeSavedViewId: null,
    setActiveSavedViewId: jest.fn(),
    snapshots: [],
    activeSnapshotId: null,
    setActiveSnapshotId: jest.fn(),
    annotations: [],
    activeAnnotationContext: 'summary',
    setActiveAnnotationContext: jest.fn(),
    onApplySavedView: jest.fn(),
    onSaveCurrentAsNewView: jest.fn(() => 'view-1'),
    onCaptureSnapshot: jest.fn(() => 'snapshot-1'),
    onReplaySnapshot: jest.fn(),
    onDeleteActiveSnapshot: jest.fn(),
    onClearSnapshots: jest.fn(),
    onCreateAnnotation: jest.fn(() => 'annotation-1'),
    onDeleteAnnotation: jest.fn(),
    onClearAnnotationsForContext: jest.fn(),
    onUpdateActiveSavedView: jest.fn(),
    onDeleteActiveSavedView: jest.fn(),
    onOpenDetail: jest.fn(),
    isFilterOpen: false,
    onOpenFilters: jest.fn(),
    onCloseFilters: jest.fn(),
    summaryCardRef: { current: null },
    summaryVisualizationRef: { current: null },
    defaultWeightMin: 0.5,
    defaultWeightMax: 2.5,
  };

  const props = { ...defaultProps, ...overrides };

  render(
    <QueryClientProvider client={queryClient}>
      <DashboardOverviewView {...props} />
    </QueryClientProvider>,
  );

  return props;
}

describe('DashboardOverviewView', () => {
  it('shows sign out action only when auth is enabled and session is authenticated', async () => {
    const user = userEvent.setup();
    const props = renderView({ runtimeEnableAuth: true, isAuthenticated: true });

    await user.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(props.onSignOut).toHaveBeenCalledTimes(1);
  });

  it('disables compare mode and shows role-required helper when access is denied', () => {
    renderView({ canUseCompareMode: false });

    expect(screen.getByRole('checkbox', { name: 'Compare mode' })).toBeDisabled();
    expect(screen.getByText('Requires analyst or admin role')).toBeInTheDocument();
  });

  it('opens summary detail from card actions', async () => {
    const user = userEvent.setup();
    const props = renderView();

    await user.click(screen.getByRole('button', { name: 'Open detail action' }));
    expect(props.onOpenDetail).toHaveBeenCalledWith('summary');
  });

  it('renders mobile filter dialog and closes it', async () => {
    const user = userEvent.setup();
    const props = renderView({ isFilterOpen: true });

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(props.onCloseFilters).toHaveBeenCalledTimes(1);
  });

  it('saves a new saved view from the control bar', async () => {
    const user = userEvent.setup();
    const props = renderView();

    await user.type(screen.getByPlaceholderText('e.g. Ops baseline'), 'Daily baseline');
    await user.click(screen.getByRole('button', { name: 'Save new' }));

    expect(props.onSaveCurrentAsNewView).toHaveBeenCalledWith('Daily baseline');
    expect(props.setActiveSavedViewId).toHaveBeenCalledWith('view-1');
  });

  it('clears cross-filters from active filter chips', async () => {
    const user = userEvent.setup();
    const props = renderView({
      interactionMode: 'linked',
      filters: {
        labels: ['class-A'],
        source: 'sensor',
        search: 'node-3',
      },
    });

    expect(screen.getByText('Labels: class-A')).toBeInTheDocument();
    expect(screen.getByText('Source: sensor')).toBeInTheDocument();
    expect(screen.getByText('Search: node-3')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear all' }));
    expect(props.setFilters).toHaveBeenCalledTimes(1);
  });

  it('toggles realtime controls', async () => {
    const user = userEvent.setup();
    const props = renderView({
      realtimeEnabled: true,
      realtimePaused: false,
      realtimeStatus: 'live',
    });

    expect(screen.getByText('Live')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Pause' }));
    expect(props.setRealtimePaused).toHaveBeenCalledTimes(1);
  });

  it('captures and replays snapshots from timeline controls', async () => {
    const user = userEvent.setup();
    const props = renderView({
      snapshots: [
        {
          id: 'snapshot-1',
          name: 'Snapshot 1',
          capturedAt: '2026-02-16T00:00:00.000Z',
          state: {
            datasetSizeValue: DATASET_SIZES[1].value,
            compareDatasetSizeValue: DATASET_SIZES[2].value,
            compareEnabled: false,
            filters: { source: 'all', search: '' },
          },
        },
      ],
      activeSnapshotId: 'snapshot-1',
    });

    await user.click(screen.getByRole('button', { name: 'Capture snapshot' }));
    await user.click(screen.getByRole('button', { name: 'Replay snapshot' }));

    expect(props.onCaptureSnapshot).toHaveBeenCalledTimes(1);
    expect(props.onReplaySnapshot).toHaveBeenCalledWith('snapshot-1');
  });

  it('refreshes dashboard data using scoped query invalidation helper', async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(screen.getByRole('button', { name: 'Refresh data' }));
    expect(invalidateDashboardQueries).toHaveBeenCalledTimes(1);
  });

  it('creates and clears context annotations', async () => {
    const user = userEvent.setup();
    const props = renderView({
      annotations: [
        {
          id: 'annotation-1',
          context: 'summary',
          message: 'Keep this trend for release notes.',
          createdAt: '2026-02-16T00:00:00.000Z',
          updatedAt: '2026-02-16T00:00:00.000Z',
        },
      ],
      activeAnnotationContext: 'summary',
    });

    await user.type(
      screen.getByPlaceholderText('e.g. Validate unexpected spike before report export'),
      'Escalate regression check',
    );
    await user.click(screen.getByRole('button', { name: 'Add note' }));
    expect(props.onCreateAnnotation).toHaveBeenCalledWith('summary', 'Escalate regression check');

    await user.click(screen.getByRole('button', { name: 'Clear context' }));
    expect(props.onClearAnnotationsForContext).toHaveBeenCalledWith('summary');
  });
});
