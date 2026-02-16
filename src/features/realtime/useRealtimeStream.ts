import { useEffect, useMemo, useState } from 'react';
import {
  createIntervalStreamAdapter,
  type RealtimeStreamAdapter,
} from '@/features/realtime/streamAdapter';

export type RealtimeStatus = 'off' | 'live' | 'paused' | 'stale' | 'error';

const DEFAULT_STALE_AFTER_MS = 12_000;

export function resolveRealtimeStatus({
  enabled,
  paused,
  hasError,
  lastEventAt,
  staleAfterMs,
  now,
}: {
  enabled: boolean;
  paused: boolean;
  hasError: boolean;
  lastEventAt: number | null;
  staleAfterMs: number;
  now: number;
}): RealtimeStatus {
  if (!enabled) return 'off';
  if (paused) return 'paused';
  if (hasError) return 'error';
  if (!lastEventAt) return 'stale';
  if (now - lastEventAt > staleAfterMs) return 'stale';
  return 'live';
}

export function useRealtimeStream({
  enabled,
  paused,
  onTick,
  staleAfterMs = DEFAULT_STALE_AFTER_MS,
  adapter = createIntervalStreamAdapter(),
}: {
  enabled: boolean;
  paused: boolean;
  onTick: () => void;
  staleAfterMs?: number;
  adapter?: RealtimeStreamAdapter;
}) {
  const [lastEventAt, setLastEventAt] = useState<number | null>(null);
  const [hasError, setHasError] = useState(false);
  const [now, setNow] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!enabled || paused) {
      return;
    }

    const stop = adapter.start({
      onEvent: (event) => {
        setHasError(false);
        setLastEventAt(event.emittedAt);
        onTick();
      },
      onError: () => {
        setHasError(true);
      },
    });

    return () => {
      stop();
    };
  }, [adapter, enabled, onTick, paused]);

  const status = useMemo(
    () =>
      resolveRealtimeStatus({
        enabled,
        paused,
        hasError,
        lastEventAt,
        staleAfterMs,
        now,
      }),
    [enabled, paused, hasError, lastEventAt, staleAfterMs, now],
  );

  return {
    status,
    lastEventAt,
  };
}
