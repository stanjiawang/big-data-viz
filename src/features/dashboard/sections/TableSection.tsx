import type { DragEvent } from 'react';
import { useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { useI18n } from '@/i18n/useI18n';
import { LargeDataTable } from '@/features/table/LargeDataTable';
import { SectionCardActions } from '@/features/dashboard/sections/shared';
import type { DashboardSectionProps } from '@/features/dashboard/sections/types';
import { useDragReorder } from '@/features/dashboard/ui/useDragReorder';

const TABLE_CARD_IDS = ['primary', 'compare'] as const;
type TableCardId = (typeof TABLE_CARD_IDS)[number];

export function TableSection({
  datasetSize,
  compareDatasetSize,
  compareEnabled,
  filters,
  onOpenDetail,
  onAnnotate,
  draggable = false,
}: DashboardSectionProps) {
  const { t } = useI18n();
  const primaryTableRef = useRef<HTMLDivElement | null>(null);
  const compareTableRef = useRef<HTMLDivElement | null>(null);
  const tableCardReorder = useDragReorder(TABLE_CARD_IDS, 'bdv_table_cards_order');
  const createDragHandle = (cardId: TableCardId) =>
    draggable
      ? {
          isDragging: tableCardReorder.draggingId === cardId,
          onDragStart: (event: DragEvent<HTMLDivElement>) => {
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', cardId);
            tableCardReorder.onDragStart(cardId);
          },
          onDragEnd: tableCardReorder.onDragEnd,
        }
      : undefined;

  if (compareEnabled) {
    const cardById = {
      primary: (
        <Card
          title={t('sectionTablePrimaryTitle')}
          description={t('sectionTableDescription')}
          subtitle={t('techVirtual')}
          dragHandle={createDragHandle('primary')}
          actions={
            <SectionCardActions
              onOpenDetail={onOpenDetail ? () => onOpenDetail('table') : undefined}
              onAnnotate={onAnnotate ? () => onAnnotate('tablePrimary') : undefined}
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
          dragHandle={createDragHandle('compare')}
          actions={
            <SectionCardActions
              onAnnotate={onAnnotate ? () => onAnnotate('tableCompare') : undefined}
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
            onDragOver={(event) => tableCardReorder.onDragOver(event, cardId)}
            onDrop={() => tableCardReorder.onDrop(cardId)}
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
          onAnnotate={onAnnotate ? () => onAnnotate('tablePrimary') : undefined}
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
