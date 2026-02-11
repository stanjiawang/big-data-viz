import type { ReactNode } from 'react';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import {
  QUERY_BOUNDARY_DEFAULTS,
  resolveQueryErrorCopy,
  shouldAutoRetryQueryError,
} from '@/app/queryErrorPolicy';
import { ErrorState } from '@/components/ui/ErrorState';

type AsyncBoundaryProps = {
  children: ReactNode;
  fallback: ReactNode;
  errorTitle?: string;
  errorMessage?: string;
  autoRetry?: boolean;
  maxRetries?: number;
  baseDelayMs?: number;
};

type ErrorFallbackProps = {
  error: unknown;
  onReset: () => void;
  errorTitle?: string;
  errorMessage?: string;
  autoRetry?: boolean;
  maxRetries: number;
  baseDelayMs: number;
};

function ErrorFallback({
  error,
  onReset,
  errorTitle,
  errorMessage,
  autoRetry,
  maxRetries,
  baseDelayMs,
}: ErrorFallbackProps) {
  const [retryCount, setRetryCount] = useState(0);
  const resolvedAutoRetry = autoRetry ?? shouldAutoRetryQueryError(error);
  const resolvedCopy = resolveQueryErrorCopy(error, errorTitle, errorMessage);

  const delaySeconds = useMemo(() => {
    if (!resolvedAutoRetry || retryCount >= maxRetries) return null;
    const delayMs = baseDelayMs * Math.pow(2, retryCount);
    return Math.max(1, Math.ceil(delayMs / 1000));
  }, [resolvedAutoRetry, baseDelayMs, maxRetries, retryCount]);

  const [nextRetryIn, setNextRetryIn] = useState<number | null>(delaySeconds);

  useEffect(() => {
    if (delaySeconds === null) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNextRetryIn(delaySeconds);

    const interval = window.setInterval(() => {
      setNextRetryIn((current) => (current && current > 1 ? current - 1 : current));
    }, 1000);

    const timer = window.setTimeout(() => {
      window.clearInterval(interval);
      setRetryCount((count) => count + 1);
      setNextRetryIn(null);
      onReset();
    }, delaySeconds * 1000);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timer);
    };
  }, [delaySeconds, onReset]);

  return (
    <ErrorState
      title={resolvedCopy.title}
      message={resolvedCopy.message}
      onRetry={onReset}
      retryCount={retryCount}
      nextRetryInSeconds={nextRetryIn}
    />
  );
}

export function AsyncBoundary({
  children,
  fallback,
  errorTitle,
  errorMessage,
  autoRetry,
  maxRetries = QUERY_BOUNDARY_DEFAULTS.maxRetries,
  baseDelayMs = QUERY_BOUNDARY_DEFAULTS.baseDelayMs,
}: AsyncBoundaryProps) {
  const { reset } = useQueryErrorResetBoundary();

  return (
    <ErrorBoundary
      onReset={reset}
      fallbackRender={({ error, resetErrorBoundary }) => (
        <ErrorFallback
          error={error}
          onReset={resetErrorBoundary}
          errorTitle={errorTitle}
          errorMessage={errorMessage}
          autoRetry={autoRetry}
          maxRetries={maxRetries}
          baseDelayMs={baseDelayMs}
        />
      )}
    >
      <Suspense fallback={fallback}>{children}</Suspense>
    </ErrorBoundary>
  );
}
