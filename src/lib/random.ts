export function mulberry32(seed: number) {
  let t = seed >>> 0;
  return function next() {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomInRange(next: () => number, min: number, max: number) {
  return min + (max - min) * next();
}

export function pick<T>(next: () => number, items: T[]) {
  return items[Math.floor(next() * items.length)];
}
