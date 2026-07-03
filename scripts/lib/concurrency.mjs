/**
 * 依存パッケージなしの簡易並行実行プール。
 * @template T, R
 * @param {T[]} items
 * @param {number} limit
 * @param {(item: T, index: number) => Promise<R>} worker
 * @returns {Promise<R[]>}
 */
export async function runWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;

  async function run() {
    while (cursor < items.length) {
      const current = cursor;
      cursor += 1;
      results[current] = await worker(items[current], current);
    }
  }

  const poolSize = Math.max(1, Math.min(limit, items.length));
  const runners = Array.from({ length: poolSize }, () => run());
  await Promise.all(runners);
  return results;
}
