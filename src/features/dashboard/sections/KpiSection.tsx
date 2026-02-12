import { useMemo } from 'react';
import { KpiCard } from '@/components/ui/KpiCard';
import type { DataChunk } from '@/lib/types';
import { useMockData, useMockDataSuspense } from '@/features/data/queries/useMockData';
import type { DashboardSectionProps } from '@/features/dashboard/sections/types';

export function KpiSection({
  datasetSize,
  compareDatasetSize,
  compareEnabled,
  filters,
}: DashboardSectionProps) {
  const { data: chunk, isLoading } = useMockDataSuspense({
    total: datasetSize.value,
    offset: 0,
    limit: 1000,
    vectorSize: 128,
    filters,
  });

  const { data: compareChunk, isLoading: isCompareLoading } = useMockData({
    total: compareDatasetSize.value,
    offset: 0,
    limit: 1000,
    vectorSize: 128,
    filters,
    enabled: compareEnabled,
  });

  const labelCount = useMemo(() => {
    if (!chunk) return 0;
    return new Set(chunk.records.map((record) => record.label)).size;
  }, [chunk]);

  const compareLabelCount = useMemo(() => {
    if (!compareChunk) return 0;
    return new Set(compareChunk.records.map((record) => record.label)).size;
  }, [compareChunk]);

  const kpiGrid = (data: DataChunk | undefined, loading: boolean, activeLabels: number) => (
    <div className="grid gap-4 sm:grid-cols-2">
      <KpiCard
        label="Total Records"
        value={loading ? 'Loading...' : `${(data?.total ?? datasetSize.value).toLocaleString()}`}
        trend="+8.2%"
        helper="Across all sources"
      />
      <KpiCard
        label="Active Labels"
        value={loading ? '—' : `${activeLabels}`}
        trend="+4 new"
        helper="Top 3: A, B, C"
      />
      <KpiCard
        label="Avg. Feature Length"
        value={loading ? '—' : `${data?.records[0]?.features.length ?? 0}`}
        helper="Embedding vector size"
      />
      <KpiCard
        label="Anomaly Rate"
        value={loading ? '—' : '0.34%'}
        trend="-0.08%"
        helper="Outliers flagged"
      />
    </div>
  );

  if (compareEnabled) {
    return (
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span>Primary dataset</span>
            <span>{datasetSize.label}</span>
          </div>
          {kpiGrid(chunk, isLoading, labelCount)}
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span>Compare dataset</span>
            <span>{compareDatasetSize.label}</span>
          </div>
          {kpiGrid(compareChunk, isCompareLoading, compareLabelCount)}
        </div>
      </section>
    );
  }

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label="Total Records"
        value={isLoading ? 'Loading...' : `${(chunk?.total ?? datasetSize.value).toLocaleString()}`}
        trend="+8.2%"
        helper="Across all sources"
      />
      <KpiCard
        label="Active Labels"
        value={isLoading ? '—' : `${labelCount}`}
        trend="+4 new"
        helper="Top 3: A, B, C"
      />
      <KpiCard
        label="Avg. Feature Length"
        value={isLoading ? '—' : `${chunk?.records[0]?.features.length ?? 0}`}
        helper="Embedding vector size"
      />
      <KpiCard
        label="Anomaly Rate"
        value={isLoading ? '—' : '0.34%'}
        trend="-0.08%"
        helper="Outliers flagged"
      />
    </section>
  );
}
