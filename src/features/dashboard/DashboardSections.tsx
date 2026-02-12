import { useMemo, useState } from 'react';
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
  expanded?: boolean;
  onOpenDetail?: (_view: DetailView) => void;
  focusView?: Extract<DetailView, 'timeSeries' | 'embedding' | 'graph'>;
};

export type DetailView = 'summary' | 'timeSeries' | 'embedding' | 'graph' | 'table';

function DetailButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
      onClick={onClick}
    >
      Open detail
    </button>
  );
}

function RangeSummary({
  xStart,
  xEnd,
  yMin,
  yMax,
}: {
  xStart: number;
  xEnd: number;
  yMin: string;
  yMax: string;
}) {
  return (
    <div className="text-[11px] text-slate-500 sm:text-xs">
      X: {xStart}% - {xEnd}% | Y: {yMin || 'auto'} - {yMax || 'auto'}
    </div>
  );
}

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

export function SummarySection({ datasetSize, filters, expanded = false }: DashboardSectionProps) {
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

  const [barXStart, setBarXStart] = useState(0);
  const [barXEnd, setBarXEnd] = useState(100);
  const [barYMin, setBarYMin] = useState<string>('');
  const [barYMax, setBarYMax] = useState<string>('');

  const barYMinValue = barYMin === '' ? undefined : Number(barYMin);
  const barYMaxValue = barYMax === '' ? undefined : Number(barYMax);

  return (
    <div className="space-y-4">
      <PieChart title="Label Distribution" data={labelDistribution} height={expanded ? 280 : 200} />
      <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <RangeSummary xStart={barXStart} xEnd={barXEnd} yMin={barYMin} yMax={barYMax} />
          <button
            type="button"
            className="rounded-full border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500"
            onClick={() => {
              setBarXStart(0);
              setBarXEnd(100);
              setBarYMin('');
              setBarYMax('');
            }}
          >
            Reset
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-xs text-slate-600">
            <span className="font-semibold uppercase tracking-wide">X Range Start (%)</span>
            <input
              type="range"
              min={0}
              max={Math.max(0, barXEnd - 1)}
              value={barXStart}
              onChange={(event) => setBarXStart(Number(event.target.value))}
              className="w-full"
            />
          </label>
          <label className="space-y-1 text-xs text-slate-600">
            <span className="font-semibold uppercase tracking-wide">X Range End (%)</span>
            <input
              type="range"
              min={Math.min(100, barXStart + 1)}
              max={100}
              value={barXEnd}
              onChange={(event) => setBarXEnd(Number(event.target.value))}
              className="w-full"
            />
          </label>
          <label className="space-y-1 text-xs text-slate-600">
            <span className="font-semibold uppercase tracking-wide">Y Min</span>
            <input
              type="number"
              value={barYMin}
              onChange={(event) => setBarYMin(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-2 py-1"
            />
          </label>
          <label className="space-y-1 text-xs text-slate-600">
            <span className="font-semibold uppercase tracking-wide">Y Max</span>
            <input
              type="number"
              value={barYMax}
              onChange={(event) => setBarYMax(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-2 py-1"
            />
          </label>
        </div>
      </div>
      <BarChart
        title="Source Volume"
        categories={sourceDistribution.categories}
        values={sourceDistribution.values}
        height={expanded ? 280 : 200}
        xStartPercent={barXStart}
        xEndPercent={barXEnd}
        yMin={barYMinValue}
        yMax={barYMaxValue}
      />
    </div>
  );
}

export function ChartsSection({
  datasetSize,
  filters,
  expanded = false,
  onOpenDetail,
  focusView,
}: DashboardSectionProps) {
  const { data: timeSeries } = useTimeSeriesSuspense('ingestion');
  const { data: graph } = useGraphSuspense();
  const { data: chunk } = useMockDataSuspense({
    total: datasetSize.value,
    offset: 0,
    limit: 1000,
    vectorSize: 128,
    filters,
  });

  const [timeXStart, setTimeXStart] = useState(0);
  const [timeXEnd, setTimeXEnd] = useState(100);
  const [timeYMin, setTimeYMin] = useState<string>('');
  const [timeYMax, setTimeYMax] = useState<string>('');

  const timeYMinValue = timeYMin === '' ? undefined : Number(timeYMin);
  const timeYMaxValue = timeYMax === '' ? undefined : Number(timeYMax);

  return (
    <section
      className={`grid gap-6 ${focusView ? 'grid-cols-1' : 'md:grid-cols-2 lg:grid-cols-12'}`}
    >
      {(focusView === undefined || focusView === 'timeSeries') && (
        <Card
          title="Time Series"
          description="Ingestion and quality trends."
          className={`${focusView ? 'lg:col-span-12' : 'lg:col-span-4'} flex h-full flex-col`}
          contentClassName="flex-1"
          actions={
            onOpenDetail ? <DetailButton onClick={() => onOpenDetail('timeSeries')} /> : null
          }
        >
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <RangeSummary xStart={timeXStart} xEnd={timeXEnd} yMin={timeYMin} yMax={timeYMax} />
              <button
                type="button"
                className="rounded-full border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500"
                onClick={() => {
                  setTimeXStart(0);
                  setTimeXEnd(100);
                  setTimeYMin('');
                  setTimeYMax('');
                }}
              >
                Reset
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="space-y-1 text-xs text-slate-600">
                <span className="font-semibold uppercase tracking-wide">X Start (%)</span>
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, timeXEnd - 1)}
                  value={timeXStart}
                  onChange={(event) => setTimeXStart(Number(event.target.value))}
                  className="w-full"
                />
              </label>
              <label className="space-y-1 text-xs text-slate-600">
                <span className="font-semibold uppercase tracking-wide">X End (%)</span>
                <input
                  type="range"
                  min={Math.min(100, timeXStart + 1)}
                  max={100}
                  value={timeXEnd}
                  onChange={(event) => setTimeXEnd(Number(event.target.value))}
                  className="w-full"
                />
              </label>
              <label className="space-y-1 text-xs text-slate-600">
                <span className="font-semibold uppercase tracking-wide">Y Min</span>
                <input
                  type="number"
                  value={timeYMin}
                  onChange={(event) => setTimeYMin(event.target.value)}
                  className="w-full rounded-md border border-slate-300 px-2 py-1"
                />
              </label>
              <label className="space-y-1 text-xs text-slate-600">
                <span className="font-semibold uppercase tracking-wide">Y Max</span>
                <input
                  type="number"
                  value={timeYMax}
                  onChange={(event) => setTimeYMax(event.target.value)}
                  className="w-full rounded-md border border-slate-300 px-2 py-1"
                />
              </label>
            </div>
            <TimeSeriesChart
              data={timeSeries}
              height={expanded ? 420 : 260}
              xStartPercent={timeXStart}
              xEndPercent={timeXEnd}
              yMin={timeYMinValue}
              yMax={timeYMaxValue}
            />
          </div>
        </Card>
      )}
      {(focusView === undefined || focusView === 'embedding') && (
        <Card
          title="Embedding Cloud"
          description="High-density point cloud view."
          className={`${focusView ? 'lg:col-span-12' : 'lg:col-span-4'} flex h-full flex-col`}
          contentClassName="flex-1"
          actions={onOpenDetail ? <DetailButton onClick={() => onOpenDetail('embedding')} /> : null}
        >
          <EmbeddingCloud records={chunk?.records} height={expanded ? 620 : 360} />
        </Card>
      )}
      {(focusView === undefined || focusView === 'graph') && (
        <Card
          title="Relationship Graph"
          description="Entity linkage and clusters."
          className={`${focusView ? 'lg:col-span-12' : 'lg:col-span-4'} flex h-full flex-col`}
          contentClassName="flex-1"
          actions={onOpenDetail ? <DetailButton onClick={() => onOpenDetail('graph')} /> : null}
        >
          <RelationshipGraph data={graph} height={expanded ? 620 : 380} />
        </Card>
      )}
    </section>
  );
}

export function TableSection({
  datasetSize,
  compareDatasetSize,
  compareEnabled,
  filters,
  onOpenDetail,
}: DashboardSectionProps) {
  if (compareEnabled) {
    return (
      <section className="grid gap-6 lg:grid-cols-2">
        <Card
          title="Large Table (Primary)"
          description="Virtualized grid for multi-million row browsing."
          actions={onOpenDetail ? <DetailButton onClick={() => onOpenDetail('table')} /> : null}
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
    <Card
      title="Large Table"
      description="Virtualized grid for multi-million row browsing."
      actions={onOpenDetail ? <DetailButton onClick={() => onOpenDetail('table')} /> : null}
    >
      <LargeDataTable total={datasetSize.value} filters={filters} />
    </Card>
  );
}
