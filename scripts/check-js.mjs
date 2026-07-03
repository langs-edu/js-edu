#!/usr/bin/env node
/**
 * JavaScript縁日 コード検証ハーネス。
 *
 * src/content/lessons/**\/*.mdx と src/content/yatai/**\/*.mdx を走査し、
 * ```js フェンスと、`<CodeRunner ... initialCode={`...`} ... />` の initialCode を
 * 実際に Node.js で実行して検証する。依存パッケージなし（Node標準ライブラリのみ）。
 *
 * ```html / ```console フェンスと、initialCode の nocheck 指定はブラウザ専用・非決定的な
 * コードとして検証をスキップする。expectError / expect-error 指定は、非ゼロ終了を成功とみなす。
 *
 * 使い方: node scripts/check-js.mjs
 */
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

import { classifyJsMeta, extractCodeBlocks, extractCodeRunnerBlocks } from './lib/extract-blocks.mjs';
import { runWithConcurrency } from './lib/concurrency.mjs';
import { runProcess } from './lib/run-process.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const TARGET_DIRS = [join(ROOT, 'src/content/lessons'), join(ROOT, 'src/content/yatai')];
const CONCURRENCY = 4;
const BLOCK_TIMEOUT_MS = 10_000; // 1ブロックあたりのタイムアウト
const NODE = process.execPath; // このスクリプトを動かしているNode本体を使う（バージョンのブレを防ぐ）

async function walkMdxFiles(dir) {
  const found = [];
  async function walk(current) {
    let entries;
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      return; // ディレクトリが存在しない場合は何もしない
    }
    for (const entry of entries) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.isFile() && entry.name.endsWith('.mdx')) {
        found.push(full);
      }
    }
  }
  await walk(dir);
  return found;
}

/**
 * 1ファイル分のソースから、実行対象/スキップ対象のジョブ列を作る。
 * @param {string} source
 * @param {string} file
 */
function buildFileJobs(source, file) {
  const jobs = [];

  for (const block of extractCodeBlocks(source, file)) {
    if (block.lang === 'html' || block.lang === 'console') {
      jobs.push({ kind: 'nocheck', file, line: block.line, label: `\`\`\`${block.lang}` });
      continue;
    }
    // lang === 'js'
    const cls = classifyJsMeta(block.meta);
    if (cls.mode === 'nocheck') {
      jobs.push({ kind: 'nocheck', file, line: block.line, label: '```js nocheck' });
    } else {
      jobs.push({
        kind: 'run',
        file,
        line: block.line,
        source: 'fence',
        label: cls.mode === 'file' ? `\`\`\`js title="${cls.filename}"` : '```js',
        body: block.body,
        expectError: cls.expectError,
      });
    }
  }

  for (const cr of extractCodeRunnerBlocks(source, file)) {
    const label = `<CodeRunner storageKey="${cr.storageKey ?? '?'}">`;
    if (cr.nocheck) {
      jobs.push({ kind: 'nocheck', file, line: cr.line, label });
    } else {
      jobs.push({
        kind: 'run',
        file,
        line: cr.line,
        source: 'coderunner',
        label,
        body: cr.code,
        expectError: cr.expectError,
      });
    }
  }

  return jobs;
}

function combinedOutput(stdout, stderr) {
  return [stdout, stderr].filter(Boolean).join('\n').trim();
}

async function runJob(job) {
  const workDir = await mkdtemp(join(tmpdir(), 'js-ennichi-'));
  try {
    const srcPath = join(workDir, 'block.mjs');
    await mkdir(workDir, { recursive: true });
    await writeFile(srcPath, job.body, 'utf8');

    const { code, stdout, stderr, timedOut } = await runProcess(NODE, [srcPath], {
      cwd: workDir,
      timeoutMs: BLOCK_TIMEOUT_MS,
    });
    if (timedOut) {
      return { ok: false, reason: 'Node.js の実行がタイムアウトしました（無限ループの疑い）。' };
    }

    const succeeded = job.expectError ? code !== 0 : code === 0;
    if (succeeded) return { ok: true };

    const output = combinedOutput(stdout, stderr);
    if (job.expectError) {
      return {
        ok: false,
        reason: `expectError / expect-error 指定ですが exit code 0 で正常終了しました（エラーが発生しませんでした）。\n${output}`,
      };
    }
    return { ok: false, reason: `Node.js が exit code ${code} で終了しました。\n${output}` };
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

function indentReason(reason) {
  return reason
    .split('\n')
    .map((l) => `      ${l}`)
    .join('\n');
}

function printReport({ nodeVersion, total, verifiedCount, nocheckJobs, failed }) {
  const lines = [];
  lines.push('');
  lines.push('== JavaScript縁日 コード検証レポート ==');
  lines.push(`使用インタプリタ: ${NODE} — ${nodeVersion}`);
  lines.push(`総ブロック数: ${total}`);
  lines.push(`検証済み: ${verifiedCount}`);
  lines.push(`スキップ (nocheck / html / console): ${nocheckJobs.length}`);
  for (const job of nocheckJobs) {
    lines.push(`  - ${relative(ROOT, job.file)}:${job.line} (${job.label})`);
  }
  lines.push(`失敗: ${failed.length}`);
  for (const { job, reason } of failed) {
    lines.push(`  - ${relative(ROOT, job.file)}:${job.line} (${job.label})`);
    lines.push(indentReason(reason));
  }
  lines.push('');
  console.log(lines.join('\n'));
}

async function main() {
  const nodeVersion = process.version;
  console.log(`使用インタプリタ: ${NODE} — ${nodeVersion}`);

  const files = (await Promise.all(TARGET_DIRS.map(walkMdxFiles))).flat().sort();

  const allJobs = [];
  for (const file of files) {
    const source = await readFile(file, 'utf8');
    allJobs.push(...buildFileJobs(source, file));
  }

  const nocheckJobs = allJobs.filter((j) => j.kind === 'nocheck');
  const runnableJobs = allJobs.filter((j) => j.kind === 'run');

  const results = await runWithConcurrency(runnableJobs, CONCURRENCY, (job) => runJob(job));

  const failed = [];
  let verifiedCount = 0;
  runnableJobs.forEach((job, i) => {
    const result = results[i];
    if (result.ok) {
      verifiedCount += 1;
    } else {
      failed.push({ job, reason: result.reason });
    }
  });

  printReport({ nodeVersion, total: allJobs.length, verifiedCount, nocheckJobs, failed });

  process.exitCode = failed.length > 0 ? 1 : 0;
}

main().catch((err) => {
  console.error('check-js.mjs が予期せぬエラーで終了しました:', err);
  process.exitCode = 1;
});
