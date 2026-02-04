type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-200/80 ${className ?? ''}`}
      aria-hidden="true"
    />
  );
}

export function SkeletonText({ className }: SkeletonProps) {
  return <Skeleton className={`h-3 ${className ?? ''}`} />;
}
