import { Skeleton, SkeletonText } from '@/components/ui/Skeleton';

export function KpiSkeletonGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <SkeletonText className="w-24" />
          <Skeleton className="mt-4 h-7 w-24" />
          <SkeletonText className="mt-3 w-20" />
        </div>
      ))}
    </div>
  );
}

export function SummarySkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
        <SkeletonText className="w-32" />
        <Skeleton className="h-40 w-full" />
      </div>
      <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
        <SkeletonText className="w-28" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  );
}

export function ChartsRowSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-12">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-4"
        >
          <SkeletonText className="w-24" />
          <SkeletonText className="mt-2 w-40" />
          <Skeleton className="mt-4 h-40 w-full" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <SkeletonText className="w-32" />
      <SkeletonText className="mt-2 w-48" />
      <div className="mt-4 space-y-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-8 w-full" />
        ))}
      </div>
    </div>
  );
}

export function FiltersSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="space-y-2">
          <SkeletonText className="w-24" />
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
    </div>
  );
}
