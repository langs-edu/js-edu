import { describe, expect, it } from 'vitest';
import { runWithConcurrency } from './concurrency.mjs';

describe('runWithConcurrency', () => {
  it('runs every item and preserves output order', async () => {
    const items = [5, 1, 3, 2, 4];
    const results = await runWithConcurrency(items, 2, async (n) => {
      await new Promise((r) => setTimeout(r, n));
      return n * 10;
    });
    expect(results).toEqual([50, 10, 30, 20, 40]);
  });

  it('never runs more than the given limit at once', async () => {
    let active = 0;
    let maxActive = 0;
    const items = Array.from({ length: 8 }, (_, i) => i);
    await runWithConcurrency(items, 3, async (n) => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((r) => setTimeout(r, 5));
      active -= 1;
      return n;
    });
    expect(maxActive).toBeLessThanOrEqual(3);
  });

  it('handles an empty item list', async () => {
    const results = await runWithConcurrency([], 4, async (n) => n);
    expect(results).toEqual([]);
  });

  it('clamps the pool size when the limit exceeds the item count', async () => {
    const results = await runWithConcurrency([1, 2], 10, async (n) => n * 2);
    expect(results).toEqual([2, 4]);
  });
});
