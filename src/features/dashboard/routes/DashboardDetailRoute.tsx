import { useEffect, useRef } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import { canAccessFeature } from '@/config/featureAccess';
import { getRuntimeConfig } from '@/config/runtimeConfig';
import type { DetailView } from '@/features/dashboard/sections';
import {
  useDashboardCompareState,
  useDashboardFilterPanelState,
  useDashboardNavigationState,
} from '@/features/dashboard/state/useDashboardState';
import { DashboardDetailView } from '@/features/dashboard/ui/DashboardDetailView';

const DETAIL_VIEWS: DetailView[] = ['summary', 'timeSeries', 'embedding', 'graph', 'd3', 'table'];

function isDetailView(value: string | undefined): value is DetailView {
  return value !== undefined && DETAIL_VIEWS.includes(value as DetailView);
}

export function DashboardDetailRoute() {
  const runtimeConfig = getRuntimeConfig();
  const auth = useAuth();
  const navigate = useNavigate();
  const params = useParams();
  const detailView = params.detailView;
  const summaryCardRef = useRef<HTMLElement | null>(null);
  const summaryVisualizationRef = useRef<HTMLDivElement | null>(null);

  const { datasetSize, setDetailView } = useDashboardNavigationState();
  const { compareDatasetSize, compareEnabled } = useDashboardCompareState();
  const { filters } = useDashboardFilterPanelState();
  const canUseCompareMode = canAccessFeature(
    auth.session,
    'compare_mode',
    runtimeConfig.enableAuth,
  );

  useEffect(() => {
    if (isDetailView(detailView)) {
      setDetailView(detailView);
    }
  }, [detailView, setDetailView]);

  if (!isDetailView(detailView)) {
    return <Navigate to="/" replace />;
  }

  return (
    <DashboardDetailView
      detailView={detailView}
      datasetSize={datasetSize}
      compareDatasetSize={compareDatasetSize}
      compareEnabled={compareEnabled && canUseCompareMode}
      filters={filters}
      onBackToDashboard={() => {
        setDetailView(null);
        navigate('/');
      }}
      summaryCardRef={summaryCardRef}
      summaryVisualizationRef={summaryVisualizationRef}
    />
  );
}
