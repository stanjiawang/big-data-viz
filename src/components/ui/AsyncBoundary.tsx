import type { ReactNode } from 'react';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useQueryErrorResetBoundary } from '@tanstack/react-query';
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
  onReset: () => void;
  errorTitle?: string;
  errorMessage?: string;
  autoRetry: boolean;
  maxRetries: number;
  baseDelayMs: number;
};

function ErrorFallback({
  onReset,
  errorTitle,
  errorMessage,
  autoRetry,
  maxRetries,
  baseDelayMs,
}: ErrorFallbackProps) {
  const [retryCount, setRetryCount] = useState(0);

  const delaySeconds = useMemo(() => {
    if (!autoRetry || retryCount >= maxRetries) return null;
    const delayMs = baseDelayMs * Math.pow(2, retryCount);
    return Math.max(1, Math.ceil(delayMs / 1000));
  }, [autoRetry, baseDelayMs, maxRetries, retryCount]);

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
      title={errorTitle}
      message={errorMessage}
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
  autoRetry = true,
  maxRetries = 3,
  baseDelayMs = 1000,
}: AsyncBoundaryProps) {
  const { reset } = useQueryErrorResetBoundary();

  return (
    <ErrorBoundary
      onReset={reset}
      fallbackRender={({ resetErrorBoundary }) => (
        <ErrorFallback
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
