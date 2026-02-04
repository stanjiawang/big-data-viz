import { useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
import type { DataChunk, MockFilters } from '@/lib/types';
import { BarChart } from '@/features/charts/BarChart';
import { PieChart } from '@/features/charts/PieChart';
import { TimeSeriesChart } from '@/features/charts/TimeSeriesChart';
import { useGraphSuspense } from '@/features/data/queries/useGraph';
import { useMockData, useMockDataSuspense } from '@/features/data/queries/useMockData';
import { useTimeSeriesSuspense } from '@/features/data/queries/useTimeSeries';
import { EmbeddingCloud } from '@/features/embeddings/EmbeddingCloud';
import { RelationshipGraph } from '@/features/graph/RelationshipGraph';
import { LargeDataTable } from '@/features/table/LargeDataTable';
import {
  DATASET_SIZES,
  LABEL_OPTIONS,
  SOURCE_OPTIONS,
} from '@/features/dashboard/dashboardFilters';

export type DashboardSectionProps = {
  datasetSize: (typeof DATASET_SIZES)[number];
  compareDatasetSize: (typeof DATASET_SIZES)[number];
  compareEnabled: boolean;
  filters: MockFilters;
};

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

export function SummarySection({ datasetSize, filters }: DashboardSectionProps) {
  const { data: chunk } = useMockDataSuspense({
    total: datasetSize.value,
    offset: 0,
    limit: 1000,
    vectorSize: 128,
    filters,
  });

  const labelDistribution = useMemo(() => {
    const counts = new Map<string, number>();
    chunk?.records.forEach((record) => {
      counts.set(record.label, (counts.get(record.label) ?? 0) + 1);
    });
    return LABEL_OPTIONS.map((label) => ({
      name: label,
      value: counts.get(label) ?? 0,
    }));
  }, [chunk]);

  const sourceDistribution = useMemo(() => {
    const counts = new Map<string, number>();
    chunk?.records.forEach((record) => {
      counts.set(record.source, (counts.get(record.source) ?? 0) + 1);
    });

    const categories = SOURCE_OPTIONS.filter((source) => source !== 'all');
    return {
      categories,
      values: categories.map((source) => counts.get(source) ?? 0),
    };
  }, [chunk]);

  return (
    <div className="space-y-4">
      <PieChart title="Label Distribution" data={labelDistribution} height={200} />
      <BarChart
        title="Source Volume"
        categories={sourceDistribution.categories}
        values={sourceDistribution.values}
        height={200}
      />
    </div>
  );
}

export function ChartsSection({ datasetSize, filters }: DashboardSectionProps) {
  const { data: timeSeries } = useTimeSeriesSuspense('ingestion');
  const { data: graph } = useGraphSuspense();
  const { data: chunk } = useMockDataSuspense({
    total: datasetSize.value,
    offset: 0,
    limit: 1000,
    vectorSize: 128,
    filters,
  });

  return (
    <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-12">
      <Card
        title="Time Series"
        description="Ingestion and quality trends."
        className="lg:col-span-4 flex h-full flex-col"
        contentClassName="flex-1"
      >
        <TimeSeriesChart data={timeSeries} height={220} />
      </Card>
      <Card
        title="Embedding Cloud"
        description="High-density point cloud view."
        className="lg:col-span-4 flex h-full flex-col"
        contentClassName="flex-1"
      >
        <EmbeddingCloud records={chunk?.records} />
      </Card>
      <Card
        title="Relationship Graph"
        description="Entity linkage and clusters."
        className="lg:col-span-4 flex h-full flex-col"
        contentClassName="flex-1"
      >
        <RelationshipGraph data={graph} height={260} />
      </Card>
    </section>
  );
}

export function TableSection({
  datasetSize,
  compareDatasetSize,
  compareEnabled,
  filters,
}: DashboardSectionProps) {
  if (compareEnabled) {
    return (
      <section className="grid gap-6 lg:grid-cols-2">
        <Card
          title="Large Table (Primary)"
          description="Virtualized grid for multi-million row browsing."
        >
          <LargeDataTable total={datasetSize.value} filters={filters} />
        </Card>
        <Card
          title="Large Table (Compare)"
          description="Virtualized grid for multi-million row browsing."
        >
          <LargeDataTable total={compareDatasetSize.value} filters={filters} />
        </Card>
      </section>
    );
  }

  return (
    <Card title="Large Table" description="Virtualized grid for multi-million row browsing.">
      <LargeDataTable total={datasetSize.value} filters={filters} />
    </Card>
  );
}
