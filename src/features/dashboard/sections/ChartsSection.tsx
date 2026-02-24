import { useRef, useState, type DragEvent } from 'react';
import { Card } from '@/components/ui/Card';
import { AsyncBoundary } from '@/components/ui/AsyncBoundary';
import { UI_BUTTON_GHOST_SM, UI_INPUT_MD, UI_LABEL_CLASS } from '@/components/ui/styleTokens';
import { useI18n } from '@/i18n/useI18n';
import { useGraphSuspense } from '@/features/data/queries/useGraph';
import { useMockDataSuspense } from '@/features/data/queries/useMockData';
import { useTimeSeriesSuspense } from '@/features/data/queries/useTimeSeries';
import { LABEL_OPTIONS } from '@/features/dashboard/constants/filterOptions';
import {
  LazyD3EmbeddingScatter,
  LazyEmbeddingCloud,
  LazyRelationshipGraph,
  LazyTimeSeriesChart,
} from '@/features/dashboard/sections/LazyVisualizations';
import { RangeSummary, SectionCardActions } from '@/features/dashboard/sections/SectionShared';
import type { DashboardSectionProps } from '@/features/dashboard/sections/types';
import { useDragReorder } from '@/features/dashboard/ui/useDragReorder';
import {
  type ChartDefinition,
  resolveChartDefinitions,
} from '@/features/visualizations/chartRegistry';

const CHART_CARD_IDS = ['timeSeries', 'embedding', 'graph', 'd3'] as const;

function mapClusterToLabel(cluster: string) {
  const match = /cluster-(\d+)/i.exec(cluster);
  const rawIndex = match ? Number(match[1]) - 1 : 0;
  const safeIndex = Number.isNaN(rawIndex)
    ? 0
    : ((rawIndex % LABEL_OPTIONS.length) + LABEL_OPTIONS.length) % LABEL_OPTIONS.length;
  return LABEL_OPTIONS[safeIndex];
}

export function ChartsSection({
  datasetSize,
  filters,
  expanded = false,
  onOpenDetail,
  onCrossFilter,
  focusView,
  draggable = false,
}: DashboardSectionProps) {
  const { t } = useI18n();
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
  const chartCardReorder = useDragReorder(CHART_CARD_IDS, 'bdv_charts_cards_order');
  const timeSeriesImageRef = useRef<HTMLDivElement | null>(null);
  const embeddingImageRef = useRef<HTMLDivElement | null>(null);
  const graphImageRef = useRef<HTMLDivElement | null>(null);
  const d3ImageRef = useRef<HTMLDivElement | null>(null);

  const timeYMinValue = timeYMin === '' ? undefined : Number(timeYMin);
  const timeYMaxValue = timeYMax === '' ? undefined : Number(timeYMax);

  const createDragHandle = (cardId: ChartDefinition['id']) =>
    draggable
      ? {
          isDragging: chartCardReorder.draggingId === cardId,
          onDragStart: (event: DragEvent<HTMLDivElement>) => {
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', cardId);
            chartCardReorder.onDragStart(cardId);
          },
          onDragEnd: chartCardReorder.onDragEnd,
        }
      : undefined;

  const coreDefinitions: ChartDefinition[] = [
    {
      id: 'timeSeries',
      order: 10,
      getTitle: () => t('sectionTimeSeriesTitle'),
      render: () => (
        <Card
          title={t('sectionTimeSeriesTitle')}
          description={t('sectionTimeSeriesDescription')}
          subtitle={t('techEchartsQuery')}
          className="flex h-full flex-col"
          contentClassName="flex-1"
          dragHandle={createDragHandle('timeSeries')}
          actions={
            <SectionCardActions
              onOpenDetail={onOpenDetail ? () => onOpenDetail('timeSeries') : undefined}
              exportTargetRef={timeSeriesImageRef}
              exportFileName="time-series"
            />
          }
        >
          <div className="space-y-3">
            <AsyncBoundary
              fallback={<div className={`${expanded ? 'h-[420px]' : 'h-[260px]'}`} />}
              errorTitle={t('dashboardChartsFailedTitle')}
              errorMessage={t('dashboardChartsFailedMessage')}
            >
              <LazyTimeSeriesChart
                data={timeSeries}
                height={expanded ? 420 : 260}
                xStartPercent={timeXStart}
                xEndPercent={timeXEnd}
                yMin={timeYMinValue}
                yMax={timeYMaxValue}
                exportTargetRef={timeSeriesImageRef}
              />
            </AsyncBoundary>
            <div className="border-t border-slate-100 pt-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <RangeSummary xStart={timeXStart} xEnd={timeXEnd} yMin={timeYMin} yMax={timeYMax} />
                <button
                  type="button"
                  className={`${UI_BUTTON_GHOST_SM} h-9 px-2`}
                  onClick={() => {
                    setTimeXStart(0);
                    setTimeXEnd(100);
                    setTimeYMin('');
                    setTimeYMax('');
                  }}
                >
                  {t('reset')}
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="space-y-1 text-xs text-slate-600">
                  <span className={UI_LABEL_CLASS}>{t('xStart')}</span>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(0, timeXEnd - 1)}
                    value={timeXStart}
                    onChange={(event) => setTimeXStart(Number(event.target.value))}
                    className="liquid-range w-full accent-blue-600"
                  />
                </label>
                <label className="space-y-1 text-xs text-slate-600">
                  <span className={UI_LABEL_CLASS}>{t('xEnd')}</span>
                  <input
                    type="range"
                    min={Math.min(100, timeXStart + 1)}
                    max={100}
                    value={timeXEnd}
                    onChange={(event) => setTimeXEnd(Number(event.target.value))}
                    className="liquid-range w-full accent-blue-600"
                  />
                </label>
                <label className="space-y-1 text-xs text-slate-600">
                  <span className={UI_LABEL_CLASS}>{t('yMin')}</span>
                  <input
                    type="number"
                    value={timeYMin}
                    onChange={(event) => setTimeYMin(event.target.value)}
                    className={`${UI_INPUT_MD} h-9 px-2 py-1`}
                  />
                </label>
                <label className="space-y-1 text-xs text-slate-600">
                  <span className={UI_LABEL_CLASS}>{t('yMax')}</span>
                  <input
                    type="number"
                    value={timeYMax}
                    onChange={(event) => setTimeYMax(event.target.value)}
                    className={`${UI_INPUT_MD} h-9 px-2 py-1`}
                  />
                </label>
              </div>
            </div>
          </div>
        </Card>
      ),
    },
    {
      id: 'embedding',
      order: 20,
      getTitle: () => t('sectionEmbeddingTitle'),
      render: () => (
        <Card
          title={t('sectionEmbeddingTitle')}
          description={t('sectionEmbeddingDescription')}
          subtitle={t('techDeckGl')}
          className="flex h-full flex-col"
          contentClassName="flex-1"
          dragHandle={createDragHandle('embedding')}
          actions={
            <SectionCardActions
              onOpenDetail={onOpenDetail ? () => onOpenDetail('embedding') : undefined}
              exportTargetRef={embeddingImageRef}
              exportFileName="embedding-cloud"
            />
          }
        >
          <AsyncBoundary
            fallback={<div className={`${expanded ? 'h-[620px]' : 'h-[360px]'}`} />}
            errorTitle={t('dashboardChartsFailedTitle')}
            errorMessage={t('dashboardChartsFailedMessage')}
          >
            <LazyEmbeddingCloud
              records={chunk?.records}
              height={expanded ? 620 : 360}
              exportTargetRef={embeddingImageRef}
              onPointClick={(point) => {
                onCrossFilter?.({
                  labels: [point.label],
                  label: point.label,
                  source: point.source,
                });
              }}
            />
          </AsyncBoundary>
        </Card>
      ),
    },
    {
      id: 'graph',
      order: 30,
      getTitle: () => t('sectionGraphTitle'),
      render: () => (
        <Card
          title={t('sectionGraphTitle')}
          description={t('sectionGraphDescription')}
          subtitle={t('techSigma')}
          className="flex h-full flex-col"
          contentClassName="flex-1"
          dragHandle={createDragHandle('graph')}
          actions={
            <SectionCardActions
              onOpenDetail={onOpenDetail ? () => onOpenDetail('graph') : undefined}
              exportTargetRef={graphImageRef}
              exportFileName="relationship-graph"
            />
          }
        >
          <AsyncBoundary
            fallback={<div className={`${expanded ? 'h-[620px]' : 'h-[380px]'}`} />}
            errorTitle={t('dashboardChartsFailedTitle')}
            errorMessage={t('dashboardChartsFailedMessage')}
          >
            <LazyRelationshipGraph
              data={graph}
              height={expanded ? 620 : 380}
              exportTargetRef={graphImageRef}
              onClusterSelect={(cluster) => {
                const label = mapClusterToLabel(cluster);
                onCrossFilter?.({
                  label,
                  labels: [label],
                  search: cluster,
                });
              }}
              onNodeSelect={(nodeId) => {
                onCrossFilter?.({
                  search: nodeId,
                });
              }}
            />
          </AsyncBoundary>
        </Card>
      ),
    },
    {
      id: 'd3',
      order: 40,
      getTitle: () => t('sectionD3Title'),
      render: () => (
        <Card
          title={t('sectionD3Title')}
          description={t('sectionD3Description')}
          subtitle={t('techD3')}
          className="flex h-full flex-col"
          contentClassName="flex-1"
          dragHandle={createDragHandle('d3')}
          actions={
            <SectionCardActions
              onOpenDetail={onOpenDetail ? () => onOpenDetail('d3') : undefined}
              exportTargetRef={d3ImageRef}
              exportFileName="d3-mock-data-demo"
            />
          }
        >
          <AsyncBoundary
            fallback={<div className={`${expanded ? 'h-[620px]' : 'h-[380px]'}`} />}
            errorTitle={t('dashboardChartsFailedTitle')}
            errorMessage={t('dashboardChartsFailedMessage')}
          >
            <LazyD3EmbeddingScatter
              records={chunk?.records}
              height={expanded ? 620 : 380}
              exportTargetRef={d3ImageRef}
              onPointClick={(point) => {
                onCrossFilter?.({
                  label: point.label,
                  labels: [point.label],
                });
              }}
            />
          </AsyncBoundary>
        </Card>
      ),
    },
  ];

  const chartDefinitions = resolveChartDefinitions(coreDefinitions);

  if (focusView) {
    const focusedCard = chartDefinitions
      .find((definition) => definition.id === focusView)
      ?.render();
    return focusedCard ? <section className="grid grid-cols-1 gap-6">{focusedCard}</section> : null;
  }

  const cardById = new Map(
    chartDefinitions.map((definition) => [definition.id, definition.render()] as const),
  );

  return (
    <section className="grid gap-6 lg:grid-cols-2 xl:grid-cols-12">
      {chartCardReorder.order
        .filter((cardId) => cardById.has(cardId))
        .map((cardId) => (
          <div
            key={cardId}
            className={`xl:col-span-6 ${chartCardReorder.overId === cardId && chartCardReorder.draggingId !== cardId ? 'rounded-xl ring-2 ring-blue-200' : ''}`}
            onDragOver={(event) => chartCardReorder.onDragOver(event, cardId)}
            onDrop={() => chartCardReorder.onDrop(cardId)}
          >
            {cardById.get(cardId)}
          </div>
        ))}
    </section>
  );
}
