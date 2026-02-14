import { useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { useI18n } from '@/i18n/useI18n';
import { LargeDataTable } from '@/features/table/LargeDataTable';
import { SectionCardActions } from '@/features/dashboard/sections/shared';
import type { DashboardSectionProps } from '@/features/dashboard/sections/types';
import { useDragReorder } from '@/features/dashboard/ui/useDragReorder';

const TABLE_CARD_IDS = ['primary', 'compare'] as const;

export function TableSection({
  datasetSize,
  compareDatasetSize,
  compareEnabled,
  filters,
  onOpenDetail,
  draggable = false,
}: DashboardSectionProps) {
  const { t } = useI18n();
  const primaryTableRef = useRef<HTMLDivElement | null>(null);
  const compareTableRef = useRef<HTMLDivElement | null>(null);
  const tableCardReorder = useDragReorder(TABLE_CARD_IDS, 'bdv_table_cards_order');

  if (compareEnabled) {
    const cardById = {
      primary: (
        <Card
          title={t('sectionTablePrimaryTitle')}
          description={t('sectionTableDescription')}
          subtitle={t('techVirtual')}
          actions={
            <SectionCardActions
              onOpenDetail={onOpenDetail ? () => onOpenDetail('table') : undefined}
              exportTargetRef={primaryTableRef}
              exportFileName="large-table-primary"
            />
          }
        >
          <LargeDataTable
            total={datasetSize.value}
            filters={filters}
            exportTargetRef={primaryTableRef}
          />
        </Card>
      ),
      compare: (
        <Card
          title={t('sectionTableCompareTitle')}
          description={t('sectionTableDescription')}
          subtitle={t('techVirtual')}
          actions={
            <SectionCardActions
              exportTargetRef={compareTableRef}
              exportFileName="large-table-compare"
            />
          }
        >
          <LargeDataTable
            total={compareDatasetSize.value}
            filters={filters}
            exportTargetRef={compareTableRef}
          />
        </Card>
      ),
    } as const;

    return (
      <section className="grid gap-6 lg:grid-cols-2">
        {tableCardReorder.order.map((cardId) => (
          <div
            key={cardId}
            className={`${tableCardReorder.overId === cardId && tableCardReorder.draggingId !== cardId ? 'rounded-xl ring-2 ring-blue-200' : ''}`}
            draggable={draggable}
            onDragStart={() => tableCardReorder.onDragStart(cardId)}
            onDragOver={(event) => tableCardReorder.onDragOver(event, cardId)}
            onDrop={() => tableCardReorder.onDrop(cardId)}
            onDragEnd={tableCardReorder.onDragEnd}
          >
            {cardById[cardId]}
          </div>
        ))}
      </section>
    );
  }

  return (
    <Card
      title={t('sectionTableTitle')}
      description={t('sectionTableDescription')}
      subtitle={t('techVirtual')}
      actions={
        <SectionCardActions
          onOpenDetail={onOpenDetail ? () => onOpenDetail('table') : undefined}
          exportTargetRef={primaryTableRef}
          exportFileName="large-table"
        />
      }
    >
      <LargeDataTable
        total={datasetSize.value}
        filters={filters}
        exportTargetRef={primaryTableRef}
      />
    </Card>
  );
}
