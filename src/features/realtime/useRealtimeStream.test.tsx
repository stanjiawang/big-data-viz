import { act, renderHook } from '@testing-library/react';
import { resolveRealtimeStatus, useRealtimeStream } from '@/features/realtime/useRealtimeStream';
import type { RealtimeStreamAdapter } from '@/features/realtime/streamAdapter';

describe('useRealtimeStream', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('resolves status transitions correctly', () => {
    expect(
      resolveRealtimeStatus({
        enabled: false,
        paused: false,
        hasError: false,
        lastEventAt: null,
        staleAfterMs: 10_000,
        now: 100,
      }),
    ).toBe('off');

    expect(
      resolveRealtimeStatus({
        enabled: true,
        paused: true,
        hasError: false,
        lastEventAt: null,
        staleAfterMs: 10_000,
        now: 100,
      }),
    ).toBe('paused');

    expect(
      resolveRealtimeStatus({
        enabled: true,
        paused: false,
        hasError: false,
        lastEventAt: 0,
        staleAfterMs: 10,
        now: 100,
      }),
    ).toBe('stale');

    expect(
      resolveRealtimeStatus({
        enabled: true,
        paused: false,
        hasError: false,
        lastEventAt: 100,
        staleAfterMs: 10_000,
        now: 1_000,
      }),
    ).toBe('live');
  });

  it('ticks and reports live status when adapter emits events', () => {
    const subscribers: Array<(_timestamp: number) => void> = [];
    const adapter: RealtimeStreamAdapter = {
      start: ({ onEvent }) => {
        const subscriber = (timestamp: number) =>
          onEvent({
            id: 1,
            emittedAt: timestamp,
          });
        subscribers.push(subscriber);
        return () => {
          const index = subscribers.indexOf(subscriber);
          if (index >= 0) {
            subscribers.splice(index, 1);
          }
        };
      },
    };

    const onTick = jest.fn();
    const { result } = renderHook(() =>
      useRealtimeStream({
        enabled: true,
        paused: false,
        onTick,
        staleAfterMs: 5_000,
        adapter,
      }),
    );

    expect(result.current.status).toBe('stale');

    act(() => {
      subscribers[0](Date.now());
    });

    expect(onTick).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('live');
  });
});
