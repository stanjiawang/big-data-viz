import { Badge } from '@/components/ui/Badge';
import { UI_CHIP_INTERACTIVE } from '@/components/ui/styleTokens';
import { Skeleton } from '@/components/ui/Skeleton';

type DashboardHeaderBadgesProps = {
  items: string[];
  isLoading: boolean;
  searchBadgePrefix?: string;
  onSearchBadgeClick?: () => void;
};

export function DashboardHeaderBadges({
  items,
  isLoading,
  searchBadgePrefix,
  onSearchBadgeClick,
}: DashboardHeaderBadgesProps) {
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
      {items.map((label) => {
        const isSearchBadge =
          Boolean(searchBadgePrefix) && label.startsWith(searchBadgePrefix as string);
        if (isSearchBadge && onSearchBadgeClick) {
          return (
            <button
              key={label}
              type="button"
              className={UI_CHIP_INTERACTIVE}
              onClick={onSearchBadgeClick}
              aria-label="Focus search filter"
            >
              {label}
            </button>
          );
        }

        return <Badge key={label} label={label} />;
      })}
    </div>
  );
}
