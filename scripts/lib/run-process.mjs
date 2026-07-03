import { spawn } from 'node:child_process';

/**
 * 子プロセスを起動し、標準入力に書き込み、標準出力/標準エラーを集めて返す。
 * 依存パッケージなしの薄いラッパ（child_processのspawnのみを使う）。
 * 実プロセスを起動するためユニットテスト対象からは除外している。
 *
 * @param {string} cmd
 * @param {string[]} args
 * @param {{ cwd?: string, input?: string, timeoutMs?: number }} [options]
 * @returns {Promise<{ code: number|null, stdout: string, stderr: string, timedOut: boolean }>}
 */
export function runProcess(cmd, args, options = {}) {
  const { cwd, input, timeoutMs } = options;
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd });
    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = timeoutMs
      ? setTimeout(() => {
          timedOut = true;
          child.kill('SIGKILL');
        }, timeoutMs)
      : null;

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString('utf8');
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString('utf8');
    });

    child.on('close', (code) => {
      if (timer) clearTimeout(timer);
      resolve({ code, stdout, stderr, timedOut });
    });

    child.on('error', (err) => {
      if (timer) clearTimeout(timer);
      resolve({ code: -1, stdout, stderr: String(err), timedOut });
    });

    if (input !== undefined) {
      child.stdin.write(input, 'utf8');
    }
    child.stdin.end();
  });
}
