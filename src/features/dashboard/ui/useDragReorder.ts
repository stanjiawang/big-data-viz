import type { DragEvent } from 'react';
import { useEffect, useState } from 'react';

function moveItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
    return items;
  }

  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

export function useDragReorder<T extends string>(ids: readonly T[], storageKey: string) {
  const [order, setOrder] = useState<T[]>(() => {
    const fallback = [...ids];
    if (typeof window === 'undefined') {
      return fallback;
    }

    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(storageKey);
    } catch {
      return fallback;
    }
    if (!raw) return fallback;

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return fallback;
      const kept = fallback.filter((id) => parsed.includes(id));
      const missing = fallback.filter((id) => !kept.includes(id));
      return [...kept, ...missing];
    } catch {
      return fallback;
    }
  });
  const [draggingId, setDraggingId] = useState<T | null>(null);
  const [overId, setOverId] = useState<T | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(order));
    } catch {
      // no-op: storage may be unavailable in private mode or restricted environments.
    }
  }, [order, storageKey]);

  const onDragStart = (id: T) => {
    setDraggingId(id);
    setOverId(id);
  };

  const onDragOver = (event: DragEvent, id: T) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    if (overId !== id) {
      setOverId(id);
    }
  };

  const onDrop = (id: T) => {
    if (!draggingId) return;
    setOrder((current) => {
      const fromIndex = current.indexOf(draggingId);
      const toIndex = current.indexOf(id);
      return moveItem(current, fromIndex, toIndex);
    });
    setDraggingId(null);
    setOverId(null);
  };

  const onDragEnd = () => {
    setDraggingId(null);
    setOverId(null);
  };

  return {
    order,
    draggingId,
    overId,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
  };
}
