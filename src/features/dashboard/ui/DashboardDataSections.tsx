import { memo, type Dispatch, type RefObject, type SetStateAction } from 'react';
import { AsyncBoundary } from '@/components/ui/AsyncBoundary';
import { Card } from '@/components/ui/Card';
import { FiltersPanel } from '@/features/dashboard/ui/FiltersPanel';
import {
  ChartsRowSkeleton,
  KpiSkeletonGrid,
  SummarySkeleton,
  TableSkeleton,
} from '@/features/dashboard/ui/SectionSkeletons';
import { KpiSection } from '@/features/dashboard/sections/KpiSection';
import { SectionCardActions } from '@/features/dashboard/sections/SectionShared';
import type { CrossFilterPatch, DetailView } from '@/features/dashboard/sections/types';
import { useDragReorder } from '@/features/dashboard/ui/useDragReorder';
import { ChartsSection, SummarySection, TableSection } from '@/features/dashboard/ui/LazySections';
import { useI18n } from '@/i18n/useI18n';
import type { MockFilters } from '@/lib/types';
import type { DatasetSizeOption } from './types';

const TOP_CARD_IDS = ['filters', 'summary'] as const;

type DashboardDataSectionsProps = {
  datasetSize: DatasetSizeOption;
  setDatasetSize: Dispatch<SetStateAction<DatasetSizeOption>>;
  filters: MockFilters;
  queryFilters: MockFilters;
  setFilters: Dispatch<SetStateAction<MockFilters>>;
  compareDatasetSize: DatasetSizeOption;
  effectiveCompareEnabled: boolean;
  selectedLabels: string[];
  weightMinValue: number;
  weightMaxValue: number;
  defaultWeightMin: number;
  defaultWeightMax: number;
  onCrossFilter: (_patch: CrossFilterPatch) => void;
  onOpenDetail: (_view: DetailView) => void;
  summaryCardRef: RefObject<HTMLElement | null>;
  summaryVisualizationRef: RefObject<HTMLDivElement | null>;
};

export const DashboardDataSections = memo(function DashboardDataSections({
  datasetSize,
  setDatasetSize,
  filters,
  queryFilters,
  setFilters,
  compareDatasetSize,
  effectiveCompareEnabled,
  selectedLabels,
  weightMinValue,
  weightMaxValue,
  defaultWeightMin,
  defaultWeightMax,
  onCrossFilter,
  onOpenDetail,
  summaryCardRef,
  summaryVisualizationRef,
}: DashboardDataSectionsProps) {
  const { t } = useI18n();
  const topCardReorder = useDragReorder(TOP_CARD_IDS, 'bdv_overview_top_cards_order');

  return (
    <div className="space-y-6">
      <AsyncBoundary
        fallback={<KpiSkeletonGrid />}
        errorTitle={t('dashboardMetricsFailedTitle')}
        errorMessage={t('dashboardMetricsFailedMessage')}
      >
        <KpiSection
          datasetSize={datasetSize}
          compareDatasetSize={compareDatasetSize}
          compareEnabled={effectiveCompareEnabled}
          filters={queryFilters}
        />
      </AsyncBoundary>

      <section className="grid gap-6 lg:grid-cols-12">
        {topCardReorder.order.map((cardId) => {
          if (cardId === 'filters') {
            return (
              <div
                key={cardId}
                className={`hidden lg:col-span-4 lg:block ${topCardReorder.overId === cardId && topCardReorder.draggingId !== cardId ? 'rounded-2xl ring-2 ring-blue-200' : ''}`}
                onDragOver={(event) => topCardReorder.onDragOver(event, cardId)}
                onDrop={() => topCardReorder.onDrop(cardId)}
              >
                <Card
                  title={t('dashboardFilters')}
                  description={t('sectionFiltersDescription')}
                  subtitle={t('techReactStateUrl')}
                  dragHandle={{
                    isDragging: topCardReorder.draggingId === cardId,
                    onDragStart: (event) => {
                      event.dataTransfer.effectAllowed = 'move';
                      event.dataTransfer.setData('text/plain', cardId);
                      topCardReorder.onDragStart(cardId);
                    },
                    onDragEnd: topCardReorder.onDragEnd,
                  }}
                >
                  <FiltersPanel
                    datasetSize={datasetSize}
                    setDatasetSize={setDatasetSize}
                    filters={filters}
                    setFilters={setFilters}
                    selectedLabels={selectedLabels}
                    weightMinValue={weightMinValue}
                    weightMaxValue={weightMaxValue}
                    defaultWeightMin={defaultWeightMin}
                    defaultWeightMax={defaultWeightMax}
                  />
                </Card>
              </div>
            );
          }

          return (
            <div
              key={cardId}
              className={`lg:col-span-8 ${topCardReorder.overId === cardId && topCardReorder.draggingId !== cardId ? 'rounded-2xl ring-2 ring-blue-200' : ''}`}
              onDragOver={(event) => topCardReorder.onDragOver(event, cardId)}
              onDrop={() => topCardReorder.onDrop(cardId)}
            >
              <Card
                sectionRef={summaryCardRef}
                title={t('sectionSummaryTitle')}
                description={t('sectionSummaryDescription')}
                subtitle={t('techEchartsQuery')}
                dragHandle={{
                  isDragging: topCardReorder.draggingId === cardId,
                  onDragStart: (event) => {
                    event.dataTransfer.effectAllowed = 'move';
                    event.dataTransfer.setData('text/plain', cardId);
                    topCardReorder.onDragStart(cardId);
                  },
                  onDragEnd: topCardReorder.onDragEnd,
                }}
                actions={
                  <SectionCardActions
                    onOpenDetail={() => onOpenDetail('summary')}
                    exportTargetRef={summaryVisualizationRef}
                    exportFileName="summary"
                  />
                }
              >
                <AsyncBoundary
                  fallback={<SummarySkeleton />}
                  errorTitle={t('dashboardSummaryFailedTitle')}
                  errorMessage={t('dashboardSummaryFailedMessage')}
                >
                  <SummarySection
                    datasetSize={datasetSize}
                    compareDatasetSize={compareDatasetSize}
                    compareEnabled={effectiveCompareEnabled}
                    filters={queryFilters}
                    onCrossFilter={onCrossFilter}
                    visualizationRef={summaryVisualizationRef}
                  />
                </AsyncBoundary>
              </Card>
            </div>
          );
        })}
      </section>

      <AsyncBoundary
        fallback={<ChartsRowSkeleton />}
        errorTitle={t('dashboardChartsFailedTitle')}
        errorMessage={t('dashboardChartsFailedMessage')}
      >
        <ChartsSection
          datasetSize={datasetSize}
          compareDatasetSize={compareDatasetSize}
          compareEnabled={effectiveCompareEnabled}
          filters={queryFilters}
          onCrossFilter={onCrossFilter}
          onOpenDetail={onOpenDetail}
          draggable
        />
      </AsyncBoundary>

      <AsyncBoundary
        fallback={<TableSkeleton />}
        errorTitle={t('dashboardTableFailedTitle')}
        errorMessage={t('dashboardTableFailedMessage')}
      >
        <TableSection
          datasetSize={datasetSize}
          compareDatasetSize={compareDatasetSize}
          compareEnabled={effectiveCompareEnabled}
          filters={queryFilters}
          onOpenDetail={onOpenDetail}
          draggable
        />
      </AsyncBoundary>
    </div>
  );
});
