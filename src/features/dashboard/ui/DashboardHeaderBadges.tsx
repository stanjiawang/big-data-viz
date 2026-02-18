import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';

type DashboardHeaderBadgesProps = {
  items: string[];
  isLoading: boolean;
};

export function DashboardHeaderBadges({ items, isLoading }: DashboardHeaderBadgesProps) {
  if (isLoading) {
    return (
      <div className="flex min-h-7 flex-nowrap gap-2 overflow-x-auto">
        {items.map((_, index) => (
          <Skeleton key={index} className="h-7 w-28 rounded-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex min-h-7 flex-nowrap gap-2 overflow-x-auto">
      {items.map((label) => (
        <Badge key={label} label={label} />
      ))}
    </div>
  );
}
