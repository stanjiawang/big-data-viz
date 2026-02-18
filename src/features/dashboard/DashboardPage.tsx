import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import type { DetailView } from '@/features/dashboard/sections';

const DashboardOverviewRoute = lazy(async () => {
  const module = await import('@/features/dashboard/routes');
  return { default: module.DashboardOverviewRoute };
});

const DashboardDetailRoute = lazy(async () => {
  const module = await import('@/features/dashboard/routes');
  return { default: module.DashboardDetailRoute };
});

const DETAIL_VIEWS: DetailView[] = ['summary', 'timeSeries', 'embedding', 'graph', 'd3', 'table'];

export function DashboardPage() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname !== '/') {
      return;
    }

    const params = new URLSearchParams(location.search);
    const legacyDetail = params.get('detail');
    if (!legacyDetail || !DETAIL_VIEWS.includes(legacyDetail as DetailView)) {
      return;
    }

    params.delete('detail');
    const nextSearch = params.toString();
    navigate(`/detail/${legacyDetail}${nextSearch ? `?${nextSearch}` : ''}`, { replace: true });
  }, [location.pathname, location.search, navigate]);

  return (
    <Suspense fallback={<main id="app-main" className="mx-auto max-w-[1480px] px-4 py-8" />}>
      <Routes>
        <Route path="/" element={<DashboardOverviewRoute />} />
        <Route path="/detail/:detailView" element={<DashboardDetailRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
