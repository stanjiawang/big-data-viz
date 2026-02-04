type ErrorStateProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryCount?: number;
  nextRetryInSeconds?: number | null;
};

export function ErrorState({
  title = 'Something went wrong',
  message = 'Please try again.',
  onRetry,
  retryCount,
  nextRetryInSeconds,
}: ErrorStateProps) {
  return (
    <div className="flex h-full min-h-[160px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">
      <div className="text-xs font-semibold uppercase tracking-wide text-rose-500">{title}</div>
      <div>{message}</div>
      {typeof retryCount === 'number' ? (
        <div className="text-xs text-rose-500">Retries: {retryCount}</div>
      ) : null}
      {typeof nextRetryInSeconds === 'number' ? (
        <div className="text-xs text-rose-500">Retrying in {nextRetryInSeconds}s</div>
      ) : null}
      {onRetry ? (
        <button
          type="button"
          className="rounded-full border border-rose-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose-600"
          onClick={onRetry}
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}
