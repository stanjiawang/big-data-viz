import { mulberry32, pick, randomInRange } from '@/lib/random';

describe('random utilities', () => {
  it('mulberry32 generates deterministic sequence', () => {
    const next = mulberry32(42);
    const first = next();
    const second = next();
    expect(first).not.toBe(second);

    const nextAgain = mulberry32(42);
    expect(nextAgain()).toBe(first);
  });

  it('randomInRange stays within bounds', () => {
    const next = () => 0.5;
    const value = randomInRange(next, 10, 20);
    expect(value).toBe(15);
  });

  it('pick selects item from list', () => {
    const next = () => 0.9;
    const item = pick(next, ['a', 'b', 'c']);
    expect(item).toBe('c');
  });
});
