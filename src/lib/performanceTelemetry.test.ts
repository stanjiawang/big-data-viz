const recordMetricMock = jest.fn();

jest.mock('@/lib/telemetry', () => ({
  recordMetric: (...args: unknown[]) => recordMetricMock(...args),
}));

import { initPerformanceTelemetry } from '@/lib/performanceTelemetry';

type Entry = {
  name?: string;
  value?: number;
  startTime?: number;
  duration?: number;
  hadRecentInput?: boolean;
  interactionId?: number;
};

describe('performanceTelemetry', () => {
  const originalPerformanceObserver = globalThis.PerformanceObserver;
  const originalGetEntriesByType = (
    performance as Performance & {
      getEntriesByType?: (_entryType: string) => unknown[];
    }
  ).getEntriesByType;
  const originalRequestAnimationFrame = window.requestAnimationFrame;

  let observers: Array<{
    type?: string;
    callback: (_entries: Entry[]) => void;
  }> = [];

  function emit(type: string, entries: Entry[]) {
    const observer = observers.find((item) => item.type === type);
    if (observer) {
      observer.callback(entries);
    }
  }

  beforeEach(() => {
    recordMetricMock.mockReset();
    observers = [];
    window.history.replaceState({}, '', '/');

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });

    Object.defineProperty(performance, 'getEntriesByType', {
      configurable: true,
      value: (entryType: string) => {
        if (entryType === 'navigation') {
          return [{ startTime: 0, responseStart: 120 }];
        }

        return [];
      },
    });

    class PerformanceObserverMock {
      private readonly handler: (_entries: Entry[]) => void;

      constructor(callback: (_list: { getEntries: () => Entry[] }) => void) {
        this.handler = (entries) => callback({ getEntries: () => entries });
      }

      observe(options: { type: string }) {
        observers.push({
          type: options.type,
          callback: this.handler,
        });
      }

      disconnect() {
        return;
      }
    }

    Object.defineProperty(globalThis, 'PerformanceObserver', {
      configurable: true,
      value: PerformanceObserverMock,
    });

    window.requestAnimationFrame = ((callback: FrameRequestCallback) => {
      callback(16);
      return 1;
    }) as typeof window.requestAnimationFrame;
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'PerformanceObserver', {
      configurable: true,
      value: originalPerformanceObserver,
    });

    if (originalGetEntriesByType) {
      Object.defineProperty(performance, 'getEntriesByType', {
        configurable: true,
        value: originalGetEntriesByType,
      });
    } else {
      Reflect.deleteProperty(performance, 'getEntriesByType');
    }

    window.requestAnimationFrame = originalRequestAnimationFrame;
  });

  it('emits web vitals and route metrics', () => {
    const stop = initPerformanceTelemetry();

    emit('paint', [{ name: 'first-contentful-paint', startTime: 450 }]);
    emit('layout-shift', [{ value: 0.12, hadRecentInput: false }]);
    emit('event', [{ interactionId: 12, duration: 180 }]);
    emit('largest-contentful-paint', [{ startTime: 900 }]);

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden',
    });
    document.dispatchEvent(new Event('visibilitychange'));

    window.history.pushState({}, '', '/analytics');

    expect(recordMetricMock).toHaveBeenCalledWith(
      'web_vital.ttfb',
      120,
      expect.objectContaining({ metric: 'TTFB' }),
    );
    expect(recordMetricMock).toHaveBeenCalledWith(
      'web_vital.fcp',
      450,
      expect.objectContaining({ metric: 'FCP' }),
    );
    expect(recordMetricMock).toHaveBeenCalledWith(
      'web_vital.cls',
      0.12,
      expect.objectContaining({ metric: 'CLS' }),
    );
    expect(recordMetricMock).toHaveBeenCalledWith(
      'web_vital.inp',
      180,
      expect.objectContaining({ metric: 'INP' }),
    );
    expect(recordMetricMock).toHaveBeenCalledWith(
      'web_vital.lcp',
      900,
      expect.objectContaining({ metric: 'LCP' }),
    );
    expect(recordMetricMock).toHaveBeenCalledWith(
      'route.transition_ms',
      expect.any(Number),
      expect.objectContaining({ path: '/analytics' }),
    );

    stop();
  });

  it('does not emit route metrics for query-only updates', () => {
    initPerformanceTelemetry();

    window.history.replaceState({}, '', '/?source=user');

    const routeMetricCalls = recordMetricMock.mock.calls.filter(
      (call) => call[0] === 'route.transition_ms',
    );

    expect(routeMetricCalls).toHaveLength(0);
  });
});
