import { Card } from '@/components/ui/Card';
import { LargeDataTable } from '@/features/table/LargeDataTable';
import { DetailButton } from '@/features/dashboard/sections/shared';
import type { DashboardSectionProps } from '@/features/dashboard/sections/types';

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
          subtitle="Tech stack: TanStack Virtual + React Query"
          actions={onOpenDetail ? <DetailButton onClick={() => onOpenDetail('table')} /> : null}
        >
          <LargeDataTable total={datasetSize.value} filters={filters} />
        </Card>
        <Card
          title="Large Table (Compare)"
          description="Virtualized grid for multi-million row browsing."
          subtitle="Tech stack: TanStack Virtual + React Query"
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
      subtitle="Tech stack: TanStack Virtual + React Query"
      actions={onOpenDetail ? <DetailButton onClick={() => onOpenDetail('table')} /> : null}
    >
      <LargeDataTable total={datasetSize.value} filters={filters} />
    </Card>
  );
}
