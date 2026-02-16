export type StreamEvent = {
  id: number;
  emittedAt: number;
};

export type StreamCallbacks = {
  onEvent: (_event: StreamEvent) => void;
  onError?: (_error: Error) => void;
};

export type RealtimeStreamAdapter = {
  start: (_callbacks: StreamCallbacks) => () => void;
};

export function createIntervalStreamAdapter(intervalMs = 4_000): RealtimeStreamAdapter {
  return {
    start: ({ onEvent, onError }) => {
      let sequence = 0;
      const timer = window.setInterval(() => {
        try {
          sequence += 1;
          onEvent({
            id: sequence,
            emittedAt: Date.now(),
          });
        } catch (error) {
          if (onError) {
            onError(error instanceof Error ? error : new Error('unknown stream error'));
          }
        }
      }, intervalMs);

      return () => {
        window.clearInterval(timer);
      };
    },
  };
}
