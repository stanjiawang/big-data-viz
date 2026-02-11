import { recordMetric } from '@/lib/telemetry';

type PerformanceObserverEntry = {
  name?: string;
  value?: number;
  startTime?: number;
  duration?: number;
  hadRecentInput?: boolean;
  interactionId?: number;
};

type PerformanceObserverListLike = {
  getEntries: () => PerformanceObserverEntry[];
};

type PerformanceObserverLike = {
  observe: (_options: { type: string; buffered?: boolean }) => void;
  disconnect: () => void;
};

type PerformanceObserverCtor = new (
  _callback: (_list: PerformanceObserverListLike) => void,
) => PerformanceObserverLike;

function nowMs() {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }

  return Date.now();
}

function emitWebVital(name: 'LCP' | 'INP' | 'CLS' | 'FCP' | 'TTFB', value: number) {
  recordMetric(`web_vital.${name.toLowerCase()}`, Number(value.toFixed(2)), {
    metric: name,
    path: typeof window !== 'undefined' ? window.location.pathname : undefined,
  });
}

function emitRouteMetric(valueMs: number, path: string) {
  recordMetric('route.transition_ms', Number(valueMs.toFixed(2)), {
    path,
  });
}

function withPerformanceObserver(
  type: string,
  callback: (_entries: PerformanceObserverEntry[]) => void,
): (() => void) | null {
  if (typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') {
    return null;
  }

  const ObserverCtor = PerformanceObserver as unknown as PerformanceObserverCtor;

  try {
    const observer = new ObserverCtor((list) => {
      callback(list.getEntries());
    });

    observer.observe({ type, buffered: true });

    return () => observer.disconnect();
  } catch {
    return null;
  }
}

function initCoreWebVitals() {
  const cleanups: Array<() => void> = [];

  const navigationEntry =
    typeof performance !== 'undefined' && typeof performance.getEntriesByType === 'function'
      ? performance.getEntriesByType('navigation')[0]
      : undefined;

  if (navigationEntry && 'responseStart' in navigationEntry && 'startTime' in navigationEntry) {
    const responseStart = Number(
      (navigationEntry as { responseStart?: number }).responseStart ?? 0,
    );
    const startTime = Number((navigationEntry as { startTime?: number }).startTime ?? 0);
    const ttfb = responseStart - startTime;
    if (Number.isFinite(ttfb) && ttfb >= 0) {
      emitWebVital('TTFB', ttfb);
    }
  }

  const fcpCleanup = withPerformanceObserver('paint', (entries) => {
    const fcpEntry = entries.find((entry) => entry.name === 'first-contentful-paint');
    if (!fcpEntry || typeof fcpEntry.startTime !== 'number') {
      return;
    }

    emitWebVital('FCP', fcpEntry.startTime);
  });
  if (fcpCleanup) {
    cleanups.push(fcpCleanup);
  }

  let lcpValue = 0;
  const lcpCleanup = withPerformanceObserver('largest-contentful-paint', (entries) => {
    const latest = entries.at(-1);
    if (!latest || typeof latest.startTime !== 'number') {
      return;
    }

    lcpValue = latest.startTime;
  });
  if (lcpCleanup) {
    const onVisibilityChange = () => {
      if (document.visibilityState !== 'hidden' || lcpValue <= 0) {
        return;
      }

      emitWebVital('LCP', lcpValue);
    };

    document.addEventListener('visibilitychange', onVisibilityChange, { once: true });

    cleanups.push(() => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      lcpCleanup();
    });
  }

  let clsValue = 0;
  const clsCleanup = withPerformanceObserver('layout-shift', (entries) => {
    entries.forEach((entry) => {
      if (entry.hadRecentInput) {
        return;
      }

      const value = typeof entry.value === 'number' ? entry.value : 0;
      clsValue += value;
    });

    if (clsValue > 0) {
      emitWebVital('CLS', clsValue);
    }
  });
  if (clsCleanup) {
    cleanups.push(clsCleanup);
  }

  let inpValue = 0;
  const inpCleanup = withPerformanceObserver('event', (entries) => {
    entries.forEach((entry) => {
      if (!entry.interactionId || typeof entry.duration !== 'number') {
        return;
      }

      inpValue = Math.max(inpValue, entry.duration);
    });

    if (inpValue > 0) {
      emitWebVital('INP', inpValue);
    }
  });
  if (inpCleanup) {
    cleanups.push(inpCleanup);
  }

  return () => {
    cleanups.forEach((cleanup) => cleanup());
  };
}

function scheduleAfterPaint(callback: () => void) {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      callback();
    });
  });
}

function initRouteTelemetry() {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  let lastPath = window.location.pathname;
  let routeStart = nowMs();

  const emitIfChanged = () => {
    const nextPath = window.location.pathname;
    if (nextPath === lastPath) {
      return;
    }

    routeStart = nowMs();
    lastPath = nextPath;

    scheduleAfterPaint(() => {
      emitRouteMetric(nowMs() - routeStart, nextPath);
    });
  };

  const originalPushState = window.history.pushState.bind(window.history);
  const originalReplaceState = window.history.replaceState.bind(window.history);

  window.history.pushState = ((...args: Parameters<History['pushState']>) => {
    originalPushState(...args);
    emitIfChanged();
  }) as History['pushState'];

  window.history.replaceState = ((...args: Parameters<History['replaceState']>) => {
    originalReplaceState(...args);
    emitIfChanged();
  }) as History['replaceState'];

  const onPopState = () => emitIfChanged();
  window.addEventListener('popstate', onPopState);

  return () => {
    window.history.pushState = originalPushState;
    window.history.replaceState = originalReplaceState;
    window.removeEventListener('popstate', onPopState);
  };
}

export function initPerformanceTelemetry() {
  const stopVitals = initCoreWebVitals();
  const stopRouteMetrics = initRouteTelemetry();

  return () => {
    stopRouteMetrics();
    stopVitals();
  };
}
