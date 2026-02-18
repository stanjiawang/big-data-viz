import type { DragEvent } from 'react';
import { act, renderHook } from '@testing-library/react';
import { useDragReorder } from '@/features/dashboard/ui/useDragReorder';

type DragEventLike = {
  preventDefault: () => void;
  dataTransfer: {
    dropEffect: string;
  };
};

function createDragEventLike(): DragEventLike {
  return {
    preventDefault: jest.fn(),
    dataTransfer: {
      dropEffect: 'none',
    },
  };
}

describe('useDragReorder', () => {
  afterEach(() => {
    window.localStorage.clear();
    jest.restoreAllMocks();
  });

  it('reorders ids on drop and persists to storage', () => {
    const { result } = renderHook(() => useDragReorder(['a', 'b', 'c'] as const, 'order-key'));
    const dragEvent = createDragEventLike();

    expect(result.current.order).toEqual(['a', 'b', 'c']);

    act(() => {
      result.current.onDragStart('c');
    });

    act(() => {
      result.current.onDragOver(dragEvent as unknown as DragEvent, 'a');
    });

    act(() => {
      result.current.onDrop('a');
    });

    expect(result.current.order).toEqual(['c', 'a', 'b']);
    expect(JSON.parse(window.localStorage.getItem('order-key') ?? '[]')).toEqual(['c', 'a', 'b']);
  });

  it('hydrates from localStorage and appends missing ids in fallback order', () => {
    window.localStorage.setItem('persisted-order', JSON.stringify(['b']));

    const { result } = renderHook(() =>
      useDragReorder(['a', 'b', 'c'] as const, 'persisted-order'),
    );

    expect(result.current.order).toEqual(['b', 'a', 'c']);
  });

  it('falls back when localStorage read fails', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    const { result } = renderHook(() => useDragReorder(['x', 'y'] as const, 'blocked-storage'));
    expect(result.current.order).toEqual(['x', 'y']);
  });
});
