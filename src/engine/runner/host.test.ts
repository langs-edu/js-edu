import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { JsSandbox } from './host';

/**
 * ブラウザのWorkerを最小限だけ再現するフェイク。
 * host.tsは `new Worker(url, { type: 'module' })` と addEventListener/postMessage/terminate
 * しか使わないので、その範囲だけ実装すればよい。
 */
class FakeWorker {
  listeners: Record<string, ((e: { data: unknown }) => void)[]> = {};
  terminated = false;
  posted: unknown[] = [];

  constructor(_url: unknown, _opts?: unknown) {
    created.push(this);
  }

  addEventListener(type: string, cb: (e: { data: unknown }) => void): void {
    (this.listeners[type] ??= []).push(cb);
  }

  removeEventListener(type: string, cb: (e: { data: unknown }) => void): void {
    this.listeners[type] = (this.listeners[type] ?? []).filter((f) => f !== cb);
  }

  postMessage(msg: unknown): void {
    this.posted.push(msg);
  }

  terminate(): void {
    this.terminated = true;
  }

  /** テストから、Workerがホストへ送ってきたメッセージを模擬する */
  emit(type: string, data: unknown): void {
    for (const cb of [...(this.listeners[type] ?? [])]) cb({ data });
  }
}

let created: FakeWorker[] = [];

beforeEach(() => {
  created = [];
  vi.stubGlobal('Worker', FakeWorker as unknown as typeof Worker);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

/** マイクロタスクキューを吐き出す小さなヘルパ */
async function flush() {
  await Promise.resolve();
  await Promise.resolve();
}

describe('JsSandbox', () => {
  it('起動完了(ready)を待ってからrunメッセージを送り、doneで正常結果を返す', async () => {
    const sandbox = new JsSandbox();
    const onConsole = vi.fn();

    const resultPromise = sandbox.run('console.log(1)', { onConsole });
    const worker = created[0]!;
    expect(worker.posted).toHaveLength(0); // ready前はまだpostMessageしていない

    worker.emit('message', { type: 'ready' });
    await flush();

    expect(worker.posted).toHaveLength(1);
    expect(worker.posted[0]).toMatchObject({ type: 'run', code: 'console.log(1)' });

    worker.emit('message', { type: 'console', id: 1, level: 'log', text: '1' });
    worker.emit('message', { type: 'done', id: 1, durationMs: 3 });

    const result = await resultPromise;
    expect(result).toEqual({ ok: true, timedOut: false, durationMs: 3 });
    expect(onConsole).toHaveBeenCalledWith('log', '1');
  });

  it('errorメッセージを受け取ると、その内容を結果に反映する', async () => {
    const sandbox = new JsSandbox();
    const resultPromise = sandbox.run('nai.hoge');
    const worker = created[0]!;

    worker.emit('message', { type: 'ready' });
    await flush();
    worker.emit('message', { type: 'error', id: 1, name: 'ReferenceError', message: 'nai is not defined', line: 1 });

    const result = await resultPromise;
    expect(result.ok).toBe(false);
    expect(result.timedOut).toBe(false);
    expect(result.error).toEqual({ name: 'ReferenceError', message: 'nai is not defined', line: 1 });
  });

  it('無限ループはタイムアウトし、Workerをterminateして作り直せる状態にする', async () => {
    vi.useFakeTimers();
    const sandbox = new JsSandbox();
    const resultPromise = sandbox.run('while (true) {}', { timeoutMs: 50 });
    const worker = created[0]!;

    worker.emit('message', { type: 'ready' });
    await flush();
    expect(worker.posted).toHaveLength(1);

    await vi.advanceTimersByTimeAsync(50);
    const result = await resultPromise;

    expect(result.ok).toBe(false);
    expect(result.timedOut).toBe(true);
    expect(worker.terminated).toBe(true);
  });

  it('起動(ready)が一定時間来ない場合もタイムアウト扱いにする', async () => {
    vi.useFakeTimers();
    const sandbox = new JsSandbox();
    const resultPromise = sandbox.run('console.log(1)');
    const worker = created[0]!;

    // readyを送らないまま、spawnのタイムアウト(15秒)を過ぎさせる
    await vi.advanceTimersByTimeAsync(15_000);
    const result = await resultPromise;

    expect(result).toEqual({ ok: false, timedOut: true, durationMs: 0 });
    void worker; // spawnタイムアウト時はWorkerを直接terminateしないため未使用
  });

  it('dispose()するとWorkerがterminateされ、次のrunで新しいWorkerが立ち上がる', async () => {
    const sandbox = new JsSandbox();
    const first = sandbox.run('console.log(1)');
    const worker1 = created[0]!;
    worker1.emit('message', { type: 'ready' });
    await flush();
    worker1.emit('message', { type: 'done', id: 1, durationMs: 1 });
    await first;

    sandbox.dispose();
    expect(worker1.terminated).toBe(true);

    const second = sandbox.run('console.log(2)');
    const worker2 = created[1]!;
    expect(worker2).not.toBe(worker1);
    worker2.emit('message', { type: 'ready' });
    await flush();
    worker2.emit('message', { type: 'done', id: 1, durationMs: 1 });
    await second;
  });

  it('warmup()はWorkerを事前に立ち上げるだけで、runメッセージは送らない', () => {
    const sandbox = new JsSandbox();
    sandbox.warmup();
    expect(created).toHaveLength(1);
    expect(created[0]!.posted).toHaveLength(0);
  });
});
